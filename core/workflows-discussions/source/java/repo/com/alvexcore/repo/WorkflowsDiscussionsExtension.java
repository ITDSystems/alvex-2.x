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

	public final static QName[] DISCUSSIONS_STORAGE_PATH = {
			AlvexContentModel.ASSOC_NAME_SYSTEM,
			AlvexContentModel.ASSOC_NAME_ALVEX,
			AlvexContentModel.ASSOC_NAME_DATA,
			QName.createQName(AlvexContentModel.ALVEX_MODEL_URI,
					"workflows-discussions") };

	public final static QName[] DISCUSSIONS_STORAGE_TYPES = {
			ContentModel.TYPE_CONTAINER, ContentModel.TYPE_CONTAINER,
			ContentModel.TYPE_CONTAINER, ContentModel.TYPE_FOLDER };

	// constructor
	public WorkflowsDiscussionsExtension() throws Exception {
		id = "workflows-discussions";
		fileListPath = "alvex-workflows-discussions-file-list.txt";
		extInfoPath = "alvex-workflows-discussions.properties";
	}

	@Override
	public void init() throws Exception {
		super.init();
		// initialize workflow discussions storage
		initializeStorage();
	}

	private void initializeStorage() throws Exception {
		NodeRef node = extensionRegistry.createPath(
				DISCUSSIONS_STORAGE_PATH, null, DISCUSSIONS_STORAGE_TYPES);
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
