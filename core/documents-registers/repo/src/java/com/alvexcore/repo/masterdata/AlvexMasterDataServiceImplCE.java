/*
 * Copyright © 2014 ITD Systems
 *
 * This file is part of Alvex
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

package com.alvexcore.repo.masterdata;

import java.util.List;
import java.util.ArrayList;
import java.util.Map;
import java.util.HashMap;
import java.io.Serializable;
import java.io.InputStream;
import java.net.URL;
import java.net.URLConnection;
import org.apache.commons.io.IOUtils;
 
import org.alfresco.util.GUID;

import com.alvexcore.repo.DocumentsRegistersExtension;
import com.alvexcore.repo.AlvexContentModel;
import org.alfresco.model.DataListModel;
import org.alfresco.model.ContentModel;
import org.alfresco.error.AlfrescoRuntimeException;
import org.alfresco.model.ContentModel;
import org.alfresco.service.ServiceRegistry;
import org.alfresco.service.cmr.repository.ChildAssociationRef;
import org.alfresco.service.cmr.repository.NodeRef;
import org.alfresco.service.cmr.repository.NodeService;
import org.alfresco.service.namespace.NamespaceService;
import org.alfresco.service.namespace.QName;

import com.alvexcore.repo.AlvexDictionaryService;
import org.alfresco.service.cmr.repository.AssociationRef;
import org.alfresco.service.cmr.dictionary.Constraint;
import com.alvexcore.repo.masterdata.MasterDataConstraint;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.xpath.XPath;
import javax.xml.xpath.XPathConstants;
import javax.xml.xpath.XPathExpression;
import javax.xml.xpath.XPathFactory;
import org.json.simple.JSONObject;
import org.json.simple.JSONArray;
import org.json.simple.JSONValue;
import org.json.simple.parser.JSONParser;

import org.springframework.beans.factory.InitializingBean;
import org.springframework.beans.factory.annotation.Required;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;
import org.w3c.dom.Document;
import org.w3c.dom.NodeList;

import org.alfresco.repo.security.authentication.AuthenticationUtil;
import org.alfresco.repo.security.authentication.AuthenticationUtil.RunAsWork;

/*
*/

class getConstraintWork implements RunAsWork<Constraint>
{
	protected ServiceRegistry serviceRegistry;
	protected NodeRef containerRef;
	protected String propertyName;
	
	public getConstraintWork(ServiceRegistry serviceRegistry, 
			NodeRef containerRef, String propertyName)
	{
		this.serviceRegistry = serviceRegistry;
		this.containerRef = containerRef;
		this.propertyName = propertyName;
	}
	
	@Override
	public Constraint doWork() throws Exception {
		if(containerRef == null)
			return null;
		
		NodeService nodeService = serviceRegistry.getNodeService();
		HashMap<String,String> adHocMd = new HashMap<String,String>();
		List<String> allowedValues = new ArrayList<String>();
		
		List<AssociationRef> mdAssocs = nodeService.getTargetAssocs(containerRef, 
								AlvexContentModel.ASSOC_ATTACHED_MASTER_DATA);
		for(AssociationRef mdAssoc : mdAssocs)
		{
			NodeRef mdConfig = mdAssoc.getTargetRef();
			String targetProp = (String)nodeService.getProperty(mdConfig, 
							AlvexContentModel.PROP_REGISTRY_MASTER_DATA_TARGET_FIELD);
			String dataSourceName = (String)nodeService.getProperty(mdConfig, 
							AlvexContentModel.PROP_REGISTRY_MASTER_DATA_DATASOURCE_NAME);
			adHocMd.put(targetProp, dataSourceName);
		}
		
		String dataSourceName = adHocMd.get(propertyName);
		if(dataSourceName == null)
			return null;
		
		MasterDataConstraint mdc = new MasterDataConstraint();
		mdc.setDataSourceName(dataSourceName);
		return mdc;
	}
}

class attachMasterDataWork implements RunAsWork<Void>
{
	protected ServiceRegistry serviceRegistry;
	protected DocumentsRegistersExtension extension;
	protected NodeRef containerRef;
	protected String propertyName;
	protected String masterDataSourceName;
	
	public attachMasterDataWork(ServiceRegistry serviceRegistry, DocumentsRegistersExtension extension, 
			String masterDataSourceName, NodeRef containerRef, String propertyName)
	{
		this.serviceRegistry = serviceRegistry;
		this.extension = extension;
		this.containerRef = containerRef;
		this.propertyName = propertyName;
		this.masterDataSourceName = masterDataSourceName;
	}
	
