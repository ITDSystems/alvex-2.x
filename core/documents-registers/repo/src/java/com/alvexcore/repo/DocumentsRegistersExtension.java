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
import org.alfresco.service.cmr.repository.MLText;
import org.alfresco.service.cmr.security.AuthorityType;
import org.alfresco.service.cmr.security.PermissionService;
import org.alfresco.service.namespace.QName;
import org.alfresco.service.cmr.version.VersionType;

import org.alfresco.repo.node.NodeServicePolicies;
import org.alfresco.repo.node.NodeServicePolicies.OnCreateNodePolicy;
import org.alfresco.repo.node.NodeServicePolicies.OnUpdatePropertiesPolicy;
import org.alfresco.repo.node.NodeServicePolicies.OnCreateAssociationPolicy;
import org.alfresco.repo.node.NodeServicePolicies.OnDeleteAssociationPolicy;
import org.alfresco.repo.policy.Behaviour;
import org.alfresco.repo.policy.JavaBehaviour;
import org.alfresco.repo.policy.PolicyComponent;

import org.alfresco.service.cmr.repository.NodeService;
import org.alfresco.service.cmr.repository.ChildAssociationRef;
import org.alfresco.service.cmr.repository.AssociationRef;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.io.Serializable;

/**
 * DocumentsRegisters extension implementation
 */

public class DocumentsRegistersExtension extends RepositoryExtension {
	
	protected JavaBehaviour onUpdateRegistryItemPropertiesBehaviour;
	protected JavaBehaviour onUpdateRegistryPropertiesBehaviour;
	
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
		
		onUpdateRegistryItemPropertiesBehaviour = new JavaBehaviour(this,
				"onUpdateRegistryItemProperties", Behaviour.NotificationFrequency.TRANSACTION_COMMIT);
		this.policyComponent.bindClassBehaviour(
				OnUpdatePropertiesPolicy.QNAME,
				AlvexContentModel.TYPE_DOCUMENT_REGISTER_ITEM,
				onUpdateRegistryItemPropertiesBehaviour);
		
		onUpdateRegistryPropertiesBehaviour = new JavaBehaviour(this,
				"onUpdateRegistryProperties", Behaviour.NotificationFrequency.TRANSACTION_COMMIT);
		this.policyComponent.bindClassBehaviour(
				OnUpdatePropertiesPolicy.QNAME,
				AlvexContentModel.TYPE_DOCUMENT_REGISTER,
				onUpdateRegistryPropertiesBehaviour);
	}

	public void onCreateRegister(ChildAssociationRef childAssocRef)
	{
		NodeService nodeService = extensionRegistry
				.getServiceRegistry().getNodeService();
		NodeRef nodeRef = childAssocRef.getChildRef();
		Serializable title = nodeService.getProperty(nodeRef, ContentModel.PROP_TITLE);
		setNodeNameFromProperty(nodeRef, title);
	}
	
	public void onCreateRegisterItem(ChildAssociationRef childAssocRef)
	{
		NodeService nodeService = extensionRegistry
				.getServiceRegistry().getNodeService();
		NodeRef nodeRef = childAssocRef.getChildRef();
		if( nodeService.exists(nodeRef) )
		{
			Serializable title = nodeService.getProperty(nodeRef, AlvexContentModel.PROP_DOCUMENT_ID);
			setNodeNameFromProperty(nodeRef, title);
		}
	}
	
	public void onUpdateRegistryProperties(NodeRef nodeRef,
			Map<QName, Serializable> before, Map<QName, Serializable> after)
	{
		Serializable newName = after.get(ContentModel.PROP_TITLE);
		setNodeNameFromProperty(nodeRef, newName);
	}
	
	public void onUpdateRegistryItemProperties(NodeRef nodeRef,
			Map<QName, Serializable> before, Map<QName, Serializable> after)
	{
		NodeService nodeService = extensionRegistry
				.getServiceRegistry().getNodeService();
		Serializable newName = after.get(AlvexContentModel.PROP_DOCUMENT_ID);
		if( nodeService.exists(nodeRef) )
		{
			setNodeNameFromProperty(nodeRef, newName);

			// Handle auto versioning.
			// We do it here because of "two phase commit" of initial document.
			// If we assign aspect on create, we have bad 'initial version' that is actually empty.
			if( ! before.isEmpty()
					&& ! nodeService.hasAspect(nodeRef, ContentModel.ASPECT_VERSIONABLE) )
			{
				HashMap<QName, Serializable> aspectProps = new HashMap<QName, Serializable>();
				aspectProps.put(ContentModel.PROP_VERSION_TYPE, VersionType.MAJOR);
				//aspectProps.put(ContentModel.PROP_AUTO_VERSION, true);
				//aspectProps.put(ContentModel.PROP_AUTO_VERSION_PROPS, true);
				nodeService.addAspect(nodeRef, ContentModel.ASPECT_VERSIONABLE, aspectProps);
			}
		}
	}
	
	protected void setNodeNameFromProperty(NodeRef nodeRef, Serializable title)
	{
		NodeService nodeService = extensionRegistry
				.getServiceRegistry().getNodeService();
		String currentName = (String) nodeService.getProperty(nodeRef, ContentModel.PROP_NAME);
		
		String newName = null;
		if( title instanceof java.lang.String )
		{
			newName = (String)title;
		}
		else if( title instanceof org.alfresco.service.cmr.repository.MLText )
		{
			newName = ((MLText)title).getDefaultValue();
		}
		
		if( newName != null && ! newName.equals(currentName) )
		{
			nodeService.setProperty(nodeRef, ContentModel.PROP_NAME, newName.replace('/','_'));
		}
	}
	
	public void onCreateAssociation(AssociationRef nodeAssocRef)
	{
		NodeService nodeService = extensionRegistry
				.getServiceRegistry().getNodeService();
		NodeRef source = nodeAssocRef.getSourceRef();
		NodeRef target = nodeAssocRef.getTargetRef();
		if( nodeService.exists(source) && nodeService.exists(target)
				&& alvexDictionaryService.isContent(target)
				&& ! alvexDictionaryService.isRegistry(target)
				&& ! alvexDictionaryService.isRegistryItem(target)
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
		// Delete assoc if necessary
		if( nodeService.exists(source) && nodeService.exists(target)
				&& alvexDictionaryService.isContent(target)
				&& ! alvexDictionaryService.isRegistry(target)
				&& ! alvexDictionaryService.isRegistryItem(target)
				&& nodeService.hasAspect(target, AlvexContentModel.ASPECT_ATTACHED_TO_REGISTRY_ITEM) )
		{
			nodeService.removeAssociation(target, source, AlvexContentModel.ASSOC_PARENT_REGISTRY);
		}
		// Remove aspect if necessary
		if( nodeService.exists(target) 
				&& alvexDictionaryService.isContent(target) 
				&& ! alvexDictionaryService.isRegistry(target)
				&& ! alvexDictionaryService.isRegistryItem(target)
				&& nodeService.hasAspect(target, AlvexContentModel.ASPECT_ATTACHED_TO_REGISTRY_ITEM) )
		{
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
