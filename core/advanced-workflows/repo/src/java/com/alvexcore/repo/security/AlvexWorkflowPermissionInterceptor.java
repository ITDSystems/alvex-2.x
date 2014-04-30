/*
 * Copyright (C) 2005-2013 Alfresco Software Limited.
 * Copyright (C) 2014 ITD Systems LLC.
 *
 * This file is part of Alvex
 *
 * Alvex is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Alvex is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Alvex. If not, see <http://www.gnu.org/licenses/>.
 */
package com.alvexcore.repo.security;

import java.util.ArrayList;
import java.util.List;

import org.alfresco.repo.security.authentication.AuthenticationUtil;
import org.alfresco.repo.security.permissions.AccessDeniedException;
import org.alfresco.service.cmr.security.AuthorityService;
import org.aopalliance.intercept.MethodInterceptor;
import org.aopalliance.intercept.MethodInvocation;

import org.alfresco.service.cmr.workflow.WorkflowService;
import org.alfresco.service.cmr.workflow.WorkflowTask;

import com.alvexcore.repo.tools.WorkflowHelper;

public class AlvexWorkflowPermissionInterceptor implements MethodInterceptor {

	private AuthorityService authorityService;
	private WorkflowService workflowService;
	private WorkflowHelper workflowHelper;

	@Override
	public Object invoke(MethodInvocation invocation) throws Throwable {
		String currentUser = AuthenticationUtil.getRunAsUser();
		// See if we can shortcut (for 'System' and 'admin')
		if (currentUser != null && (authorityService.isAdminAuthority(currentUser) || AuthenticationUtil.isRunAsUserTheSystemUser())) {
			return invocation.proceed();
		}

		String methodName = invocation.getMethod().getName();

		if (methodName.equals("getTaskById")) {
			Object result = invocation.proceed();
			WorkflowTask wt = (WorkflowTask) result;
			if (workflowHelper.isInitiatorOrAssigneeOrManager(wt, currentUser) 
					|| workflowHelper.fromSameParallelReviewWorkflow(wt, currentUser)
					|| workflowHelper.isStartTaskOfProcessInvolvedIn(wt, currentUser)) {
				return result;
			} else {
				String taskId = (String) invocation.getArguments()[0];
				throw new AccessDeniedException("Accessing task with id='" + taskId + "' is not allowed for user '" + currentUser + "'");
			}

		}

		if (methodName.equals("getStartTask")) {
			Object result = invocation.proceed();
			WorkflowTask wt = (WorkflowTask) result;

			if (workflowHelper.isInitiatorOrAssigneeOrManager(wt, currentUser) 
					|| workflowHelper.isUserPartOfProcess(wt, currentUser)) {
				return result;
			} else {
				String taskId = (String) invocation.getArguments()[0];
				throw new AccessDeniedException("Accessing task with id='" + taskId + "' is not allowed for user '" + currentUser + "'");
			}

		}

		if (methodName.equals("updateTask") || methodName.equals("endTask")) {
			String taskId = (String) invocation.getArguments()[0];
			WorkflowTask taskToUpdate = workflowService.getTaskById(taskId);
			if (workflowHelper.isInitiatorOrAssigneeOrManager(taskToUpdate, currentUser)) {
				return invocation.proceed();
			} else {
				throw new AccessDeniedException("Accessing task with id='" + taskId + "' is not allowed for user '" + currentUser + "'");
			}

		}

		// Not including getAssignedTasks and getPooledTasks, as the methods themselves already take into account the authenticated user/group
		if (methodName.equals("getTasksForWorkflowPath") || methodName.equals("getStartTasks")) {
			Object result = invocation.proceed();
			List<WorkflowTask> rawList = (List<WorkflowTask>) result;
			List<WorkflowTask> resultList = new ArrayList<WorkflowTask>(rawList.size());

			for (WorkflowTask wt : rawList) {
				if (workflowHelper.isInitiatorOrAssigneeOrManager(wt, currentUser) 
						|| workflowHelper.fromSameParallelReviewWorkflow(wt, currentUser)
						|| workflowHelper.isStartTaskOfProcessInvolvedIn(wt, currentUser)) {
					resultList.add(wt);
				}
			}

			return resultList;
		}
		
		if (methodName.equals("queryTasks")) {
			Object result = invocation.proceed();
			List<WorkflowTask> rawList = (List<WorkflowTask>) result;
			List<WorkflowTask> resultList = new ArrayList<WorkflowTask>(rawList.size());

			for (WorkflowTask wt : rawList) {
				if (workflowHelper.isInitiatorOrAssigneeOrManager(wt, currentUser) 
						|| workflowHelper.fromSameParallelReviewWorkflow(wt, currentUser)
						|| workflowHelper.isStartTaskOfProcessInvolvedIn(wt, rawList, currentUser)) {
					resultList.add(wt);
				}
			}

			return resultList;
		}

		return invocation.proceed();
	}

	public void setAuthorityService(AuthorityService authorityService) {
		this.authorityService = authorityService;
	}

	public void setWorkflowService(WorkflowService workflowService) {
		this.workflowService = workflowService;
	}
	
	public void setWorkflowHelper(WorkflowHelper workflowHelper) {
		this.workflowHelper = workflowHelper;
	}

}
