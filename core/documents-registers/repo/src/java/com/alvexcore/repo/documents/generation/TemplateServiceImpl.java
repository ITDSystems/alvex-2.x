package com.alvexcore.repo.documents.generation;

import org.alfresco.model.ContentModel;
import org.alfresco.service.ServiceRegistry;
import org.alfresco.service.cmr.repository.NodeService;
import org.alfresco.service.cmr.security.AuthorityService;
import org.alfresco.service.cmr.security.PermissionService;
import org.alfresco.service.namespace.NamespaceService;
import org.alfresco.service.cmr.repository.ContentService;
import org.alfresco.service.cmr.repository.ContentWriter;
import org.alfresco.service.cmr.repository.ContentReader;

import org.springframework.beans.factory.InitializingBean;
import org.springframework.beans.factory.annotation.Required;

import org.alfresco.service.cmr.repository.NodeRef;
import org.alfresco.service.namespace.QName;
import org.alfresco.service.cmr.repository.ChildAssociationRef;

import java.io.*;
import org.apache.poi.*;
import org.apache.poi.xwpf.usermodel.*;
import org.openxmlformats.schemas.wordprocessingml.x2006.main.*;

import org.json.simple.JSONObject;
import org.json.simple.JSONArray;
import org.json.simple.JSONValue;
import org.json.simple.parser.JSONParser;
import org.alfresco.repo.content.MimetypeMap;

import java.util.List;
import java.util.HashMap;
import java.util.Map;
import java.util.Iterator;
import java.util.ArrayList;
import java.util.regex.Pattern;
import java.util.regex.Matcher;
import org.apache.commons.lang.ArrayUtils;
import org.apache.commons.lang.StringUtils;



public class TemplateServiceImpl implements InitializingBean, TemplateService {

	protected NodeService nodeService;
	protected AuthorityService authorityService;
	protected PermissionService permissionService;
	protected ServiceRegistry serviceRegistry;
	protected ContentService contentService;

	/*
	 * Setters and getters 
	 */

	/* (non-Javadoc)
	 * @see com.alvexcore.repo.orgchart.OrgchartServiceX#getServiceRegistry()
	 */
	@Override
	public ServiceRegistry getServiceRegistry() {
		return serviceRegistry;
	}

	/**
	 * Sets service registry
	 * @param serviceRegistry ServiceRegistry instance
	 */
	@Required
	public void setServiceRegistry(ServiceRegistry serviceRegistry) {
		this.serviceRegistry = serviceRegistry;
	}

	/* (non-Javadoc)
	 * @see com.alvexcore.repo.orgchart.OrgchartServiceX#getNodeService()
	 */
	@Override
	public NodeService getNodeService() {
		return nodeService;
	}

	/* (non-Javadoc)
	 * @see com.alvexcore.repo.orgchart.OrgchartServiceX#getAuthorityService()
	 */
	@Override
	public AuthorityService getAuthorityService() {
		return authorityService;
	}

	/* (non-Javadoc)
	 * @see com.alvexcore.repo.orgchart.OrgchartServiceX#getPermissionService()
	 */
	@Override
	public PermissionService getPermissionService() {
		return permissionService;
	}

	/*
	 * Startup functions
	 */

	@Override
	public void afterPropertiesSet() throws Exception {
		nodeService = serviceRegistry.getNodeService();
		authorityService = serviceRegistry.getAuthorityService();
		permissionService = serviceRegistry.getPermissionService();
		contentService = serviceRegistry.getContentService();
	}

	/* (non-Javadoc)
	 * @see com.alvexcore.repo.orgchart.OrgchartServiceX#setUp()
	 */
	@Override
	public void setUp() throws Exception {
		// 
	}

	@Override
	public boolean test() {
		return true;
	}

