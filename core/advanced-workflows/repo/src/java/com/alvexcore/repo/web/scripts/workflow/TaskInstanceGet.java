/*
 * Copyright (C) 2005-2011 Alfresco Software Limited.
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
package com.alvexcore.repo.web.scripts.workflow;

import java.util.HashMap;
import java.util.Map;

import javax.servlet.http.HttpServletResponse;

import org.alfresco.service.cmr.workflow.WorkflowTask;
import org.springframework.extensions.webscripts.Cache;
import org.springframework.extensions.webscripts.Status;
import org.springframework.extensions.webscripts.WebScriptException;
import org.springframework.extensions.webscripts.WebScriptRequest;

import org.alfresco.repo.security.authentication.AuthenticationUtil;
import org.alfresco.repo.web.scripts.workflow.AbstractWorkflowWebscript;
import org.alfresco.repo.web.scripts.workflow.WorkflowModelBuilder;
import org.alfresco.service.cmr.workflow.WorkflowService;

/**
 * @author unknown
 * @since 3.4
 */
public class TaskInstanceGet extends AbstractWorkflowWebscript
{
    protected WorkflowService alvexWorkflowService;
    
    public void setAlvexWorkflowService(WorkflowService alvexWorkflowService)
    {
        this.alvexWorkflowService = alvexWorkflowService;
    }
    
    @Override
    protected Map<String, Object> buildModel(WorkflowModelBuilder modelBuilder, WebScriptRequest req, Status status, Cache cache)
    {
        String requesterUserName = AuthenticationUtil.getFullyAuthenticatedUser();
        Map<String, String> params = req.getServiceMatch().getTemplateVars();

        // getting task id from request parameters
        String taskId = params.get("task_instance_id");

        // searching for task in repository
        WorkflowTask workflowTask = workflowService.getTaskById(taskId);

        // task was not found -> return 404
        if (workflowTask == null)
        {
            throw new WebScriptException(HttpServletResponse.SC_NOT_FOUND, "Unable to find workflow task with id: " + taskId);
        }

        Map<String, Object> model = new HashMap<String, Object>();
        // build the model for ftl
        Map<String, Object> taskProps = modelBuilder.buildDetailed(workflowTask);
        taskProps.put(WorkflowModelBuilder.TASK_IS_REASSIGNABLE, 
                alvexWorkflowService.isTaskReassignable(workflowTask, requesterUserName));
        taskProps.put(WorkflowModelBuilder.TASK_IS_EDITABLE, 
                alvexWorkflowService.isTaskEditable(workflowTask, requesterUserName));
        model.put("workflowTask", taskProps);

        return model;
    }

}