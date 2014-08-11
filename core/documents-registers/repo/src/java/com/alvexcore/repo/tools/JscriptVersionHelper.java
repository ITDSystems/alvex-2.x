package com.alvexcore.repo.tools;

import org.alfresco.service.ServiceRegistry;
import org.alfresco.repo.jscript.BaseScopableProcessorExtension;
import org.alfresco.repo.jscript.ScriptNode;
import org.alfresco.service.cmr.version.Version;
import org.alfresco.service.cmr.repository.NodeRef;
import org.springframework.beans.factory.annotation.Required;

public class JscriptVersionHelper extends BaseScopableProcessorExtension {
	
	protected VersionHelper versionHelper;
	protected ServiceRegistry serviceRegistry;

	@Required
	public void setServiceRegistry(ServiceRegistry serviceRegistry) {
		this.serviceRegistry = serviceRegistry;
	}

	@Required
	public void setVersionHelper(VersionHelper versionHelper) {
		this.versionHelper = versionHelper;
	}
	
	public void revert(ScriptNode node, String versionLabel, boolean deep)
	{
		NodeRef ref = node.getNodeRef();
		// Get the Version - needed to do the revert
		Version version = serviceRegistry.getVersionService().
				getVersionHistory(ref).getVersion(versionLabel);
		if (version == null)
			return;
		versionHelper.revert(ref, version, deep);
	}

}
