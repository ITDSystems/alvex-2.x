/*
 * Copyright (C) 2005-2011 Alfresco Software Limited.
 * Copyright (C) 2012 ITD Systems
 *
 * This file is part of Alvex
 *
 * Alfresco is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Alfresco is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Alfresco. If not, see <http://www.gnu.org/licenses/>.
 */
package com.alvexcore.repo.web.scripts.workflow;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import java.io.Serializable;

import javax.servlet.http.HttpServletResponse;

import org.alfresco.model.ContentModel;
import org.alfresco.service.cmr.repository.NodeRef;
import org.alfresco.service.cmr.workflow.WorkflowInstance;
import org.springframework.extensions.webscripts.Cache;
import org.springframework.extensions.webscripts.Status;
import org.springframework.extensions.webscripts.WebScriptException;
import org.springframework.extensions.webscripts.WebScriptRequest;

import org.alfresco.repo.web.scripts.workflow.AbstractWorkflowWebscript;
import org.alfresco.repo.web.scripts.workflow.WorkflowModelBuilder;

import org.alfresco.service.cmr.workflow.WorkflowTaskState;
import org.alfresco.service.cmr.workflow.WorkflowTaskQuery;
import org.alfresco.service.cmr.workflow.WorkflowTask;
import org.alfresco.service.namespace.QName;

import com.alvexcore.repo.AlvexContentModel;

/**
 * Patched java backed implementation for REST API to retrieve workflow instances.
 * 
 * @author Gavin Cornwell
 * @since 3.4
 */
public class WorkflowInstancesDetailedGet extends AbstractWorkflowWebscript
{
    public static final String TASK_WORKFLOW_INSTANCE_TASKS = "tasks";
	public static final String TASK_STATE = "state";
	public static final String TASK_NAME = "name";
	public static final String TASK_TITLE = "title";
	public static final String TASK_OWNER = "owner";
	public static final String TASK_OWNER_SHORT_NAME = "shortName";
	public static final String TASK_OWNER_FIRST_NAME = "firstName";
	public static final String TASK_OWNER_LAST_NAME = "lastName";
	public static final String TASK_RELATED = "relatedWorkflows";
	
    public static final String PARAM_STATE = "state";
    public static final String PARAM_INITIATOR = "initiator";
    public static final String PARAM_PRIORITY = "priority";
    public static final String PARAM_DUE_BEFORE = "dueBefore";
    public static final String PARAM_DUE_AFTER = "dueAfter";
    public static final String PARAM_STARTED_BEFORE = "startedBefore";
    public static final String PARAM_STARTED_AFTER = "startedAfter";
    public static final String PARAM_COMPLETED_BEFORE = "completedBefore";
    public static final String PARAM_COMPLETED_AFTER = "completedAfter";
    public static final String PARAM_DEFINITION_NAME = "definitionName";
    public static final String PARAM_DEFINITION_ID = "definitionId";
    public static final String VAR_DEFINITION_ID = "workflow_definition_id";
    
    public static final String PARAM_SORT_FIELD = "sortBy";
    public static final String DEFAULT_SORT_FIELD = "dueDate";
    public static final String SORT_FIELD_DUE_DATE = "DUEDATE";
    public static final String SORT_FIELD_START_DATE = "STARTDATE";
	public static final String SORT_FIELD_COMPLETE_DATE = "COMPLETEDATE";

    private WorkflowInstanceDueAscComparator workflowDueComparator = new WorkflowInstanceDueAscComparator();
    private WorkflowInstanceStartAscComparator workflowStartComparator = new WorkflowInstanceStartAscComparator();
	private WorkflowInstanceCompleteAscComparator workflowCompleteComparator = new WorkflowInstanceCompleteAscComparator();

