package com.alvexcore.repo.documents;

import org.alfresco.service.ServiceRegistry;
import org.alfresco.service.cmr.repository.NodeService;
import org.alfresco.service.cmr.security.AuthorityService;
import org.alfresco.service.cmr.security.PermissionService;

import org.alfresco.service.cmr.repository.NodeRef;

import java.util.List;
import java.util.Map;

public interface XmlService {

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
	 * Sets up xml service
	 * @throws Exception
	 */
	public abstract void setUp() throws Exception;

	/**
	 * Tests xml service
	 * @throws Exception
	 */
	public abstract boolean test() throws Exception;

	public abstract List<Map<String,String>> queryURL(String url, String rootXPath, String labelXPath, String valueXPath) throws Exception;

}
