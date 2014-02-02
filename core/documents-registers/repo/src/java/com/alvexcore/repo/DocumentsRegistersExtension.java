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

import com.alvexcore.repo.AlvexContentModel;
import org.alfresco.model.ContentModel;
import org.alfresco.repo.security.authentication.AuthenticationUtil;
import org.alfresco.repo.security.authentication.AuthenticationUtil.RunAsWork;
import org.alfresco.repo.security.permissions.impl.model.Permission;
import org.alfresco.service.cmr.repository.NodeRef;
import org.alfresco.service.cmr.security.AuthorityType;
import org.alfresco.service.cmr.security.PermissionService;
import org.alfresco.service.namespace.QName;

import org.alfresco.repo.node.NodeServicePolicies;
import org.alfresco.repo.node.NodeServicePolicies.OnCreateNodePolicy;
import org.alfresco.repo.policy.Behaviour;
import org.alfresco.repo.policy.JavaBehaviour;
import org.alfresco.repo.policy.PolicyComponent;

import org.alfresco.service.cmr.repository.NodeService;
import org.alfresco.service.cmr.repository.ChildAssociationRef;

/**
 * DocumentsRegisters extension implementation
 */

public class DocumentsRegistersExtension extends RepositoryExtension {
	protected PolicyComponent policyComponent;
	
	public void setPolicyComponent(PolicyComponent policyComponent)
	{
		this.policyComponent = policyComponent;
	}
	
	// constructor
	public DocumentsRegistersExtension() throws Exception {
		id = "documents-registers";
		fileListPath = "alvex-documents-registers-file-list.txt";
		extInfoPath = "alvex-documents-registers.properties";
	}

	@Override
	public void init(boolean failIfInitialized) throws Exception {
		super.init(failIfInitialized);
		initializeStorage();
		// Bind content policies
		this.policyComponent.bindClassBehaviour(
			OnCreateNodePolicy.QNAME,
			AlvexContentModel.TYPE_DOCUMENT_REGISTER,
			new JavaBehaviour(this, "onCreateRegister", Behaviour.NotificationFrequency.TRANSACTION_COMMIT));
		this.policyComponent.bindClassBehaviour(
			OnCreateNodePolicy.QNAME,
			AlvexContentModel.TYPE_DOCUMENT_REGISTER_ITEM,
			new JavaBehaviour(this, "onCreateRegisterItem", Behaviour.NotificationFrequency.TRANSACTION_COMMIT));
	}

	public void onCreateRegister(ChildAssociationRef childAssocRef)
	{
		NodeService nodeService = extensionRegistry
				.getServiceRegistry().getNodeService();
		NodeRef nodeRef = childAssocRef.getChildRef();
		String title = (String) nodeService.getProperty(nodeRef, ContentModel.PROP_TITLE);
		nodeService.setProperty(nodeRef, ContentModel.PROP_NAME, title);
	}
	
	public void onCreateRegisterItem(ChildAssociationRef childAssocRef)
	{
		NodeService nodeService = extensionRegistry
				.getServiceRegistry().getNodeService();
		NodeRef nodeRef = childAssocRef.getChildRef();
		String title = (String) nodeService.getProperty(nodeRef, AlvexContentModel.PROP_DOCUMENT_ID);
		nodeService.setProperty(nodeRef, ContentModel.PROP_NAME, title);
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