	@Override
	public boolean generate(NodeRef templateFile, NodeRef targetFolder, String targetName, String data) throws Exception
	{
		JSONObject json = (JSONObject)JSONValue.parse(data);

		XWPFDocument doc = createDocByTemplate( templateFile, json );

		NodeRef file = getChildByName(targetFolder, targetName);
		if(file == null) {
			Map<QName, Serializable> properties = new HashMap<QName, Serializable>(11);
			properties.put(ContentModel.PROP_NAME, targetName);

			file = nodeService.createNode( targetFolder, ContentModel.ASSOC_CONTAINS, 
				QName.createQName(NamespaceService.CONTENT_MODEL_1_0_URI, targetName), 
				ContentModel.TYPE_CONTENT, properties).getChildRef();
		}

		ContentWriter writer = contentService.getWriter(file, ContentModel.PROP_CONTENT, true);
		ByteArrayOutputStream baos = new ByteArrayOutputStream();
		doc.write(baos);
		ByteArrayInputStream bais = new ByteArrayInputStream(baos.toByteArray());
		writer.setMimetype(MimetypeMap.MIMETYPE_WORD);
		writer.putContent(bais);

		return true;
	}

	private NodeRef getChildByName(NodeRef parent, String name)
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

	private XWPFDocument createDocByTemplate(NodeRef templateFile, JSONObject data)
	{
		ContentReader reader = contentService.getReader(templateFile, ContentModel.PROP_CONTENT);
		InputStream originalInputStream = reader.getContentInputStream();

		XWPFDocument sourceDoc;
		XWPFDocument destDoc;

		try {
			sourceDoc = new XWPFDocument( originalInputStream );

			ByteArrayOutputStream baos = new ByteArrayOutputStream();
			sourceDoc.write(baos);
			ByteArrayInputStream bais = new ByteArrayInputStream(baos.toByteArray());

			destDoc = new XWPFDocument( bais );

			List<IBodyElement> list = destDoc.getBodyElements();
			Iterator<IBodyElement> iter = list.iterator();

			while( iter.hasNext() )
			{
				IBodyElement elem = iter.next();
				if( elem.getClass().equals( XWPFParagraph.class ) )
					processParagraph( (XWPFParagraph)elem, data );
			}

		} catch (Exception e) {
			return null;
		}

		return destDoc;
	}

	private static void processParagraph( XWPFParagraph paragraph, JSONObject json )
	{
		List<XWPFRun> runs = paragraph.getRuns();

		int runsSize = runs.size();
		int curRun = 0;

		while(curRun < runsSize)
		{
			XWPFRun run = runs.get(curRun);
			curRun++;

			//CTR ctr = run.getCTR();
			//List<CTText> tlist = ctr.getTList();
			//List<CTBr> blist = ctr.getBrList();
			//System.out.println("DEBUG: Content: " + run.toString() + " tlist: " + tlist.size() + " blist: " + blist.size());

			String content = run.getText(0);
			if(content == null)
				continue;

			Pattern LIST_PATTERN = Pattern.compile("(.*)<#list (.*?) as (.*?)>(.*)");
			Matcher m = LIST_PATTERN.matcher( content );

			if ( m.find() ) {
				String textBefore = m.group(1);
				String arrName = m.group(2);
				String itemName = m.group(3);
				String textAfter = m.group(4);

				run.setText( textBefore, 0 );
				replaceInRun( run, json );

				XWPFRun runAfter = paragraph.insertNewRun( curRun );
				copyFormatting(run, runAfter);
				runAfter.setText( textAfter, 0 );
				runsSize++;

				List<XWPFRun> repeat_list = new ArrayList<XWPFRun>();

				Pattern LIST_END_PATTERN = Pattern.compile("(.*)<\\/#list>(.*)");

				boolean list_closed = false;
				while( ! list_closed )
				{
					XWPFRun run1 = runs.get( curRun );
					String content1 = run1.getText(0);
					if(content1 == null) {
						repeat_list.add( run1 );
						curRun++;
						continue;
					}

					Matcher m1 = LIST_END_PATTERN.matcher( content1 );
					if ( ! m1.find() ) {
						repeat_list.add( run1 );
						curRun++;
						continue;
					} else {
						String textBefore1 = m1.group(1);
						String textAfter1 = m1.group(2);

						run1.setText( textBefore1, 0 );
						repeat_list.add( run1 );

						XWPFRun runAfter1 = paragraph.insertNewRun( curRun+1 );
						copyFormatting(run1, runAfter1);
						runAfter1.setText( textAfter1, 0 );

						curRun++;
						runsSize++;
						list_closed = true;
					}
				}

				int delta = 0;

				Object arrObj = getFieldFromJSON( json, arrName );
				if( arrObj.getClass().equals( JSONArray.class ) )
				{
					JSONArray arr = (JSONArray)arrObj;
					for(int k = 0; k < arr.size(); k++) {
						json.put(itemName, arr.get(k));
						delta += add_repeat_block(paragraph, curRun + delta, repeat_list, json);
						json.remove(itemName);
					}
				}

				// Remove template itself
				int repeat_size = repeat_list.size();
				for(int k = 0; k < repeat_size; k++) {
					paragraph.removeRun( curRun-1 );
					curRun--;
					runsSize--;
				}

				curRun += delta;
				runsSize += delta;
				
			} else {
				replaceInRun( run, json );
			}
		}
	}

