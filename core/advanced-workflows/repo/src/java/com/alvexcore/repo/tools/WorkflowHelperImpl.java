package com.alvexcore.repo.tools;

import java.util.List;

import org.alfresco.service.cmr.repository.NodeRef;
import org.alfresco.service.ServiceRegistry;
import org.alfresco.service.cmr.workflow.WorkflowService;
import org.alfresco.service.cmr.workflow.WorkflowInstance;

import org.springframework.beans.factory.InitializingBean;
import org.springframework.beans.factory.annotation.Required;

public class WorkflowHelperImpl implements WorkflowHelper, InitializingBean {

	private ServiceRegistry serviceRegistry;
	private WorkflowService workflowService;

	/*
	 * Setters and getters 
	 */

	@Override
	public ServiceRegistry getServiceRegistry() {
		return serviceRegistry;
	}

	@Override
	public WorkflowService getWorkflowService() {
		return workflowService;
	}

	@Required
	public void setServiceRegistry(ServiceRegistry serviceRegistry) {
		this.serviceRegistry = serviceRegistry;
	}

	/*
	 * Startup functions
	 */
	@Override
	public void afterPropertiesSet() throws Exception {
		workflowService = serviceRegistry.getWorkflowService();
	}

	/*
	* Real functions
	*/
	@Override
	public String getWorkflowIdByTaskId(String taskId)
	{
		return workflowService.getTaskById( taskId ).getPath().getInstance().getId();
	}

	/**
	 * Get completed workflow instances for definition id
	 * 
	 * @param id
	 * @return completed workflow instances spawned from given definition id
	 */
	@Override
	public List<WorkflowInstance> getCompletedWorkflowInstances(String defId)
	{
		List<WorkflowInstance> cmrWorkflowInstances = workflowService.getCompletedWorkflows(defId);
		return cmrWorkflowInstances;
	}

	/**
	 * Get active workflow instances for node ref
	 * 
	 * @param nodeRef
	 * @return active workflow instances for node ref
	 */
	@Override
	public List<WorkflowInstance> getActiveWorkflowsForNode(NodeRef nodeRef)
	{
        // list all active workflows for nodeRef
        List<WorkflowInstance> workflows = workflowService.getWorkflowsForContent(nodeRef, true);
		return workflows;
	}

	/**
	 * Get completed workflow instances for node ref
	 * 
	 * @param nodeRef
	 * @return completed workflow instances for node ref
	 */
	@Override
	public List<WorkflowInstance> getCompletedWorkflowsForNode(NodeRef nodeRef)
	{
        // list all completed workflows for nodeRef
        List<WorkflowInstance> workflows = workflowService.getWorkflowsForContent(nodeRef, false);
		return workflows;
	}
}