/**
 * Copyright © 2013 ITD Systems
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

package com.alvexcore.repo;

import org.alfresco.model.ContentModel;
import org.alfresco.repo.security.authentication.AuthenticationUtil;
import org.alfresco.repo.security.authentication.AuthenticationUtil.RunAsWork;
import org.alfresco.repo.security.permissions.impl.model.Permission;
import org.alfresco.service.cmr.repository.NodeRef;
import org.alfresco.service.cmr.security.AuthorityType;
import org.alfresco.service.cmr.security.PermissionService;
import org.alfresco.service.namespace.QName;

/**
 * AdvancedWorkflows extension implementation
 */

public class AdvancedWorkflowsExtension extends RepositoryExtension {

	private ExtensionAware workflowDiscussionsContaingerGet;
	public static final String ID_DISCUSSIONS_DATA_PATH = "discDataPath";
	public static final String WORKFLOW_DISCUSSIONS_MODULE_ID = "workflows-discussions";
	
	public void setWorkflowDiscussionsContaingerGet(
				ExtensionAware workflowDiscussionsContaingerGet) {
		this.workflowDiscussionsContaingerGet = workflowDiscussionsContaingerGet;
	}
	
	// constructor
	public AdvancedWorkflowsExtension() throws Exception {
		id = "advanced-workflows";
		fileListPath = "alvex-advanced-workflows-file-list.txt";
		extInfoPath = "alvex-advanced-workflows.properties";
	}

	@Override
	public void init(boolean failIfInitialized) throws Exception {
		super.init(failIfInitialized);
		initializeStorage();
		workflowDiscussionsContaingerGet.setExtension(this);
	}

	private void initializeStorage() throws Exception {
		// Set access rights
		PermissionService permissionService = extensionRegistry
				.getServiceRegistry().getPermissionService();
		permissionService.setPermission(getDataPath(),
				PermissionService.ALL_AUTHORITIES,
				PermissionService.CONTRIBUTOR, true);
		
		// Initialize storage for workflow discussions
		QName[] DISCUSSIONS_DATA_PATH = new QName[DATA_PATH.length];
		QName[] DISCUSSIONS_DATA_TYPES = new QName[DATA_PATH.length];
		for(int i = 0; i < DATA_PATH.length; i++)
		{
			DISCUSSIONS_DATA_PATH[i] = DATA_PATH[i];
			DISCUSSIONS_DATA_TYPES[i] = DATA_TYPES[i];
		}
		DISCUSSIONS_DATA_PATH[DATA_PATH.length - 1] = QName.createQName(
						AlvexContentModel.ALVEX_MODEL_URI, WORKFLOW_DISCUSSIONS_MODULE_ID);
		DISCUSSIONS_DATA_TYPES[DATA_PATH.length - 1] = ContentModel.TYPE_FOLDER;
		NodeRef discDataPath = extensionRegistry.resolvePath(DISCUSSIONS_DATA_PATH, null);
		if (discDataPath == null)
			discDataPath = extensionRegistry.createPath(DISCUSSIONS_DATA_PATH, null, DISCUSSIONS_DATA_TYPES);
		addNodeToCache(ID_DISCUSSIONS_DATA_PATH, discDataPath);
	}

	@Override
	void upgradeConfiguration(String oldVersion, String oldEdition) {
		//
		
	}
}