	@Override
	public Void doWork() throws Exception {
		// Attach new one
		Map<QName, Serializable> nodeProps = new HashMap<QName, Serializable>();
		nodeProps.put(AlvexContentModel.PROP_REGISTRY_MASTER_DATA_DATASOURCE_NAME, masterDataSourceName);
		nodeProps.put(AlvexContentModel.PROP_REGISTRY_MASTER_DATA_TARGET_FIELD, propertyName);
		QName mdSourceQName = QName.createQName(AlvexContentModel.ALVEXMD_MODEL_URI, GUID.generate());
		
		NodeService nodeService = serviceRegistry.getNodeService();
		NodeRef configFolder = extension.getNodeFromCache(
					DocumentsRegistersExtension.ID_MASTER_DATA_SERVICE_CONFIG_PATH);
		NodeRef config = nodeService.createNode(configFolder, ContentModel.ASSOC_CHILDREN, 
				mdSourceQName, AlvexContentModel.TYPE_DOCUMENT_REGISTER_MASTER_DATA, nodeProps).getChildRef();
		nodeService.createAssociation(containerRef, config, AlvexContentModel.ASSOC_ATTACHED_MASTER_DATA);
		return null;
	}
}

class detachMasterDataWork implements RunAsWork<Void>
{
	protected ServiceRegistry serviceRegistry;
	protected NodeRef containerRef;
	protected String propertyName;
	
	public detachMasterDataWork(ServiceRegistry serviceRegistry, NodeRef containerRef, String propertyName)
	{
		this.serviceRegistry = serviceRegistry;
		this.containerRef = containerRef;
		this.propertyName = propertyName;
	}
	
	@Override
	public Void doWork() throws Exception {
		NodeService nodeService = serviceRegistry.getNodeService();
		List<AssociationRef> mds = nodeService.getTargetAssocs(containerRef, 
					AlvexContentModel.ASSOC_ATTACHED_MASTER_DATA);
		for(AssociationRef md : mds)
		{
			NodeRef ref = md.getTargetRef();
			String prop = (String)nodeService.getProperty(ref, 
					AlvexContentModel.PROP_REGISTRY_MASTER_DATA_TARGET_FIELD);
			if(prop != null && prop.equals(propertyName))
			{
				nodeService.removeAssociation(containerRef, ref, AlvexContentModel.ASSOC_ATTACHED_MASTER_DATA);
				nodeService.deleteNode(ref);
			}
		}
		return null;
	}
}

class getAttachedMasterDataWork implements RunAsWork<Map<String,String>>
{
	protected ServiceRegistry serviceRegistry;
	protected NodeRef containerRef;
	
	public getAttachedMasterDataWork(ServiceRegistry serviceRegistry, NodeRef containerRef)
	{
		this.serviceRegistry = serviceRegistry;
		this.containerRef = containerRef;
	}
	
	@Override
	public Map<String,String> doWork() throws Exception {
		HashMap<String,String> res = new HashMap<String,String>();
		NodeService nodeService = serviceRegistry.getNodeService();
		List<AssociationRef> mds = nodeService.getTargetAssocs(containerRef, 
					AlvexContentModel.ASSOC_ATTACHED_MASTER_DATA);
		for(AssociationRef md : mds)
		{
			NodeRef ref = md.getTargetRef();
			QName type = nodeService.getType(ref);
			// Skip legacy data to avoid 'null' for 'src'
			// We consider manual migration only
			if( ! AlvexContentModel.TYPE_DOCUMENT_REGISTER_MASTER_DATA.equals(type) )
				continue;
			String prop = (String)nodeService.getProperty(ref, 
					AlvexContentModel.PROP_REGISTRY_MASTER_DATA_TARGET_FIELD);
			String src = (String)nodeService.getProperty(ref, 
					AlvexContentModel.PROP_REGISTRY_MASTER_DATA_DATASOURCE_NAME);
			res.put(prop, src);
		}
		return res;
	}
}

class getMasterDataWork implements RunAsWork<List<Map<String,String>>>
{
	protected AlvexDictionaryService alvexDictionaryService;
	protected ServiceRegistry serviceRegistry;
	protected NodeRef source;
	
