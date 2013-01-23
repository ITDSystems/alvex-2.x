package com.alvexcore.repo.webscripts;

import java.util.HashMap;
import java.util.Map;

import org.alfresco.service.cmr.repository.NodeRef;
import org.springframework.extensions.webscripts.DeclarativeWebScript;
import org.springframework.extensions.webscripts.WebScriptRequest;
import org.springframework.extensions.webscripts.Status;
import org.springframework.extensions.webscripts.Cache;

import com.alvexcore.repo.RepositoryExtensionRegistry;
import com.alvexcore.repo.WorkflowsDiscussionsExtension;

public class ContainerInfoGet extends DeclarativeWebScript {

	private RepositoryExtensionRegistry extensionRegistry;

	protected Map<String, Object> executeImpl(WebScriptRequest req,
			Status status, Cache cache) {
		Map<String, Object> result = new HashMap<String, Object>();
		try {
			NodeRef node = extensionRegistry.createPath(
					WorkflowsDiscussionsExtension.DISCUSSIONS_STORAGE_PATH,
					null,
					WorkflowsDiscussionsExtension.DISCUSSIONS_STORAGE_TYPES);
			result.put("protocol", node.getStoreRef().getProtocol());
			result.put("storeId", node.getStoreRef().getIdentifier());
			result.put("nodeId", node.getId());
		} catch (Exception e) {
		}
		return result;
	}

	public void setExtensionRegistry(RepositoryExtensionRegistry registry) {
		this.extensionRegistry = registry;
	}
}
