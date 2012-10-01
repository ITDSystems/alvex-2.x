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

import java.util.List;

import org.alfresco.model.ContentModel;
import org.alfresco.repo.security.authentication.AuthenticationUtil;
import org.alfresco.repo.security.authentication.AuthenticationUtil.RunAsWork;
import org.alfresco.service.ServiceRegistry;
import org.alfresco.service.cmr.repository.ChildAssociationRef;
import org.alfresco.service.cmr.repository.NodeRef;
import org.alfresco.service.cmr.repository.NodeService;
import org.alfresco.service.cmr.repository.StoreRef;
import org.alfresco.service.namespace.QName;

import com.alvexcore.Extension;

public abstract class RepositoryExtension extends Extension {

	final static QName[] CONFIG_PATH = { AlvexContentModel.ASSOC_NAME_SYSTEM,
			AlvexContentModel.ASSOC_NAME_ALVEX,
			AlvexContentModel.ASSOC_NAME_CONFIG };

	protected ServiceRegistry serviceRegistry;

	public RepositoryExtension() throws Exception {
		super();
	}

	// creates containers specified by assocs
	public NodeRef createPath(QName[] path, QName[] assocs, QName[] types)
			throws Exception {
		if (path == null || path.length == 0)
			throw new Exception("Path cannot be null or empty");
		if (assocs != null && path.length != assocs.length)
			throw new Exception("Size of path and assocs must be equal");
		if (types != null && path.length != types.length)
			throw new Exception("Size of path and types must be equal");
		NodeService nodeService = serviceRegistry.getNodeService();
		NodeRef node = nodeService
				.getRootNode(StoreRef.STORE_REF_WORKSPACE_SPACESSTORE);
		for (int i = 0; i < path.length; i++) {
			QName assocQName = path[i];
			QName childAssoc = assocs == null ? ContentModel.ASSOC_CHILDREN
					: assocs[i];
			QName childType = types == null ? ContentModel.TYPE_CONTAINER
					: types[i];
			List<ChildAssociationRef> childAssocs = nodeService.getChildAssocs(
					node, childAssoc, assocQName);
			if (childAssocs.size() == 0) {
				// create new node
				node = nodeService.createNode(node, childAssoc, assocQName,
						childType).getChildRef();
			} else if (childAssocs.size() == 1)
				// get ref of existent node
				node = childAssocs.get(0).getChildRef();
		}
		return node;
	}

	// upgrades configuration if installation was upgraded
	abstract void upgradeConfiguration(String oldVersion, String oldEdition);

	@Override
	public void afterPropertiesSet() throws Exception {
		super.afterPropertiesSet();
		if (registry instanceof RepositoryExtensionRegistry)
			serviceRegistry = ((RepositoryExtensionRegistry) registry)
					.getServiceRegistry();
		else
			throw new Exception("Extension registry is invalid, it's fatal.");
		// check if installation was upgraded
		AuthenticationUtil.runAs(new RunAsWork<Void>() {

			public Void doWork() throws Exception {
				updateExtensionInfo();
				return null;
			}
		}, AuthenticationUtil.getSystemUserName());
	}

	// updates extension info in repository and runs upgradeConfiguration() if
	// necessary
	protected void updateExtensionInfo() throws Exception {
		NodeRef node = createPath(CONFIG_PATH, null, null);
		NodeService nodeService = serviceRegistry.getNodeService();
		QName assocQName = QName.createQName(AlvexContentModel.ALVEX_MODEL_URI,
				id);
		List<ChildAssociationRef> assocs = nodeService.getChildAssocs(node,
				ContentModel.ASSOC_CHILDREN, assocQName);
		if (assocs.size() == 0) {
			// this is the first start, create node
			node = nodeService.createNode(node, ContentModel.ASSOC_CHILDREN,
					assocQName, AlvexContentModel.TYPE_EXTENSION_CONFIG)
					.getChildRef();
		} else {
			node = assocs.get(0).getChildRef();
			String edition = (String) nodeService.getProperty(node,
					AlvexContentModel.PROP_EXTENSION_EDITION);
			String version = (String) nodeService.getProperty(node,
					AlvexContentModel.PROP_EXTENSION_VERSION);
			if (edition == null || version == null)
				throw new Exception(
						"Edition or version found in repository is invalid.");
			upgradeConfiguration(version, edition);
		}
		// store current edition and version
		nodeService.setProperty(node, AlvexContentModel.PROP_EXTENSION_VERSION,
				version);
		nodeService.setProperty(node, AlvexContentModel.PROP_EXTENSION_EDITION,
				edition);
	}
}