	public getMasterDataWork(ServiceRegistry serviceRegistry, 
		AlvexDictionaryService alvexDictionaryService, NodeRef source)
	{
		this.serviceRegistry = serviceRegistry;
		this.alvexDictionaryService = alvexDictionaryService;
		this.source = source;
	}
	
	@Override
	public List<Map<String,String>> doWork() throws Exception {
		if(source == null)
			return new ArrayList<Map<String,String>>();
		
		NodeService nodeService = serviceRegistry.getNodeService();
		String type = (String)nodeService.getProperty(source, 
				AlvexContentModel.PROP_MASTER_DATA_SOURCE_TYPE);
		
		try {
			if(AlvexContentModel.MASTERDATA_TYPE_DATALIST.equals(type)) {
				return getDatalistMasterData(source);
			} else if(AlvexContentModel.MASTERDATA_TYPE_REST_JSON.equals(type)) {
				return getRestJsonMasterData(source);
			} else if(AlvexContentModel.MASTERDATA_TYPE_REST_XML.equals(type)) {
				return getRestXmlMasterData(source);
			} else {
				throw new AlfrescoRuntimeException("Unknown master data source type: " + type);
			}
		}
		catch(Exception e)
		{
			return new ArrayList<Map<String,String>>();
		}
	}
	
	protected List<Map<String,String>> getRestJsonMasterData(NodeRef source)  throws Exception
	{
		NodeService nodeService = serviceRegistry.getNodeService();
		String urlStr = (String)nodeService.getProperty(source, 
				AlvexContentModel.PROP_MASTER_DATA_REST_URL);
		String rootPath = (String)nodeService.getProperty(source, 
				AlvexContentModel.PROP_MASTER_DATA_JSON_ROOT_QUERY);
		String labelField = (String)nodeService.getProperty(source, 
				AlvexContentModel.PROP_MASTER_DATA_JSON_LABEL_FIELD);
		String valueField = (String)nodeService.getProperty(source, 
				AlvexContentModel.PROP_MASTER_DATA_JSON_VALUE_FIELD);
		String caching = (String)nodeService.getProperty(source, 
				AlvexContentModel.PROP_MASTER_DATA_REST_CACHE_MODE);
		
		URL url = new URL(urlStr);
		URLConnection conn = url.openConnection();
		InputStream inputStream = conn.getInputStream();
		String str = IOUtils.toString(inputStream);
		
		Object jsonObj = JSONValue.parse(str);
		
		List<Map<String,String>> res = new ArrayList<Map<String,String>>();
		if( jsonObj.getClass().equals( JSONArray.class ) )
		{
			JSONArray arr = (JSONArray)jsonObj;
			for(int k = 0; k < arr.size(); k++)
			{
				JSONObject item = (JSONObject)arr.get(k);
				String value = item.get(valueField).toString();
				String label = item.get(labelField).toString();
				HashMap<String,String> resItem = new HashMap<String, String>();
				resItem.put("ref", "");
				resItem.put("value", value);
				resItem.put("label", label);
				res.add(resItem);
			}
		}
		
		return res;
	}
	
	protected List<Map<String,String>> getRestXmlMasterData(NodeRef source)  throws Exception
	{
		NodeService nodeService = serviceRegistry.getNodeService();
		String url = (String)nodeService.getProperty(source, 
				AlvexContentModel.PROP_MASTER_DATA_REST_URL);
		String rootXPath = (String)nodeService.getProperty(source, 
				AlvexContentModel.PROP_MASTER_DATA_XPATH_ROOT_QUERY);
		String labelXPath = (String)nodeService.getProperty(source, 
				AlvexContentModel.PROP_MASTER_DATA_XPATH_LABEL);
		String valueXPath = (String)nodeService.getProperty(source, 
				AlvexContentModel.PROP_MASTER_DATA_XPATH_VALUE);
		String caching = (String)nodeService.getProperty(source, 
				AlvexContentModel.PROP_MASTER_DATA_REST_CACHE_MODE);
		
		// Standard of reading a XML file
		DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
		factory.setNamespaceAware(true);
		DocumentBuilder builder = factory.newDocumentBuilder();
		Document doc = builder.parse(url);
		
		// Create a XPathFactory
		XPathFactory xFactory = XPathFactory.newInstance();
		
		// Create a XPath object
		XPath xpath = xFactory.newXPath();
		
		// Compile the XPath expression
		XPathExpression setExpr = xpath.compile(rootXPath);
		XPathExpression valueExpr = xpath.compile(valueXPath);
		XPathExpression labelExpr = xpath.compile(labelXPath);
		
		// Run the query and get a nodeset
		Object result = setExpr.evaluate(doc, XPathConstants.NODESET);
		
		// Cast the result to a list
		NodeList nodes = (NodeList) result;
		List<Map<String,String>> res = new ArrayList<Map<String,String>>();
		for (int i = 0; i < nodes.getLength(); i++)
		{
			String value = (String) valueExpr.evaluate(nodes.item(i), XPathConstants.STRING);
			String label = (String) labelExpr.evaluate(nodes.item(i), XPathConstants.STRING);
			HashMap<String,String> resItem = new HashMap<String, String>();
			resItem.put("ref", "");
			resItem.put("value", value);
			resItem.put("label", label);
			res.add(resItem);
		}
		return res;
	}
	
