package com.alvexcore.repo.documents;

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

import java.util.Map;
import java.util.List;
import java.util.Iterator;
import java.util.HashMap;
import java.util.ArrayList;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import javax.xml.xpath.XPath;
import javax.xml.xpath.XPathConstants;
import javax.xml.xpath.XPathExpression;
import javax.xml.xpath.XPathExpressionException;
import javax.xml.xpath.XPathFactory;

import org.w3c.dom.Document;
import org.w3c.dom.NodeList;

import org.xml.sax.InputSource;

public class XmlServiceImpl implements InitializingBean, XmlService {

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
	public List<Map<String,String>> queryURL(String url, String rootXPath, String labelXPath, String valueXPath) throws Exception
	{
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
		ArrayList res = new ArrayList<String>();
		for (int i = 0; i < nodes.getLength(); i++)
		{
			String value = (String) valueExpr.evaluate(nodes.item(i), XPathConstants.STRING);
			String label = (String) labelExpr.evaluate(nodes.item(i), XPathConstants.STRING);
			HashMap<String,String> resItem = new HashMap<String, String>();
			resItem.put("value", value);
			resItem.put("label", label);
			res.add(resItem);
		}
		return res;
	}
}
