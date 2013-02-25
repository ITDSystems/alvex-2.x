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
 * DocumentsRegisters extension implementation
 */

public class DocumentsRegistersExtension extends RepositoryExtension {

	public final static QName[] DOCUMENTS_REGISTERS_STORAGE_PATH = {
			AlvexContentModel.ASSOC_NAME_SYSTEM,
			AlvexContentModel.ASSOC_NAME_ALVEX,
			AlvexContentModel.ASSOC_NAME_DATA,
			QName.createQName(AlvexContentModel.ALVEX_MODEL_URI,
					"documents-registers") };

	public final static QName[] DOCUMENTS_REGISTERS_STORAGE_TYPES = {
			ContentModel.TYPE_CONTAINER, ContentModel.TYPE_CONTAINER,
			ContentModel.TYPE_CONTAINER, ContentModel.TYPE_CONTAINER };

	// constructor
	public DocumentsRegistersExtension() throws Exception {
		id = "documents-registers";
		fileListPath = "alvex-documents-registers-file-list.txt";
		extInfoPath = "alvex-documents-registers.properties";
	}

	@Override
	public void init() {
		// initialize workflow discussions storage
		AuthenticationUtil.runAsSystem(new RunAsWork<Void>() {

			public Void doWork() throws Exception {
				initializeStorage();
				return null;
			}
		});
	}

	private void initializeStorage() throws Exception {
		NodeRef node = extensionRegistry.createPath(
				DOCUMENTS_REGISTERS_STORAGE_PATH, null, DOCUMENTS_REGISTERS_STORAGE_TYPES);
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
