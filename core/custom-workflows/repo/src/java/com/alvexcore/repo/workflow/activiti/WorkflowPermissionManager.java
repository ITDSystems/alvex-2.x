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

package com.alvexcore.repo.workflow.activiti;

import com.alvexcore.repo.AlvexContentModel;
import java.util.HashSet;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import org.activiti.engine.delegate.DelegateExecution;
import org.activiti.engine.delegate.DelegateTask;
import org.activiti.engine.delegate.ExecutionListener;
import org.activiti.engine.delegate.TaskListener;
import org.activiti.engine.delegate.VariableScope;
import org.alfresco.repo.security.authentication.AuthenticationUtil;
import org.alfresco.repo.security.authentication.AuthenticationUtil.RunAsWork;
import org.alfresco.repo.workflow.activiti.ActivitiScriptNode;
import org.alfresco.repo.workflow.activiti.ActivitiScriptNodeList;
import org.alfresco.service.ServiceRegistry;
import org.alfresco.service.cmr.repository.ChildAssociationRef;
import org.alfresco.service.cmr.repository.AssociationRef;
import org.alfresco.service.cmr.repository.NodeRef;
import org.alfresco.service.cmr.repository.NodeService;
import org.alfresco.service.cmr.security.AuthorityService;
import org.alfresco.service.cmr.security.AuthorityType;
import org.alfresco.service.cmr.security.PermissionService;
import org.springframework.beans.factory.InitializingBean;

import com.alvexcore.repo.CustomWorkflowsExtension;

class GrantPermissionsWork implements RunAsWork<Void> {

	private ServiceRegistry serviceRegistry;
	private String userName;
	private String groupId;

	public GrantPermissionsWork(ServiceRegistry serviceRegistry,
			String userName, String groupId) {
		this.serviceRegistry = serviceRegistry;
		this.userName = userName;
		this.groupId = serviceRegistry.getAuthorityService().getName(
				AuthorityType.GROUP, groupId);
	}

	@Override
	public Void doWork() throws Exception {
		AuthorityService authorityService = serviceRegistry
				.getAuthorityService();
		if (!authorityService.getAuthoritiesForUser(userName).contains(groupId))
			authorityService.addAuthority(groupId, userName);
		return null;
	}

}

class CreateGroupWork implements RunAsWork<Void> {
	private ServiceRegistry serviceRegistry;
	private String groupId;

	public CreateGroupWork(ServiceRegistry serviceRegistry, String groupId) {
		this.serviceRegistry = serviceRegistry;
		this.groupId = groupId;
	}

	@Override
	public Void doWork() throws Exception {
		// create group to hold all persons during process
		AuthorityService authorityService = serviceRegistry
				.getAuthorityService();
		Set<String> zones = new HashSet<String>();
		zones.add(WorkflowPermissionManager.ZONE_ALVEX);
		authorityService.createAuthority(AuthorityType.GROUP, groupId, groupId, zones);

		authorityService.addAuthority(authorityService.getName(
				AuthorityType.GROUP, CustomWorkflowsExtension.ROOT_GROUP_NAME),
				authorityService.getName(AuthorityType.GROUP, groupId));
		return null;
	}

}

class SetPermissionsWork implements RunAsWork<Void> {

	private String permission;

	private List<NodeRef> attachments;
	private String groupId;
	private ServiceRegistry serviceRegistry;

	public SetPermissionsWork(ServiceRegistry serviceRegistry, List<NodeRef> attachments,
			String groupId, String permission) {
		this.permission = permission;
		this.serviceRegistry = serviceRegistry;
		this.attachments = attachments;
		this.groupId = serviceRegistry.getAuthorityService().getName(
				AuthorityType.GROUP, groupId);
	}

	@Override
	public Void doWork() throws Exception {
		NodeService ns = serviceRegistry.getNodeService();
		PermissionService ps = serviceRegistry.getPermissionService();
		
		for (NodeRef docRef : attachments) {
			ps.setPermission(docRef, groupId, permission, true);
			// Handle register items with attached files
			for (AssociationRef file: ns.getTargetAssocs(docRef, AlvexContentModel.ASSOC_FILES))
				ps.setPermission(file.getTargetRef(), groupId, permission, true);
		}
		return null;
	}

}

class SetDiscussionOwnershipWork implements RunAsWork<Void> {

	final static String PERMISSION = PermissionService.CONTRIBUTOR;

	private ServiceRegistry serviceRegistry;
	private NodeRef ref;
	private String groupId;

	public SetDiscussionOwnershipWork(ServiceRegistry serviceRegistry,
			NodeRef ref, String groupId) {
		this.serviceRegistry = serviceRegistry;
		this.ref = ref;
		this.groupId = serviceRegistry.getAuthorityService().getName(
				AuthorityType.GROUP, groupId);
	}