	protected List<Map<String,String>> getDatalistMasterData(NodeRef source) {
		List<Map<String,String>> res = new ArrayList<Map<String,String>>();
		NodeService nodeService = serviceRegistry.getNodeService();
		
		String valueColumn = (String)nodeService.getProperty(source, 
				AlvexContentModel.PROP_MASTER_DATA_DATALIST_COLUMN_VALUE);
		String labelColumn = (String)nodeService.getProperty(source, 
				AlvexContentModel.PROP_MASTER_DATA_DATALIST_COLUMN_LABEL);
		NodeRef storage = nodeService.getTargetAssocs(source, 
				AlvexContentModel.ASSOC_MASTER_DATA_STORAGE).get(0).getTargetRef();
		String dlItemType = (String)nodeService.getProperty(storage,
				DataListModel.PROP_DATALIST_ITEM_TYPE);
		QName valueProp = alvexDictionaryService.getPropertyQName(dlItemType, valueColumn);
		QName labelProp = alvexDictionaryService.getPropertyQName(dlItemType, labelColumn);
			
		List<ChildAssociationRef> children = nodeService.getChildAssocs(storage);
		for(ChildAssociationRef child : children)
		{
			NodeRef item = child.getChildRef();
			String value = (String)nodeService.getProperty(item, valueProp);
			String label = (String)nodeService.getProperty(item, labelProp);
			String ref = item.toString();
			Map<String,String> props = new HashMap<String,String>(3);
			props.put("ref", ref);
			props.put("value", value);
			props.put("label", label);
			res.add(props);
		}
		return res;
	}
}

class deleteMasterDataSourceWork implements RunAsWork<Void>
{
	protected ServiceRegistry serviceRegistry;
	protected NodeRef source;
	
	public deleteMasterDataSourceWork(ServiceRegistry serviceRegistry, NodeRef source)
	{
		this.serviceRegistry = serviceRegistry;
		this.source = source;
	}
	
	@Override
	public Void doWork() throws Exception {
		if(source != null) {
			NodeService nodeService = serviceRegistry.getNodeService();
			// Remove data for 'remote' data source types
			String type = (String)nodeService.getProperty(source, 
					AlvexContentModel.PROP_MASTER_DATA_SOURCE_TYPE);
			if( AlvexContentModel.MASTERDATA_TYPE_REST_JSON.equals(type) 
					|| AlvexContentModel.MASTERDATA_TYPE_REST_XML.equals(type) )
			{
				List<AssociationRef> storage = nodeService.getTargetAssocs(source, 
						AlvexContentModel.ASSOC_MASTER_DATA_STORAGE);
				for(AssociationRef s : storage)
				{
					NodeRef folder = s.getTargetRef();
					nodeService.deleteNode(folder);
				}
			}
			// Remove config
			nodeService.deleteNode(source);
		}
		return null;
	}
}

class createMasterDataSourceWork implements RunAsWork<NodeRef>
{
	protected ServiceRegistry serviceRegistry;
	protected DocumentsRegistersExtension extension;
	protected Map<String,String> props;
	
	public createMasterDataSourceWork(ServiceRegistry serviceRegistry, 
			DocumentsRegistersExtension extension, Map<String,String> props)
	{
		this.serviceRegistry = serviceRegistry;
		this.extension = extension;
		this.props = props;
	}
	
