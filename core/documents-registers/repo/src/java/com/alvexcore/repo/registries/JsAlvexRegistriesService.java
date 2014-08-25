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

package com.alvexcore.repo.registries;

import com.alvexcore.repo.AlvexDictionaryService;
import org.alfresco.model.DataListModel;

import org.alfresco.repo.jscript.BaseScopableProcessorExtension;
import org.springframework.beans.factory.annotation.Required;

import org.alfresco.service.cmr.repository.NodeService;
import org.alfresco.repo.jscript.ScriptNode;
import org.alfresco.service.cmr.repository.NodeRef;
import org.alfresco.service.namespace.QName;
import org.alfresco.service.cmr.dictionary.PropertyDefinition;

import org.alfresco.repo.jscript.ValueConverter;
import org.mozilla.javascript.Scriptable;
import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;
import org.alfresco.repo.jscript.ScriptableHashMap;
import java.util.Map;

public class JsAlvexRegistriesService extends BaseScopableProcessorExtension {
	
	private AlvexRegistriesService alvexRegistriesService;
	private AlvexDictionaryService alvexDictionaryService;
	private NodeService nodeService;
	private ValueConverter converter = new ValueConverter();
	
	@Required
	public void setAlvexRegistriesService(AlvexRegistriesService alvexRegistriesService)
	{
		this.alvexRegistriesService = alvexRegistriesService;
	}
	
	@Required
	public void setAlvexDictionaryService(AlvexDictionaryService alvexDictionaryService)
	{
		this.alvexDictionaryService = alvexDictionaryService;
		this.nodeService = alvexDictionaryService.getServiceRegistry().getNodeService();
	}
	
	public String suggestNextNumber(ScriptNode registry)
	{
		return alvexRegistriesService.suggestNextNumber(registry.getNodeRef());
	}
	
	public CommitNumberResult commitNextNumber(ScriptNode registry, String number, String propShortName)
	{
		PropertyDefinition targetProp = null;
		String itemTypeShortName 
				= (String) nodeService.getProperty(registry.getNodeRef(), DataListModel.PROP_DATALIST_ITEM_TYPE);
		Map<QName, PropertyDefinition> props 
				= alvexDictionaryService.getAllTypeProperties(itemTypeShortName);
		for(Map.Entry<QName, PropertyDefinition> entry : props.entrySet())
		{
			String propName = entry.getKey().getPrefixString();
			if( propName.equals(propShortName) )
				targetProp = entry.getValue();
		}
		return alvexRegistriesService.commitNextNumber(registry.getNodeRef(), number, targetProp);
	}
	
	public Scriptable getParentRegistryDetails(ScriptNode node)
	{
		Map<String, String> details = alvexRegistriesService.getParentRegistryDetails(node.getNodeRef());
		ScriptableHashMap<String,String> props = new ScriptableHashMap<String,String>();
		for (Map.Entry<String, String> entry : details.entrySet())
		{
			props.put(entry.getKey(), entry.getValue());
		}
		return (Scriptable)converter.convertValueForScript(
								alvexRegistriesService.getServiceRegistry(), 
								getScope(), null, props);
	}
	
	public Scriptable getParentRegistryItems(ScriptNode node)
	{
		ArrayList<Serializable> jsRes = new ArrayList<Serializable>();
		List<Map<String,String>> parents = alvexRegistriesService.getParentRegistryItems(node.getNodeRef());
		for (Map<String,String> parent : parents)
		{
			ScriptableHashMap<String,String> props = new ScriptableHashMap<String,String>();
			for (Map.Entry<String, String> entry : parent.entrySet())
			{
				props.put(entry.getKey(), entry.getValue());
			}
			jsRes.add( props );
		}
		return (Scriptable)converter.convertValueForScript(
								alvexRegistriesService.getServiceRegistry(), 
								getScope(), null, jsRes);
	}
	
	public boolean workflowsAvailableForRegistryItem()
	{
		return alvexRegistriesService.workflowsAvailableForRegistryItem();
	}
}