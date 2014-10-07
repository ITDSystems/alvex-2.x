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

import java.io.Serializable;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.alfresco.repo.jscript.BaseScopableProcessorExtension;
import org.alfresco.repo.jscript.ScriptNode;
import org.alfresco.repo.jscript.ScriptableHashMap;
import org.springframework.beans.factory.annotation.Required;
import org.alfresco.repo.jscript.ValueConverter;
import org.alfresco.service.ServiceRegistry;
import org.alfresco.service.cmr.repository.NodeRef;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.NativeObject;
import org.mozilla.javascript.NativeJavaObject;

public class JsAlvexMasterDataService extends BaseScopableProcessorExtension {
	
	private AlvexMasterDataService alvexMasterDataService;
	private static ServiceRegistry serviceRegistry;
	private ValueConverter converter = new ValueConverter();
	
	@Required
	public void setAlvexMasterDataService(AlvexMasterDataService alvexMasterDataService)
	{
		this.alvexMasterDataService = alvexMasterDataService;
	}
	
	@Required
	public void setServiceRegistry(ServiceRegistry registry) {
		this.serviceRegistry = registry;
	}

	
	public Scriptable getMasterDataSources() {
		List<NodeRef> sources = alvexMasterDataService.getMasterDataSources();
		ArrayList<Serializable> jsRes = new ArrayList<Serializable>();
		for (NodeRef src : sources)
		{
			jsRes.add(new ScriptNode(src, serviceRegistry, getScope()));
		}
		return (Scriptable)converter.convertValueForScript(
								alvexMasterDataService.getServiceRegistry(), 
								getScope(), null, jsRes);
	}
	
	public Serializable getMasterDataSource(String name) {
		NodeRef ref = alvexMasterDataService.getMasterDataSource(name);
		return new ScriptNode(ref, alvexMasterDataService.getServiceRegistry(), getScope());
	}
	
	public Serializable createMasterDataSource(NativeObject obj) {
		Map<String,String> props = objectToMap(obj);
		NodeRef res = alvexMasterDataService.createMasterDataSource(props);
		return new ScriptNode(res, serviceRegistry, getScope());
	}
	
	public void deleteMasterDataSource(String refStr) {
		deleteMasterDataSource(new NodeRef(refStr));
	}
	
	public void deleteMasterDataSource(ScriptNode node) {
		deleteMasterDataSource(node.getNodeRef());
	}
	
	public void deleteMasterDataSource(NodeRef ref) {
		alvexMasterDataService.deleteMasterDataSource(ref);
	}
	
	public Scriptable getMasterData(String refStr) {
		return getMasterData(new NodeRef(refStr));
	}
	
	public Scriptable getMasterData(ScriptNode node) {
		return getMasterData(node.getNodeRef());
	}
	
	public Scriptable getMasterData(NodeRef ref) {
		List<Map<String,String>> data = alvexMasterDataService.getMasterData(ref);
		ArrayList<Serializable> jsRes = new ArrayList<Serializable>();
		for (Map<String,String> item : data)
		{
			ScriptableHashMap<String,String> props = new ScriptableHashMap<String,String>();
			for (Map.Entry<String, String> entry : item.entrySet())
			{
				props.put(entry.getKey(), entry.getValue());
			}
			jsRes.add( props );
		}
		return (Scriptable)converter.convertValueForScript(
								alvexMasterDataService.getServiceRegistry(), 
								getScope(), null, jsRes);
	}
	
	public Scriptable getAttachedMasterData(ScriptNode container) {
		ArrayList<Serializable> jsRes = new ArrayList<Serializable>();
		Map<String,String> data = alvexMasterDataService.getAttachedMasterData(container.getNodeRef());
		for (Map.Entry<String, String> entry : data.entrySet())
		{
			ScriptableHashMap<String,String> props = new ScriptableHashMap<String,String>();
			props.put("field", entry.getKey());
			props.put("datasource", entry.getValue());
			jsRes.add( props );
		}
		return (Scriptable)converter.convertValueForScript(
								alvexMasterDataService.getServiceRegistry(), 
								getScope(), null, jsRes);
	}
	
	public void detachMasterData(ScriptNode container, String propertyName)
	{
		alvexMasterDataService.detachMasterData(container.getNodeRef(), propertyName);
	}
	
	public void attachMasterData(String masterDataSourceName, ScriptNode container, String propertyName)
	{
		alvexMasterDataService.attachMasterData(masterDataSourceName, container.getNodeRef(), propertyName);
	}
	
	public boolean syncMasterData(String refStr) {
		return syncMasterData(new NodeRef(refStr));
	}
	
	public boolean syncMasterData(ScriptNode node) {
		return syncMasterData(node.getNodeRef());
	}
	
	public boolean syncMasterData(NodeRef ref) {
		return alvexMasterDataService.syncMasterData(ref);
	}
	
	protected Map<String,String> objectToMap( NativeObject obj ) {
		HashMap<String,String> map = new HashMap<String,String>();
		for( Object id: obj.getIds() ) {
			String key = id.toString();
			NativeJavaObject o = (NativeJavaObject)obj.get(key, obj);
			String value = (String)o.unwrap();
			map.put(key, value);
		}
		return map;
	}
}