	@Override
	public NodeRef doWork() throws Exception {
		NodeService nodeService = serviceRegistry.getNodeService();
		NodeRef configFolder = extension.getNodeFromCache(
					DocumentsRegistersExtension.ID_MASTER_DATA_CONFIG_PATH);
		
		String type = props.get("type");
		String name = props.get("name");
		QName mdSourceQName = QName.createQName(AlvexContentModel.ALVEXMD_MODEL_URI, name);
		
		List<ChildAssociationRef> childAssocs = nodeService.getChildAssocs(
					configFolder, ContentModel.ASSOC_CHILDREN, mdSourceQName);
		if (!childAssocs.isEmpty()) {
			throw new AlfrescoRuntimeException("Duplicate master data source name is now allowed: " + name);
		}
		
		NodeRef dataFolder = extension.getNodeFromCache(
					DocumentsRegistersExtension.ID_MASTER_DATA_DATA_PATH);
		NodeRef masterDataStorage = null;
		
		QName nodeType = null;
		Map<QName, Serializable> nodeProps = new HashMap<QName, Serializable>();
		nodeProps.put(AlvexContentModel.PROP_MASTER_DATA_SOURCE_TYPE, type);
		nodeProps.put(ContentModel.PROP_NAME, name);
		
		if(AlvexContentModel.MASTERDATA_TYPE_DATALIST.equals(type)) {
			nodeType = AlvexContentModel.TYPE_DATALIST_MASTER_DATA_SOURCE;
			nodeProps.put(AlvexContentModel.PROP_MASTER_DATA_DATALIST_COLUMN_LABEL, props.get("labelColumn"));
			nodeProps.put(AlvexContentModel.PROP_MASTER_DATA_DATALIST_COLUMN_VALUE, props.get("valueColumn"));
			masterDataStorage = new NodeRef(props.get("datalistRef"));
		} else if(AlvexContentModel.MASTERDATA_TYPE_REST_JSON.equals(type)) {
			nodeType = AlvexContentModel.TYPE_REST_JSON_MASTER_DATA_SOURCE;
			nodeProps.put(AlvexContentModel.PROP_MASTER_DATA_REST_URL, props.get("masterDataURL"));
			nodeProps.put(AlvexContentModel.PROP_MASTER_DATA_JSON_ROOT_QUERY, props.get("dataRootJsonQuery"));
			nodeProps.put(AlvexContentModel.PROP_MASTER_DATA_JSON_VALUE_FIELD, props.get("valueField"));
			nodeProps.put(AlvexContentModel.PROP_MASTER_DATA_JSON_LABEL_FIELD, props.get("labelField"));
			nodeProps.put(AlvexContentModel.PROP_MASTER_DATA_REST_CACHE_MODE, props.get("caching"));
			masterDataStorage = nodeService.createNode(dataFolder, ContentModel.ASSOC_CHILDREN, 
				mdSourceQName, AlvexContentModel.TYPE_MASTER_DATA_ITEM, null).getChildRef();
		} else if(AlvexContentModel.MASTERDATA_TYPE_REST_XML.equals(type)) {
			nodeType = AlvexContentModel.TYPE_REST_XML_MASTER_DATA_SOURCE;
			nodeProps.put(AlvexContentModel.PROP_MASTER_DATA_REST_URL, props.get("masterDataURL"));
			nodeProps.put(AlvexContentModel.PROP_MASTER_DATA_XPATH_ROOT_QUERY, props.get("dataRootXpathQuery"));
			nodeProps.put(AlvexContentModel.PROP_MASTER_DATA_XPATH_VALUE, props.get("valueXpath"));
			nodeProps.put(AlvexContentModel.PROP_MASTER_DATA_XPATH_LABEL, props.get("labelXpath"));
			nodeProps.put(AlvexContentModel.PROP_MASTER_DATA_REST_CACHE_MODE, props.get("caching"));
			masterDataStorage = nodeService.createNode(dataFolder, ContentModel.ASSOC_CHILDREN, 
				mdSourceQName, AlvexContentModel.TYPE_MASTER_DATA_ITEM, null).getChildRef();
		} else {
			throw new AlfrescoRuntimeException("Unknown master data source type: " + type);
		}
		
		NodeRef node = nodeService.createNode(configFolder, ContentModel.ASSOC_CHILDREN, 
				mdSourceQName, nodeType, nodeProps).getChildRef();
		nodeService.createAssociation(node, masterDataStorage, AlvexContentModel.ASSOC_MASTER_DATA_STORAGE);
		
		return node;
	}
}

public class AlvexMasterDataServiceImplCE implements InitializingBean, AlvexMasterDataService
{
	private static Log logger = LogFactory.getLog(AlvexMasterDataServiceImplCE.class);

