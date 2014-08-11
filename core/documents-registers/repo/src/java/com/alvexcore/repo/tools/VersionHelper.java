package com.alvexcore.repo.tools;

import org.alfresco.service.ServiceRegistry;
import org.alfresco.service.cmr.repository.NodeRef;
import org.alfresco.service.cmr.version.Version;

public interface VersionHelper {

	public abstract void revert(NodeRef nodeRef, Version version, boolean deep);

	public ServiceRegistry getServiceRegistry();
	
}
