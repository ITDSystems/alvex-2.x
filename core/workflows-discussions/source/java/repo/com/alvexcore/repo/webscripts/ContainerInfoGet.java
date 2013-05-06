package com.alvexcore.repo.webscripts;

import java.util.HashMap;
import java.util.Map;

import org.alfresco.service.cmr.repository.NodeRef;
import org.springframework.beans.factory.annotation.Required;
import org.springframework.extensions.webscripts.DeclarativeWebScript;
import org.springframework.extensions.webscripts.WebScriptRequest;
import org.springframework.extensions.webscripts.Status;
import org.springframework.extensions.webscripts.Cache;

import com.alvexcore.repo.ExtensionAware;
import com.alvexcore.repo.RepositoryExtension;

public class ContainerInfoGet extends DeclarativeWebScript implements ExtensionAware {

	private RepositoryExtension extension;

	protected Map<String, Object> executeImpl(WebScriptRequest req,
			Status status, Cache cache) {
		Map<String, Object> result = new HashMap<String, Object>();
		try {
			NodeRef node = extension.getDataPath();
			result.put("protocol", node.getStoreRef().getProtocol());
			result.put("storeId", node.getStoreRef().getIdentifier());
			result.put("nodeId", node.getId());
		} catch (Exception e) {
		}
		return result;
	}

	@Required
	public void setExtension(RepositoryExtension extension) {
		this.extension = extension;
	}
}