    @Override
    protected Map<String, Object> buildModel(WorkflowModelBuilder modelBuilder, WebScriptRequest req, Status status, Cache cache)
    {
        Map<String, String> params = req.getServiceMatch().getTemplateVars();

        // state is not included into filters list as it will be taken into account before filtering
        WorkflowState state = getState(req);
        
        // if no state is provided default to ACTIVE workflows only (ALF-10851)
        if (state == null)
        {
            state = WorkflowState.ACTIVE;
        }
        
        // get field to sort by
        String sortField = getSortField(req);

        // get filter param values
        Map<String, Object> filters = new HashMap<String, Object>(9);
        filters.put(PARAM_INITIATOR, req.getParameter(PARAM_INITIATOR));
        filters.put(PARAM_PRIORITY, req.getParameter(PARAM_PRIORITY));
        filters.put(PARAM_DEFINITION_NAME, req.getParameter(PARAM_DEFINITION_NAME));
        
        String excludeParam = req.getParameter(PARAM_EXCLUDE);
        if (excludeParam != null && excludeParam.length() > 0)
        {
            filters.put(PARAM_EXCLUDE, new ExcludeFilter(excludeParam));
        }
        
        // process all the date related parameters
        processDateFilter(req, PARAM_DUE_BEFORE, filters);
        processDateFilter(req, PARAM_DUE_AFTER, filters);
        processDateFilter(req, PARAM_STARTED_BEFORE, filters);
        processDateFilter(req, PARAM_STARTED_AFTER, filters);
        processDateFilter(req, PARAM_COMPLETED_BEFORE, filters);
        processDateFilter(req, PARAM_COMPLETED_AFTER, filters);
        
        // determine if there is a definition id to filter by
        String workflowDefinitionId = params.get(VAR_DEFINITION_ID);
        if (workflowDefinitionId == null)
        {
            workflowDefinitionId = req.getParameter(PARAM_DEFINITION_ID);
        }

        List<WorkflowInstance> workflows;

        // get workflows, if definition id is null all workflows are returned
        if (state == WorkflowState.ACTIVE)
        {
            workflows = workflowService.getActiveWorkflows(workflowDefinitionId);
        }
        else
        {
            workflows = workflowService.getCompletedWorkflows(workflowDefinitionId);
        }
        
        // sort workflows by due date
        // Collections.sort(workflows, workflowComparator);

        // sort workflows
        if( SORT_FIELD_START_DATE.equals(sortField.toUpperCase()) )
        {
            Collections.sort(workflows, workflowStartComparator);
        }
		else if( SORT_FIELD_COMPLETE_DATE.equals(sortField.toUpperCase()) )
        {
            Collections.sort(workflows, workflowCompleteComparator);
        }
        else 
        {
            Collections.sort(workflows, workflowDueComparator);
        }

        // filter result
        List<Map<String, Object>> results = new ArrayList<Map<String, Object>>(workflows.size());

        int maxItems = getIntParameter(req, PARAM_MAX_ITEMS, DEFAULT_MAX_ITEMS);
        int skipCount = getIntParameter(req, PARAM_SKIP_COUNT, DEFAULT_SKIP_COUNT);
        int totalItems = workflows.size();
        if ( maxItems < 1 || maxItems > totalItems )
        {
            maxItems = totalItems;
        }
        if ( skipCount < 0 )
        {
            skipCount = 0;
        }
        int endPoint = skipCount + maxItems;
        if ( endPoint > totalItems )
        {
            endPoint = totalItems;
        }

        int pos = 0;
        for (WorkflowInstance workflow : workflows)
        {
            if (matches(workflow, filters, modelBuilder))
            {
                //results.add(modelBuilder.buildDetailed(workflow, true));
                Map<String, Object> model = modelBuilder.buildSimple(workflow);
                //Map<String, Object> model = modelBuilder.buildDetailed(workflow, false);
                
                if( pos >= skipCount && pos < endPoint )
                {
                    WorkflowTaskQuery tasksQuery = new WorkflowTaskQuery();
                    tasksQuery.setTaskState(WorkflowTaskState.IN_PROGRESS);
                    tasksQuery.setActive(Boolean.TRUE);
                    tasksQuery.setProcessId(workflow.getId());
                    List<WorkflowTask> tasks = workflowService.queryTasks(tasksQuery);

                    ArrayList<Map<String, Object>> tresults = new ArrayList<Map<String, Object>>(tasks.size());

                    for (WorkflowTask task : tasks)
                    {
                        //tresults.add(modelBuilder.buildSimple(task, null));
						Map<QName, Serializable> props = task.getProperties();
						String shortName = (String) props.get(ContentModel.PROP_OWNER);
						String related = (String) props.get(AlvexContentModel.PROP_RELATED_WORKFLOWS);
						Map<String, Object> tres = new HashMap<String, Object>();
						
						tres.put(TASK_NAME, task.getName());
						tres.put(TASK_TITLE, task.getTitle());
						tres.put(TASK_RELATED, related);
						tres.put(TASK_STATE, task.getState().toString());
						
						if( shortName != null )
						{
							Map<String, String> owner = new HashMap<String, String>();
							NodeRef person = personService.getPerson( shortName );
							String firstName = person != null ?
								(String) nodeService.getProperty(person, ContentModel.PROP_FIRSTNAME) : 
								"";
							String lastName = person != null ? 
								(String) nodeService.getProperty(person, ContentModel.PROP_LASTNAME) :
								"";
						
							owner.put(TASK_OWNER_SHORT_NAME, shortName);
							owner.put(TASK_OWNER_FIRST_NAME, firstName);
							owner.put(TASK_OWNER_LAST_NAME, lastName);
							tres.put(TASK_OWNER, owner);
						}
						else
						{
							tres.put(TASK_OWNER, null);
						}
						
						tresults.add(tres);
                    }

                    model.put(TASK_WORKFLOW_INSTANCE_TASKS, tresults);
                }

                pos++;
                results.add(model);
            }
        }

        // create and return results, paginated if necessary
        return createResultModel(req, "workflowInstances", results);
    }