	@Override
	public Void doWork() throws Exception {
		serviceRegistry.getPermissionService().setPermission(ref, groupId,
				PERMISSION, true);
		return null;
	}

}

public class WorkflowPermissionManager extends AlvexActivitiListener implements
		TaskListener, InitializingBean, ExecutionListener {

	public static final String ZONE_ALVEX = "ZONE.ALVEX";
	private static final String BPM_PACKAGE_VARIABLE = "bpm_package";
	private static final String DISCUSSION_VARIABLE = "alvexwfd_discussion";

	private String packageVariable = "bpm_package";
	private String filePermission = PermissionService.CONSUMER;
	
	public void setPackageVariable(String variableName)
	{
		packageVariable = variableName;
	}
	
	public void setFilePermission(String permission)
	{
		String perm = permission.toLowerCase();
		if( perm.equals("ro") || perm.equals("read") )
			filePermission = PermissionService.CONSUMER;
		if( perm.equals("rw") || perm.equals("read-write") )
			filePermission = PermissionService.EDITOR;
		
		if( perm.equals("consumer") )
			filePermission = PermissionService.CONSUMER;
		if( perm.equals("contributor") )
			filePermission = PermissionService.CONTRIBUTOR;
		if( perm.equals("editor") )
			filePermission = PermissionService.EDITOR;
		if( perm.equals("coordinator") )
			filePermission = PermissionService.COORDINATOR;
	}
	
	public void grantPermissions(String assignee, String groupId) {
		if( assignee == null )
			return;
		// run work to grant permissions to user
		RunAsWork<Void> work = new GrantPermissionsWork(serviceRegistry,
				assignee, groupId);
		AuthenticationUtil.runAsSystem(work);

	}

	public void setPermissions(VariableScope scope, String groupId) {
		ArrayList<NodeRef> attachments = new ArrayList<NodeRef>();
		
		// Handle bpm:package
		if(BPM_PACKAGE_VARIABLE.equalsIgnoreCase(packageVariable)) {
			// get reference to workflow package
			NodeRef pkg = ((ActivitiScriptNode) scope
					.getVariable(packageVariable)).getNodeRef();
			List<ChildAssociationRef> assocs = serviceRegistry.getNodeService().getChildAssocs(pkg);
			for (ChildAssociationRef assoc : assocs) {
				NodeRef docRef = assoc.getChildRef();
				attachments.add(docRef);
			}
		// Handle other variables
		} else {
			ActivitiScriptNodeList documents = (ActivitiScriptNodeList) scope
					.getVariable(packageVariable);
			for (ActivitiScriptNode document : documents) {
				NodeRef docRef = document.getNodeRef();
				attachments.add(docRef);
			}
		}
		
		// run work to set permissions on all documents in package
		RunAsWork<Void> work = new SetPermissionsWork(serviceRegistry, attachments,
				groupId, filePermission);
		AuthenticationUtil.runAsSystem(work);
	}

	public void createGroup(String groupId) {
		// run work to create group for the workflow instance
		RunAsWork<Void> work = new CreateGroupWork(serviceRegistry, groupId);
		AuthenticationUtil.runAsSystem(work);
	}

	@Override
	public void notify(DelegateTask delegateTask) {

		String groupId = getGroupForId(delegateTask.getProcessInstanceId());

		AuthorityService as = serviceRegistry.getAuthorityService();
		if (!as.authorityExists(as.getName(AuthorityType.GROUP, groupId)))
			return;

		if (delegateTask.getEventName() == EVENTNAME_ASSIGNMENT) {
			grantPermissions(delegateTask.getAssignee(), groupId);
		} else {
			setPermissions(delegateTask, groupId);
		}
	}

	String getGroupForId(String id) {
		return "activiti" + id;
	}

	@Override
	public void notify(DelegateExecution execution) throws Exception {
		// get id of the group to create
		String groupId = getGroupForId(execution.getProcessInstanceId());
		createGroup(groupId);
		setPermissions(execution, groupId);
		setDiscussionOwnership(serviceRegistry, execution, groupId);
		grantPermissions(serviceRegistry.getAuthenticationService()
				.getCurrentUserName(), groupId);
	}

	private void setDiscussionOwnership(ServiceRegistry serviceRegistry,
			DelegateExecution execution, String groupId) {
		ActivitiScriptNode node = (ActivitiScriptNode) execution
				.getVariable(DISCUSSION_VARIABLE);
		if (node != null) {
			RunAsWork<Void> work = new SetDiscussionOwnershipWork(
					serviceRegistry, node.getNodeRef(), groupId);
			AuthenticationUtil.runAsSystem(work);
		}

	}
}
