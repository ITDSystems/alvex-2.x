package com.alvexcore.repo.tools;

import org.alfresco.service.ServiceRegistry;
import org.alfresco.service.cmr.repository.NodeRef;
import org.alfresco.service.cmr.version.Version;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.beans.factory.annotation.Required;

public class VersionHelperImpl implements InitializingBean, VersionHelper {
	
	protected ServiceRegistry serviceRegistry;

	@Required
	public void setServiceRegistry(ServiceRegistry serviceRegistry) {
		this.serviceRegistry = serviceRegistry;
	}
	
	@Override
	public ServiceRegistry getServiceRegistry() {
		return serviceRegistry;
	}
	
	@Override
	public void afterPropertiesSet() throws Exception {
		
	}

	@Override
	public void revert(NodeRef nodeRef, Version version, boolean deep)
	{
		serviceRegistry.getVersionService().revert(nodeRef, version, deep);
	}
	
}
