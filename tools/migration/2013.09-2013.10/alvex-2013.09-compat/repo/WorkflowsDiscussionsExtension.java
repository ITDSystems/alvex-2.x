/**
 * Copyright © 2012 ITD Systems
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
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
 * WorkflowsDiscussions extension implementation
 */

public class WorkflowsDiscussionsExtension extends RepositoryExtension {
	
	private ExtensionAware workflowDiscussionsContaingerGet;

	public void setWorkflowDiscussionsContaingerGet(
			ExtensionAware workflowDiscussionsContaingerGet) {
		this.workflowDiscussionsContaingerGet = workflowDiscussionsContaingerGet;
	}

	// constructor
	public WorkflowsDiscussionsExtension() throws Exception {
		id = "workflows-discussions";
		fileListPath = "alvex-workflows-discussions-file-list.txt";
		extInfoPath = "alvex-workflows-discussions.properties";
		DATA_TYPES[3] = ContentModel.TYPE_FOLDER;
	}

	@Override
	public void init(boolean failIfInitialized) throws Exception {
		super.init(failIfInitialized);
		// initialize workflow discussions storage
		initializeStorage();
		workflowDiscussionsContaingerGet.setExtension(this);
	}

	private void initializeStorage() throws Exception {
		PermissionService permissionService = extensionRegistry
				.getServiceRegistry().getPermissionService();
		permissionService.setPermission(getDataPath(),
				PermissionService.ALL_AUTHORITIES,
				PermissionService.CONTRIBUTOR, true);
	}

	@Override
	void upgradeConfiguration(String oldVersion, String oldEdition) {
		//

	}

}
