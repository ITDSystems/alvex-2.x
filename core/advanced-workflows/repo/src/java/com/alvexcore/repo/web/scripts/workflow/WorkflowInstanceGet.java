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

import org.alfresco.service.cmr.workflow.WorkflowInstance;
import org.springframework.extensions.webscripts.Cache;
import org.springframework.extensions.webscripts.Status;
import org.springframework.extensions.webscripts.WebScriptException;
import org.springframework.extensions.webscripts.WebScriptRequest;

import org.alfresco.repo.security.authentication.AuthenticationUtil;
import org.alfresco.repo.security.authentication.AuthenticationUtil.RunAsWork;
import org.alfresco.repo.web.scripts.workflow.AbstractWorkflowWebscript;
import org.alfresco.repo.web.scripts.workflow.WorkflowModelBuilder;

/**
 * @author unknown
 * @since 3.4
 */

class getModelWork implements RunAsWork<Map<String, Object>>
{
    private WorkflowModelBuilder modelBuilder;
    private WorkflowInstance workflowInstance;
    private boolean includeTasks;
    
    public getModelWork(WorkflowModelBuilder modelBuilder, WorkflowInstance workflowInstance, boolean includeTasks)
    {
        this.modelBuilder = modelBuilder;
        this.workflowInstance = workflowInstance;
        this.includeTasks = includeTasks;
    }
    
    @Override
    public Map<String, Object> doWork() throws Exception {
        Map<String, Object> model = new HashMap<String, Object>();
        // build the model for ftl
        model.put("workflowInstance", modelBuilder.buildDetailed(workflowInstance, includeTasks));
        return model;
    }
}


public class WorkflowInstanceGet extends AbstractWorkflowWebscript
{
    public static final String PARAM_INCLUDE_TASKS = "includeTasks";

    @Override
    protected Map<String, Object> buildModel(WorkflowModelBuilder modelBuilder, WebScriptRequest req, Status status, Cache cache)
    {
        Map<String, String> params = req.getServiceMatch().getTemplateVars();

        // getting workflow instance id from request parameters
        String workflowInstanceId = params.get("workflow_instance_id");

        boolean includeTasks = getIncludeTasks(req);

        WorkflowInstance workflowInstance = workflowService.getWorkflowById(workflowInstanceId);

        // task was not found -> return 404
        if (workflowInstance == null)
        {
            throw new WebScriptException(HttpServletResponse.SC_NOT_FOUND, "Unable to find workflow instance with id: " + workflowInstanceId);
        }

        // TODO: think more carefully - if it is ok to return all tasks here.
        // We know only that workflowInstance is not null.
        // Is it enough to conclude that user have some rights for workflow?
        RunAsWork<Map<String, Object>> work = new getModelWork(modelBuilder, workflowInstance, includeTasks);
        Map<String, Object> model = AuthenticationUtil.runAsSystem(work);

        return model;
    }

    private boolean getIncludeTasks(WebScriptRequest req)
    {
        String includeTasks = req.getParameter(PARAM_INCLUDE_TASKS);
        if (includeTasks != null)
        {
            try
            {
                return Boolean.valueOf(includeTasks);
            }
            catch (Exception e)
            {
                // do nothing, false will be returned
            }
        }

        // Defaults to false.
        return false;
    }

}