    /**
     * Determine if the given workflow instance should be included in the response.
     * 
     * @param workflowInstance The workflow instance to check
     * @param filters The list of filters the task must match to be included
     * @return true if the workflow matches and should therefore be returned
     */
    private boolean matches(WorkflowInstance workflowInstance, Map<String, Object> filters, WorkflowModelBuilder modelBuilder)
    {
        // by default we assume that workflow instance should be included
        boolean result = true;

        for (String key : filters.keySet())
        {
            Object filterValue = filters.get(key);

            // skip null filters (null value means that filter was not specified)
            if (filterValue != null)
            {
                if (key.equals(PARAM_EXCLUDE))
                {
                    ExcludeFilter excludeFilter = (ExcludeFilter)filterValue;
                    String type = workflowInstance.getDefinition().getName();
                    
                    if (excludeFilter.isMatch(type))
                    {
                        result = false;
                        break;
                    }
                }
                else if (key.equals(PARAM_INITIATOR))
                {
                    NodeRef initiator = workflowInstance.getInitiator();
                    
                    if (initiator == null)
                    {
                        result = false;
                        break;
                    }
                    else
                    {
                        if (!nodeService.exists(initiator) || 
                            !filterValue.equals(nodeService.getProperty(workflowInstance.getInitiator(), ContentModel.PROP_USERNAME)))
                        {
                            result = false;
                            break;
                        }
                    }
                }
                else if (key.equals(PARAM_PRIORITY))
                {
                    String priority = "0";
                    if (workflowInstance.getPriority() != null)
                    {
                        priority = workflowInstance.getPriority().toString();
                    }

                    if (!filterValue.equals(priority))
                    {
                        result = false;
                        break;
                    }
                }
                else if (key.equals(PARAM_DEFINITION_NAME))
                {
                    String definitionName = workflowInstance.getDefinition().getName();
                    
                    if (!filterValue.equals(definitionName))
                    {
                        result = false;
                        break;
                    }
                }
                else if (key.equals(PARAM_DUE_BEFORE))
                {
                    Date dueDate = workflowInstance.getDueDate();

                    if (!isDateMatchForFilter(dueDate, filterValue, true))
                    {
                        result = false;
                        break;
                    }
                }
                else if (key.equals(PARAM_DUE_AFTER))
                {
                    Date dueDate = workflowInstance.getDueDate();

                    if (!isDateMatchForFilter(dueDate, filterValue, false))
                    {
                        result = false;
                        break;
                    }
                }
                else if (key.equals(PARAM_STARTED_BEFORE))
                {
                    Date startDate = workflowInstance.getStartDate();

                    if (!isDateMatchForFilter(startDate, filterValue, true))
                    {
                        result = false;
                        break;
                    }
                }
                else if (key.equals(PARAM_STARTED_AFTER))
                {
                    Date startDate = workflowInstance.getStartDate();

                    if (!isDateMatchForFilter(startDate, filterValue, false))
                    {
                        result = false;
                        break;
                    }
                }
                else if (key.equals(PARAM_COMPLETED_BEFORE))
                {
                    Date endDate = workflowInstance.getEndDate();

                    if (!isDateMatchForFilter(endDate, filterValue, true))
                    {
                        result = false;
                        break;
                    }
                }
                else if (key.equals(PARAM_COMPLETED_AFTER))
                {
                    Date endDate = workflowInstance.getEndDate();

                    if (!isDateMatchForFilter(endDate, filterValue, false))
                    {
                        result = false;
                        break;
                    }
                }
            }
        }

        return result;
    }
    
