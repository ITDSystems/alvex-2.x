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

import java.util.List;

import org.activiti.engine.delegate.DelegateExecution;
import org.activiti.engine.delegate.DelegateTask;
import org.activiti.engine.delegate.VariableScope;
import org.alfresco.repo.security.authentication.AuthenticationUtil;
import org.alfresco.repo.security.authentication.AuthenticationUtil.RunAsWork;
import org.alfresco.repo.workflow.activiti.ActivitiScriptNode;
import org.alfresco.service.ServiceRegistry;
import org.alfresco.service.cmr.repository.ChildAssociationRef;
import org.alfresco.service.cmr.repository.NodeRef;
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
		authorityService.createAuthority(AuthorityType.GROUP, groupId);

		authorityService.addAuthority(authorityService.getName(
				AuthorityType.GROUP, CustomWorkflowsExtension.ROOT_GROUP_NAME),
				authorityService.getName(AuthorityType.GROUP, groupId));
		return null;
	}

}

class SetPermissionsWork implements RunAsWork<Void> {

	final static String PERMISSION = PermissionService.CONSUMER;

	private NodeRef pkg;
	private String groupId;
	private ServiceRegistry serviceRegistry;

	public SetPermissionsWork(ServiceRegistry serviceRegistry, NodeRef pkg,
			String groupId) {
		this.serviceRegistry = serviceRegistry;
		this.pkg = pkg;
		this.groupId = serviceRegistry.getAuthorityService().getName(
				AuthorityType.GROUP, groupId);
	}

	@Override
	public Void doWork() throws Exception {
		List<ChildAssociationRef> assocs = serviceRegistry.getNodeService()
				.getChildAssocs(pkg);
		for (ChildAssociationRef assoc : assocs) {
			serviceRegistry.getPermissionService().setPermission(
					assoc.getChildRef(), groupId, PERMISSION, true);
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

public class WorkflowPermissionManager implements AbstractAlvexTaskListener,
		InitializingBean, AbstractAlvexExecutionListener {

	private static final String PACKAGE_VARIABLE = "bpm_package";
	private static final String DISCUSSION_VARIABLE = "alvexwfd_discussion";
	private AlvexAssignTaskListener assignTaskListener;
	private ServiceRegistry serviceRegistry;

	protected AlvexPreParseListener alvexPreParseListener;

	public void setAlvexPreParseListener(
			AlvexPreParseListener alvexPreParseListener) {
		this.alvexPreParseListener = alvexPreParseListener;
	}

	public void setServiceRegistry(ServiceRegistry serviceRegistry) {
		this.serviceRegistry = serviceRegistry;
	}

	public AlvexAssignTaskListener getAssignTaskListener() {
		return assignTaskListener;
	}

	public void setAssignTaskListener(AlvexAssignTaskListener assignTaskListener) {
		this.assignTaskListener = assignTaskListener;
	}

	@Override
	public void afterPropertiesSet() throws Exception {
		if (alvexPreParseListener == null || assignTaskListener == null)
			throw new Exception("Dependencies missed.");
		// register
		assignTaskListener.addAfterChangeListener(this);
		alvexPreParseListener.addProcessListener(EVENTNAME_START, this);
		alvexPreParseListener.addTaskListener(EVENTNAME_COMPLETE, this);
	}

	public void grantPermissions(String assignee, String groupId) {
		// run work to grant permissions to user
		RunAsWork<Void> work = new GrantPermissionsWork(serviceRegistry,
				assignee, groupId);
		AuthenticationUtil.runAsSystem(work);

	}

	public void setPermissions(VariableScope scope, String groupId) {
		// get reference to workflow package
		NodeRef pkg = ((ActivitiScriptNode) scope.getVariable(PACKAGE_VARIABLE))
				.getNodeRef();
		// run work to set permissions on all documents in package
		RunAsWork<Void> work = new SetPermissionsWork(serviceRegistry, pkg,
				groupId);
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
	public boolean taskMatches(String processName, String taskName) {
		// TODO do we actually want to add callbacks to all tasks?
		return processMatches(processName);
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

	@Override
	public boolean processMatches(String definition) {
		// TODO do we actually want to add callbacks to all processes?
		return true;
	}

}