	private static int add_repeat_block(XWPFParagraph paragraph, int curRunPos, List<XWPFRun> repeat, Object json)
	{
		int delta = 0;
		for(int i = 0; i < repeat.size(); i++) {

			CTR ctr = repeat.get(i).getCTR();
			List<CTText> tlist = ctr.getTList();
			List<CTBr> blist = ctr.getBrList();
//			System.out.println("DEBUG: Content: " + repeat.get(i).toString() + " tlist: " + tlist.size() + " blist: " + blist.size());

			XWPFRun runAfter = paragraph.insertNewRun( curRunPos + delta );
			copyFormatting(repeat.get(i), runAfter);
			runAfter.setText( repeat.get(i).getText(0), 0 );
			replaceInRun( runAfter, json );
			for(int j = 0; j < blist.size(); j++)
				runAfter.addBreak();
			delta++;
		}
		return delta;
	}

	private static void copyFormatting(XWPFRun src, XWPFRun dst)
	{
		if( src.isBold() )
			dst.setBold( src.isBold() );
//		dst.setColor( src.getColor() );
		if( src.getFontFamily() != null )
			dst.setFontFamily( src.getFontFamily() );
		if( src.getFontSize() != -1 )
			dst.setFontSize( src.getFontSize() );
		if( src.isItalic() )
			dst.setItalic( src.isItalic() );
		if( src.isStrike() )
			dst.setStrike( src.isStrike() );
		if( ! "BASELINE".equals( src.getSubscript() ) )
			dst.setSubscript( src.getSubscript() );
		if( src.getTextPosition() != -1 )
			dst.setTextPosition( src.getTextPosition() );
		if( ! "NONE".equals( src.getUnderline() ) )
			dst.setUnderline( src.getUnderline() );
	}

	private static void replaceInRuns(List<XWPFRun> runs, Object data)
	{
		for(int i = 0; i < runs.size(); i++)
			replaceInRun( runs.get(i), data );
	}

	private static void replaceInRun(XWPFRun run, Object data)
	{
		String content = run.getText(0);
		if(content == null)
			return;

		Pattern FIELD_PATTERN = Pattern.compile("\\$\\{(.*?)\\}");
		Matcher m = FIELD_PATTERN.matcher( content );

		while (m.find()) {
			String f = getFieldFromJSON( data, m.group(1) ).toString();
			content = content.replaceAll( "\\$\\{" + m.group(1) + "\\}", f );
		}

		run.setText(content, 0);
	}

	private static Object getFieldFromJSON( Object json, String key )
	{
		String[] path = key.split("\\.");
		if( path.length < 1 )
			return "";

		if( json.getClass().equals(JSONObject.class) ) {
			JSONObject obj = (JSONObject)json;
			if( obj.containsKey( path[0] ) )
				if( path.length == 1 ) {
					return obj.get( path[0] );
				} else {
					return getFieldFromJSON( obj.get(path[0]), StringUtils.join( ArrayUtils.remove(path, 0), "." ) );
				}
		}

		return "";
	}

}
