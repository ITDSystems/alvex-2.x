package com.alvexcore.repo.tools;

import java.util.List;
import org.alfresco.service.ServiceRegistry;
import org.alfresco.service.cmr.workflow.WorkflowService;

import org.alfresco.service.cmr.repository.NodeRef;
import org.alfresco.service.cmr.workflow.WorkflowInstance;
import org.alfresco.service.cmr.workflow.WorkflowTask;

public interface WorkflowHelper {

	public abstract String getWorkflowIdByTaskId(String taskId);

	public abstract List<WorkflowInstance> getCompletedWorkflowInstances(String defId);

	public abstract List<WorkflowInstance> getActiveWorkflowsForNode(NodeRef nodeRef);

	public abstract List<WorkflowInstance> getCompletedWorkflowsForNode(NodeRef nodeRef);
	
	public abstract boolean isInitiatorOrAssigneeOrManager(WorkflowTask wt, String userName);
	
	public abstract boolean isStartTaskOfProcessInvolvedIn(WorkflowTask wt, String userName);
	
	public abstract boolean isStartTaskOfProcessInvolvedIn(WorkflowTask wt, List<WorkflowTask> allWorkflowTasks, String userName);
	
	public abstract boolean fromSameParallelReviewWorkflow(WorkflowTask wt, String userName);
	
	public abstract boolean isUserPartOfProcess(String workflowId, String userName);
	
	public abstract boolean isUserPartOfProcess(WorkflowTask wt, String userName);
	
	public abstract boolean isUserPartOfProcess(List<WorkflowTask> allWorkflowTasks, String userName);

	public ServiceRegistry getServiceRegistry();

	public WorkflowService getWorkflowService();
	
}