    /**
     * Gets the specified {@link WorkflowState}, null if not requested.
     * 
     * @param req The WebScript request
     * @return The workflow state or null if not requested
     */
    private WorkflowState getState(WebScriptRequest req)
    {
        String stateName = req.getParameter(PARAM_STATE);
        if (stateName != null)
        {
            try
            {
                return WorkflowState.valueOf(stateName.toUpperCase());
            }
            catch (IllegalArgumentException e)
            {
                String msg = "Unrecognised State parameter: " + stateName;
                throw new WebScriptException(HttpServletResponse.SC_BAD_REQUEST, msg);
            }
        }
        
        return null;
    }

    /**
     * Returns the specified sort order. If no order is specified then returns default one.
     * @param req
     * @return
     */
    private String getSortField(WebScriptRequest req)
    {
        String order = req.getParameter(PARAM_SORT_FIELD);
        if (order == null || order.length() == 0)
        {
            order = DEFAULT_SORT_FIELD;
        }
        return order;
    }

    // enum to represent workflow states
    private enum WorkflowState
    {
        ACTIVE,
        COMPLETED;
    }
    
    /**
     * Comparator to sort workflow instances by due date in ascending order.
     */
    class WorkflowInstanceDueAscComparator implements Comparator<WorkflowInstance>
    {
        @Override
        public int compare(WorkflowInstance o1, WorkflowInstance o2)
        {
            Date date1 = o1.getDueDate();
            Date date2 = o2.getDueDate();
            
            long time1 = date1 == null ? Long.MAX_VALUE : date1.getTime();
            long time2 = date2 == null ? Long.MAX_VALUE : date2.getTime();
            
            long result = time1 - time2;
            
            return (result > 0) ? 1 : (result < 0 ? -1 : startDateCompare(o1, o2));
        }
        
        private int startDateCompare(WorkflowInstance o1, WorkflowInstance o2)
        {
            Date date1 = o1.getStartDate();
            Date date2 = o2.getStartDate();
            
            long time1 = date1 == null ? Long.MAX_VALUE : date1.getTime();
            long time2 = date2 == null ? Long.MAX_VALUE : date2.getTime();
            
            long result = time1 - time2;
            
            return (result > 0) ? 1 : (result < 0 ? -1 : 0);
        }
        
    }

    /**
     * Comparator to sort workflow instances by start date in ascending order.
     */
    class WorkflowInstanceStartAscComparator implements Comparator<WorkflowInstance>
    {
        @Override
        public int compare(WorkflowInstance o1, WorkflowInstance o2)
        {
            Date date1 = o1.getStartDate();
            Date date2 = o2.getStartDate();
            
            long time1 = date1 == null ? Long.MAX_VALUE : date1.getTime();
            long time2 = date2 == null ? Long.MAX_VALUE : date2.getTime();
            
            long result = time1 - time2;
            
            return (result > 0) ? 1 : (result < 0 ? -1 : 0);
        }
        
    }

    /**
     * Comparator to sort workflow instances by complete date in ascending order.
     */
    class WorkflowInstanceCompleteAscComparator implements Comparator<WorkflowInstance>
    {
        @Override
        public int compare(WorkflowInstance o1, WorkflowInstance o2)
        {
            Date date1 = o1.getEndDate();
            Date date2 = o2.getEndDate();
            
            long time1 = date1 == null ? Long.MAX_VALUE : date1.getTime();
            long time2 = date2 == null ? Long.MAX_VALUE : date2.getTime();
            
            long result = time1 - time2;
            
            return (result > 0) ? 1 : (result < 0 ? -1 : startDateCompare(o1, o2));
        }
        
        private int startDateCompare(WorkflowInstance o1, WorkflowInstance o2)
        {
            Date date1 = o1.getStartDate();
            Date date2 = o2.getStartDate();
            
            long time1 = date1 == null ? Long.MAX_VALUE : date1.getTime();
            long time2 = date2 == null ? Long.MAX_VALUE : date2.getTime();
            
            long result = time1 - time2;
            
            return (result > 0) ? 1 : (result < 0 ? -1 : 0);
        }
        
    }
	
}
