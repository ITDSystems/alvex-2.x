/*
 * Copyright (C) 2005-2011 Alfresco Software Limited.
 * Copyright (C) 2012 ITD Systems
 *
 * This file is part of Alvex
 *
 * Alvex is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Alvex is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Alvex. If not, see <http://www.gnu.org/licenses/>.
 */
package com.alvexcore.repo.documents.generation;

import java.io.*;
import org.apache.poi.*;
import org.apache.poi.xwpf.usermodel.*;
import org.openxmlformats.schemas.wordprocessingml.x2006.main.*;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CreationHelper;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import java.util.List;
import java.util.HashMap;
import java.util.Map;
import java.util.Iterator;
import java.util.ArrayList;
import java.util.regex.Pattern;
import java.util.regex.Matcher;
import org.apache.commons.lang.ArrayUtils;
import org.apache.commons.lang.StringUtils;

import org.springframework.extensions.webscripts.Cache;
import org.springframework.extensions.webscripts.DeclarativeWebScript;
import org.springframework.extensions.webscripts.Status;
import org.springframework.extensions.webscripts.WebScriptRequest;

import org.json.simple.JSONObject;
import org.json.simple.JSONArray;
import org.json.simple.JSONValue;
import org.json.simple.parser.JSONParser;
import org.alfresco.repo.content.MimetypeMap;

import org.springframework.beans.factory.InitializingBean;
import org.alfresco.service.ServiceRegistry;
import org.alfresco.service.namespace.NamespaceService;
import org.alfresco.service.cmr.repository.NodeService;
import org.alfresco.service.cmr.site.SiteService;
import org.alfresco.service.cmr.model.FileFolderService;
import org.alfresco.service.namespace.QName;
import org.alfresco.service.cmr.repository.NodeRef;
import org.alfresco.service.cmr.repository.ChildAssociationRef;
import org.alfresco.service.cmr.site.SiteInfo;
import org.alfresco.model.ContentModel;
import org.alfresco.service.cmr.repository.ContentService;
import org.alfresco.service.cmr.repository.ContentWriter;
import org.alfresco.service.cmr.repository.ContentReader;

import org.springframework.extensions.surf.util.I18NUtil;

public class ExportDataListToXlsx 
		extends DeclarativeWebScript 
		implements InitializingBean
{
	protected ServiceRegistry serviceRegistry;
	protected NodeService nodeService;
	protected SiteService siteService;
	protected ContentService contentService;

	// for spring injection
	public void setServiceRegistry(ServiceRegistry registry) {
		serviceRegistry = registry;
	}

	public void afterPropertiesSet() throws Exception
	{
		nodeService = serviceRegistry.getNodeService();
		siteService = serviceRegistry.getSiteService();
		contentService = serviceRegistry.getContentService();
	}

	protected Map<String, Object> executeImpl(WebScriptRequest req, Status status, Cache cache)
	{
		Map<String, Object> model = new HashMap<String, Object>();

		final String FOLDER_NAME = "datalists-exports";
		final String XLS_SHEET_NAME = "DataList";
		// Parse the JSON, if supplied
		JSONObject json = null;
		String contentType = req.getContentType();
		if (contentType != null && contentType.indexOf(';') != -1)
		{
			contentType = contentType.substring(0, contentType.indexOf(';'));
		}
		if (MimetypeMap.MIMETYPE_JSON.equals(contentType))
		{
			try
			{
				json = (JSONObject)JSONValue.parse(req.getContent().getContent());
			}
			catch (Exception e)
			{
				status.setCode(500);
				model.put("message", "Invalid JSON");
				return model;
			}
		}

		String siteName;
		String fileName;
		JSONArray rows;

		try {
			siteName = (String)json.get("site");
			fileName = (String)json.get("fileName");
			rows = (JSONArray)json.get("rows");
		} catch (Exception e)
		{
			status.setCode(500);
			model.put("message", "Mandatory fields were not provided");
			return model;
		}

		fileName += ".xlsx";

		SiteInfo site = siteService.getSite(siteName);

		NodeRef container = siteService.getContainer(siteName, "documentLibrary");
		if(container == null)
			container = siteService.createContainer(siteName, "documentLibrary", null, null);

		NodeRef folder = getChildByName(container, FOLDER_NAME);

		if(folder == null) {
			Map<QName, Serializable> properties = new HashMap<QName, Serializable>(11);
			properties.put(ContentModel.PROP_NAME, FOLDER_NAME);

			folder = nodeService.createNode( container, ContentModel.ASSOC_CONTAINS, 
				QName.createQName(NamespaceService.CONTENT_MODEL_1_0_URI, FOLDER_NAME), 
				ContentModel.TYPE_FOLDER, properties).getChildRef();
		}

		NodeRef file = getChildByName(folder, fileName);
		if(file == null) {
			Map<QName, Serializable> properties = new HashMap<QName, Serializable>(11);
			properties.put(ContentModel.PROP_NAME, fileName);

			file = nodeService.createNode( folder, ContentModel.ASSOC_CONTAINS, 
				QName.createQName(NamespaceService.CONTENT_MODEL_1_0_URI, fileName), 
				ContentModel.TYPE_CONTENT, properties).getChildRef();
		}

		Workbook wb;

		try {
			wb = createXlsx( rows, XLS_SHEET_NAME );
		} catch (Exception e)
		{
			status.setCode(500);
			model.put("message", "Can not create file");
			return model;
		}

		try {
			ContentWriter writer = contentService.getWriter(file, ContentModel.PROP_CONTENT, true);
			ByteArrayOutputStream baos = new ByteArrayOutputStream();
			wb.write(baos);
			ByteArrayInputStream bais = new ByteArrayInputStream(baos.toByteArray());
			writer.setMimetype(MimetypeMap.MIMETYPE_EXCEL);
			writer.putContent(bais);
		} catch (Exception e)
		{
			status.setCode(500);
			model.put("message", "Can not save file");
			return model;
		}

		model.put("nodeRef", file.toString());
		model.put("name", fileName);
		status.setCode(200);
		return model;
	}

	protected NodeRef getChildByName(NodeRef parent, String name)
	{
		List<ChildAssociationRef> children = nodeService.getChildAssocs(parent);
		for (ChildAssociationRef childAssoc : children) {
			NodeRef childNodeRef = childAssoc.getChildRef();
			// Use childNodeRef here.
			if( name.equals( (String) nodeService.getProperty(childNodeRef, ContentModel.PROP_NAME) ) )
				return childNodeRef;
		}
		return null;
	}

	protected Workbook createXlsx(JSONArray rows, String XLS_SHEET_NAME)
	{

		Workbook wb = new XSSFWorkbook();
		CreationHelper createHelper = wb.getCreationHelper();
		Sheet sheet = wb.createSheet(XLS_SHEET_NAME);

		for(int k = 0; k < rows.size(); k++) {
			Row row = sheet.createRow((short) k);
			JSONArray cells = (JSONArray)rows.get(k);
			for(int c = 0; c < cells.size(); c++)
			{
				String displayValue;
				if( cells.get(c) instanceof Boolean )
				{
					if( (Boolean)cells.get(c) )
						displayValue = I18NUtil.getMessage("label.yes");
					else
						displayValue = I18NUtil.getMessage("label.no");
				}
				else
				{
					displayValue = (String)cells.get(c);
				}
				row.createCell(c).setCellValue( createHelper.createRichTextString( displayValue ) );
			}
		}

		return wb;
	}

}
