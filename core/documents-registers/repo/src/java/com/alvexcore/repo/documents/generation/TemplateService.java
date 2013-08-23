package com.alvexcore.repo.documents.generation;

import org.alfresco.service.ServiceRegistry;
import org.alfresco.service.cmr.repository.NodeService;
import org.alfresco.service.cmr.security.AuthorityService;
import org.alfresco.service.cmr.security.PermissionService;

import org.alfresco.service.cmr.repository.NodeRef;

public interface TemplateService {

	/**
	 * Returns service registry
	 * @return ServiceRegistry instance
	 */
	public abstract ServiceRegistry getServiceRegistry();

	/**
	 * Returns node service
	 * @return NodeService instance
	 */
	public abstract NodeService getNodeService();

	/**
	 * Returns authority service
	 * @return AuthorityService instance
	 */
	public abstract AuthorityService getAuthorityService();
	
	/**
	 * Returns permission service
	 * @return PermissionService instance
	 */
	public abstract PermissionService getPermissionService();
	
	/**
	 * Sets up template service
	 * @throws Exception
	 */
	public abstract void setUp() throws Exception;

	/**
	 * Tests template service
	 * @throws Exception
	 */
	public abstract boolean test() throws Exception;

	public abstract boolean generate(NodeRef templateFile, NodeRef targetFolder, String targetName, String data) throws Exception;

}
