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
import com.alvexcore.repo.AlvexDictionaryService;
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
import org.alfresco.repo.node.NodeServicePolicies.OnCreateAssociationPolicy;
import org.alfresco.repo.node.NodeServicePolicies.OnDeleteAssociationPolicy;
import org.alfresco.repo.policy.Behaviour;
import org.alfresco.repo.policy.JavaBehaviour;
import org.alfresco.repo.policy.PolicyComponent;

import org.alfresco.service.cmr.repository.NodeService;
import org.alfresco.service.cmr.repository.ChildAssociationRef;
import org.alfresco.service.cmr.repository.AssociationRef;

import java.util.List;

/**
 * DocumentsRegisters extension implementation
 */

public class DocumentsRegistersExtension extends RepositoryExtension {
	
	protected JavaBehaviour onUpdateRegistryItemPropertiesBehaviour;
	protected PolicyComponent policyComponent;
	protected AlvexDictionaryService alvexDictionaryService;
	
	public void setPolicyComponent(PolicyComponent policyComponent)
	{
		this.policyComponent = policyComponent;
	}
	
	public void setAlvexDictionaryService(AlvexDictionaryService alvexDictionaryService)
	{
		this.alvexDictionaryService = alvexDictionaryService;
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
		this.policyComponent.bindAssociationBehaviour(
			OnCreateAssociationPolicy.QNAME,
			AlvexContentModel.TYPE_DOCUMENT_REGISTER_ITEM,
			new JavaBehaviour(this, "onCreateAssociation", Behaviour.NotificationFrequency.TRANSACTION_COMMIT));
		this.policyComponent.bindAssociationBehaviour(
			OnDeleteAssociationPolicy.QNAME,
			AlvexContentModel.TYPE_DOCUMENT_REGISTER_ITEM,
			new JavaBehaviour(this, "onDeleteAssociation", Behaviour.NotificationFrequency.TRANSACTION_COMMIT));
	}

	public void onCreateRegister(ChildAssociationRef childAssocRef)
	{
		NodeService nodeService = extensionRegistry
				.getServiceRegistry().getNodeService();
		NodeRef nodeRef = childAssocRef.getChildRef();
		String title = (String) nodeService.getProperty(nodeRef, ContentModel.PROP_TITLE);
		nodeService.setProperty(nodeRef, ContentModel.PROP_NAME, title.replace('/','_'));
	}
	
	public void onCreateRegisterItem(ChildAssociationRef childAssocRef)
	{
		NodeService nodeService = extensionRegistry
				.getServiceRegistry().getNodeService();
		NodeRef nodeRef = childAssocRef.getChildRef();
		String title = (String) nodeService.getProperty(nodeRef, AlvexContentModel.PROP_DOCUMENT_ID);
		nodeService.setProperty(nodeRef, ContentModel.PROP_NAME, title.replace('/','_'));
	}
	
	public void onCreateAssociation(AssociationRef nodeAssocRef)
	{
		NodeService nodeService = extensionRegistry
				.getServiceRegistry().getNodeService();
		NodeRef source = nodeAssocRef.getSourceRef();
		NodeRef target = nodeAssocRef.getTargetRef();
		if( alvexDictionaryService.isContent(target)
				&& ! nodeAssocRef.getTypeQName().equals( AlvexContentModel.ASSOC_PARENT_REGISTRY ) )
		{
			nodeService.addAspect(target, AlvexContentModel.ASPECT_ATTACHED_TO_REGISTRY_ITEM, null);
			nodeService.createAssociation(target, source, AlvexContentModel.ASSOC_PARENT_REGISTRY);
		}
	}
	
	public void onDeleteAssociation(AssociationRef nodeAssocRef)
	{
		NodeService nodeService = extensionRegistry
				.getServiceRegistry().getNodeService();
		NodeRef source = nodeAssocRef.getSourceRef();
		NodeRef target = nodeAssocRef.getTargetRef();
		if( alvexDictionaryService.isContent(target)
				&& nodeService.hasAspect(target, AlvexContentModel.ASPECT_ATTACHED_TO_REGISTRY_ITEM) )
		{
			nodeService.removeAssociation(target, source, AlvexContentModel.ASSOC_PARENT_REGISTRY);
			List<AssociationRef> assocs = nodeService.getTargetAssocs(target, AlvexContentModel.ASSOC_PARENT_REGISTRY);
			if(assocs.isEmpty())
				nodeService.removeAspect(target, AlvexContentModel.ASPECT_ATTACHED_TO_REGISTRY_ITEM);
		}
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
