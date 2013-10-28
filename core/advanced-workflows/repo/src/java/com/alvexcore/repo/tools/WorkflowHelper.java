package com.alvexcore.repo.tools;

import java.util.List;
import org.alfresco.service.ServiceRegistry;
import org.alfresco.service.cmr.workflow.WorkflowService;

import org.alfresco.service.cmr.repository.NodeRef;
import org.alfresco.service.cmr.workflow.WorkflowInstance;

public interface WorkflowHelper {

	public abstract String getWorkflowIdByTaskId(String taskId);

	public abstract List<WorkflowInstance> getCompletedWorkflowInstances(String defId);

	public abstract List<WorkflowInstance> getActiveWorkflowsForNode(NodeRef nodeRef);

	public abstract List<WorkflowInstance> getCompletedWorkflowsForNode(NodeRef nodeRef);

	public ServiceRegistry getServiceRegistry();

	public WorkflowService getWorkflowService();
	
}