	protected ServiceRegistry serviceRegistry;
	protected AlvexDictionaryService alvexDictionaryService;
	protected DocumentsRegistersExtension extension;
	protected List<NodeRef> masterDataSources = null;
	
	/*
	 * Setters and getters 
	 */
	
	@Override
	public ServiceRegistry getServiceRegistry() {
		return serviceRegistry;
	}
	
	@Required
	public void setServiceRegistry(ServiceRegistry serviceRegistry) {
		this.serviceRegistry = serviceRegistry;
	}
	
	@Required
	public void setAlvexDictionaryService(AlvexDictionaryService alvexDictionaryService) {
		this.alvexDictionaryService = alvexDictionaryService;
	}
	
	@Required
	public void setDocumentsRegistersExtension(DocumentsRegistersExtension extension) {
		this.extension = extension;
	}
	
	@Override
	public void afterPropertiesSet() throws Exception {
	}
	
	public void setUp() {
		NodeRef configFolder = extension.getNodeFromCache(
					DocumentsRegistersExtension.ID_MASTER_DATA_CONFIG_PATH);
		NodeService nodeService = serviceRegistry.getNodeService();
		List<ChildAssociationRef> childAssocs = nodeService.getChildAssocs(
					configFolder, ContentModel.ASSOC_CHILDREN, null);
		masterDataSources = new ArrayList<NodeRef>();
		for(ChildAssociationRef assoc : childAssocs) {
			masterDataSources.add(assoc.getChildRef());
		}
	}
	
	@Override
	public List<NodeRef> getMasterDataSources() {
		return masterDataSources;
	}
	
	@Override
	public NodeRef getMasterDataSource(String name) {
		NodeService nodeService = serviceRegistry.getNodeService();
		List<NodeRef> datasources = getMasterDataSources();
		if(datasources == null)
			return null;
		for(NodeRef source : datasources) {
			if( nodeService.getProperty(source, ContentModel.PROP_NAME).equals(name) )
				return source;
		}
		return null;
	}
	
	@Override
	public NodeRef createMasterDataSource(Map<String,String> props) {
		RunAsWork<NodeRef> work = new createMasterDataSourceWork(serviceRegistry, extension, props);
		NodeRef node = AuthenticationUtil.runAsSystem(work);
		masterDataSources.add(node);
		return node;
	}
	
	@Override
	public void deleteMasterDataSource(NodeRef source) {
		RunAsWork<Void> work = new deleteMasterDataSourceWork(serviceRegistry, source);
		AuthenticationUtil.runAsSystem(work);
		masterDataSources.remove(source);
	}
	
	@Override
	public List<Map<String,String>> getMasterData(NodeRef source) {
		RunAsWork<List<Map<String,String>>> work = new getMasterDataWork(serviceRegistry, alvexDictionaryService, source);
		return AuthenticationUtil.runAsSystem(work);
	}
	
	@Override
	public Map<String,String> getAttachedMasterData(NodeRef containerRef)
	{
		RunAsWork<Map<String,String>> work = new getAttachedMasterDataWork(serviceRegistry, containerRef);
		return AuthenticationUtil.runAsSystem(work);
	}
	
	@Override
	public void detachMasterData(NodeRef containerRef, String propertyName)
	{
		RunAsWork<Void> work = new detachMasterDataWork(serviceRegistry, containerRef, propertyName);
		AuthenticationUtil.runAsSystem(work);
	}
	
	@Override
	public void attachMasterData(String masterDataSourceName, NodeRef containerRef, String propertyName)
	{
		// Clear previous master data
		detachMasterData(containerRef, propertyName);
		// Attach new one
		RunAsWork<Void> work = new attachMasterDataWork(serviceRegistry, extension, 
				masterDataSourceName, containerRef, propertyName);
		AuthenticationUtil.runAsSystem(work);
	}
	
	@Override
	public boolean syncMasterData(NodeRef source) {
		if(source == null)
			return false;
		NodeService nodeService = serviceRegistry.getNodeService();
		if( AlvexContentModel.MASTERDATA_TYPE_DATALIST.equals(nodeService.getType(source)) )
			return true;
		return false;
	}
	
	@Override
	public Constraint getConstraint(NodeRef containerRef, String propertyName)
	{
		RunAsWork<Constraint> work = new getConstraintWork(serviceRegistry, containerRef, propertyName);
		return AuthenticationUtil.runAsSystem(work);
	}
}