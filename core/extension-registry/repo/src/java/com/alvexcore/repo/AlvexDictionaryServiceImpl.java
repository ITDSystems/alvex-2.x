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

package com.alvexcore.repo;

import org.alfresco.model.ContentModel;
import org.alfresco.service.cmr.repository.AssociationRef;
import org.alfresco.service.cmr.repository.NodeRef;
import org.alfresco.service.namespace.QName;
import org.alfresco.service.ServiceRegistry;
import org.alfresco.service.cmr.repository.NodeService;
import org.alfresco.service.cmr.dictionary.DictionaryService;
import org.alfresco.service.cmr.dictionary.TypeDefinition;
import org.alfresco.service.cmr.dictionary.PropertyDefinition;
import org.alfresco.service.cmr.dictionary.AspectDefinition;

import org.springframework.beans.factory.InitializingBean;
import org.springframework.beans.factory.annotation.Required;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;

import java.util.List;
import java.util.Collection;
import java.util.ArrayList;
import java.util.Map;
import java.util.HashMap;

public class AlvexDictionaryServiceImpl implements InitializingBean, AlvexDictionaryService
{
	private static Log logger = LogFactory.getLog(AlvexDictionaryServiceImpl.class);

	protected ServiceRegistry serviceRegistry;
	protected DictionaryService dictionaryService;
	protected NodeService nodeService;
	
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
	
	@Override
	public DictionaryService getDictionaryService() {
		return dictionaryService;
	}

	/*
	 * Startup functions
	 */
	
	@Override
	public void afterPropertiesSet() throws Exception {
		dictionaryService = serviceRegistry.getDictionaryService();
		nodeService = serviceRegistry.getNodeService();
	}
	
	/*
	* Dict functions
	*/
	
	@Override
	public TypeDefinition getDataType(String shortName)
	{
		Collection<QName> typeNames = dictionaryService.getAllTypes();
		for(QName typeName: typeNames)
		{
			TypeDefinition type = dictionaryService.getType(typeName);
			String str = type.getName().getPrefixString();
			if( str.equals(shortName) )
				return type;
		}
		return null;
	}
	
	@Override
	public List<TypeDefinition> getParentHierarchy(NodeRef ref)
	{
		QName typeName = nodeService.getType(ref);
		TypeDefinition type = dictionaryService.getType(typeName);
		return getParentHierarchy(type);
	}
	
	@Override
	public List<TypeDefinition> getParentHierarchy(TypeDefinition type)
	{
		List<TypeDefinition> result = new ArrayList<TypeDefinition>();
		TypeDefinition parentType = type;
		QName parentTypeName = parentType.getName();
		
		while( ! parentTypeName.equals( ContentModel.TYPE_BASE ) )
		{
			result.add(parentType);
			parentTypeName = parentType.getParentName();
			parentType = dictionaryService.getType(parentTypeName);
		}
		return result;
	}
	
	@Override
	public boolean isContent(NodeRef ref)
	{
		return checkToBeOfType(ref, ContentModel.TYPE_CONTENT);
	}
	
	@Override
	public boolean isRegistry(NodeRef ref)
	{
		return checkToBeOfType(ref, AlvexContentModel.TYPE_DOCUMENT_REGISTER);
	}
	
	@Override
	public boolean isRegistryItem(NodeRef ref)
	{
		return checkToBeOfType(ref, AlvexContentModel.TYPE_DOCUMENT_REGISTER_ITEM);
	}
	
	@Override
	public Map<QName, PropertyDefinition> getCompleteTypeDescription(String shortName)
	{
		TypeDefinition type = getDataType(shortName);
		return getCompleteTypeDescription(type);
	}
	
	@Override
	public Map<QName, PropertyDefinition> getCompleteTypeDescription(NodeRef ref)
	{
		QName typeName = nodeService.getType(ref);
		TypeDefinition type = dictionaryService.getType(typeName);
		return getCompleteTypeDescription(type);
	}
	
	@Override
	public Map<QName, PropertyDefinition> getCompleteTypeDescription(TypeDefinition type)
	{
		Map<QName, PropertyDefinition> results = new HashMap<QName, PropertyDefinition>();
		
		Map<QName, PropertyDefinition> properties = type.getProperties();
		for (Map.Entry<QName, PropertyDefinition> entry : properties.entrySet())
		{
			PropertyDefinition prop = entry.getValue();
			QName name = entry.getKey();
			results.put(name, prop);
		}
		
		List<AspectDefinition> aspects = type.getDefaultAspects(true);
		for (AspectDefinition def : aspects)
		{
			properties = def.getProperties();
			for (Map.Entry<QName, PropertyDefinition> entry : properties.entrySet())
			{
				PropertyDefinition prop = entry.getValue();
				QName name = entry.getKey();
				results.put(name, prop);
			}
		}
		return results;
	};
	
	protected boolean checkToBeOfType(NodeRef ref, QName targetType)
	{
		List<TypeDefinition> types = getParentHierarchy(ref);
		for(TypeDefinition type: types)
		{
			if( type.getName().equals( targetType ) )
				return true;
		}
		return false;
	}
}