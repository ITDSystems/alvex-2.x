package com.alvexcore.repo.documents;

import org.alfresco.repo.jscript.BaseScopableProcessorExtension;
import org.springframework.beans.factory.annotation.Required;
import org.alfresco.service.ServiceRegistry;
import org.alfresco.repo.jscript.ScriptNode;
import org.alfresco.repo.jscript.ValueConverter;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.Map;
import java.util.HashMap;

import org.mozilla.javascript.Scriptable;

public class JscriptXmlService extends BaseScopableProcessorExtension {
	private XmlService xmlService;
	private ServiceRegistry serviceRegistry;
	private ValueConverter converter = new ValueConverter();

	/**
	 * Sets xml service
	 * @param xmlService
	 */
	@Required
	public void setXmlService(XmlService xmlService) {
		this.xmlService = xmlService;
		this.serviceRegistry = xmlService.getServiceRegistry();
	}

	public boolean test() throws Exception {
		return xmlService.test();
	}
	
	public Scriptable queryURL(String url, String rootXPath, String labelXPath, String valueXPath) throws Exception
	{
		ArrayList<Serializable> result = new ArrayList<Serializable>();
		for (Map<String,String> item : xmlService.queryURL(url, rootXPath, labelXPath, valueXPath))
			result.add( new HashMap<String,String>(item) );
		return (Scriptable) converter.convertValueForScript(serviceRegistry,
				getScope(), null, result);
	}
	
}
