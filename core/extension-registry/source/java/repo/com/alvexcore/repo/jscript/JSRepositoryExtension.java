package com.alvexcore.repo.jscript;

import java.io.Serializable;
import java.util.HashMap;
import java.util.Map;

import org.alfresco.repo.jscript.ValueConverter;
import org.alfresco.service.ServiceRegistry;
import org.mozilla.javascript.Scriptable;

import com.alvexcore.repo.RepositoryExtension;

public class JSRepositoryExtension implements Serializable{
	private static final long serialVersionUID = -6284708320747731858L;
	private ServiceRegistry serviceRegistry;
	private RepositoryExtension extension;
	private Scriptable scope;
	private ValueConverter converter = new ValueConverter();

	public JSRepositoryExtension(ServiceRegistry serviceRegistry, final Scriptable scope,
			RepositoryExtension extension) {
			this.serviceRegistry = serviceRegistry;
			this.extension = extension;
			this.scope = scope;
	}
	
	public String getId() {
		return extension.getId();
	}
	
	public String getEdition() {
		return extension.getEdition();
	}
	
	public String getVersion() {
		return extension.getVersion();
	}
	
	public Scriptable getMD5Hashes() throws Exception {
		HashMap<String, String> result = new HashMap<String, String>();
		Map<String, String> hashes = extension.getMD5Hashes();
		for (String key: hashes.keySet())
			result.put(key, hashes.get(key));
		return (Scriptable)converter.convertValueForScript(serviceRegistry, scope, null, result);
	}
	
	public void init(boolean failIfInitialized) throws Exception {
		extension.init(failIfInitialized);
	}
	
	public void init() throws Exception {
		extension.init(true);
	}
	
	public void drop(boolean all) throws Exception {
		extension.drop(all);
	}
	
	public void drop() throws Exception {
		extension.drop(false);
	} 
}
