/**
 * Copyright © 2012 ITD Systems
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
 * RelatedWorkflows extension implementation
 */

public class RelatedWorkflowsExtension extends RepositoryExtension {

	public final static QName[] RELATED_WORKFLOWS_STORAGE_PATH = {
			AlvexContentModel.ASSOC_NAME_SYSTEM,
			AlvexContentModel.ASSOC_NAME_ALVEX,
			AlvexContentModel.ASSOC_NAME_DATA,
			QName.createQName(AlvexContentModel.ALVEX_MODEL_URI,
					"related-workflows") };

	public final static QName[] RELATED_WORKFLOWS_STORAGE_TYPES = {
			ContentModel.TYPE_CONTAINER, ContentModel.TYPE_CONTAINER,
			ContentModel.TYPE_CONTAINER, ContentModel.TYPE_CONTAINER };

	// constructor
	public RelatedWorkflowsExtension() throws Exception {
		id = "related-workflows";
		fileListPath = "alvex-related-workflows-file-list.txt";
		extInfoPath = "alvex-related-workflows.properties";
	}

	@Override
	public void init(boolean failIfInitialized) throws Exception{
		super.init(failIfInitialized);
		initializeStorage();
	}

	private void initializeStorage() throws Exception {
		NodeRef node = extensionRegistry.createPath(
				RELATED_WORKFLOWS_STORAGE_PATH, null, RELATED_WORKFLOWS_STORAGE_TYPES);
		PermissionService permissionService = extensionRegistry
				.getServiceRegistry().getPermissionService();
		permissionService.setPermission(node,
				PermissionService.ALL_AUTHORITIES,
				PermissionService.CONTRIBUTOR, true);
	}

	@Override
	void upgradeConfiguration(String oldVersion, String oldEdition) {
		//		
	}
}
