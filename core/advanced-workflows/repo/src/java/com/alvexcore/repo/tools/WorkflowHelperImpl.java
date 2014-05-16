package com.alvexcore.repo.tools;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.io.Serializable;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Iterator;

import org.alfresco.model.ContentModel;
import org.alfresco.repo.workflow.WorkflowModel;
import org.alfresco.repo.workflow.activiti.ActivitiConstants;
import org.alfresco.service.cmr.repository.NodeRef;
import org.alfresco.service.ServiceRegistry;
import org.alfresco.service.cmr.workflow.WorkflowService;
import org.alfresco.service.cmr.workflow.WorkflowInstance;
import org.alfresco.service.cmr.workflow.WorkflowTask;
import org.alfresco.service.cmr.workflow.WorkflowTaskQuery;
import org.alfresco.service.namespace.QName;
import org.alfresco.service.cmr.security.PersonService;
import org.alfresco.service.cmr.security.AuthorityService;
import com.alvexcore.repo.orgchart.OrgchartPerson;
import com.alvexcore.repo.orgchart.OrgchartService;
import com.alvexcore.repo.orgchart.OrgchartUnit;

import org.springframework.beans.factory.InitializingBean;
import org.springframework.beans.factory.annotation.Required;

public class WorkflowHelperImpl implements WorkflowHelper, InitializingBean {

	private ServiceRegistry serviceRegistry;
	private WorkflowService workflowService;
	private OrgchartService orgchartService;
	private PersonService personService;
	private AuthorityService authorityService;

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
	
	public boolean isInitiatorOrAssigneeOrManager(WorkflowTask wt, String userName)
	{
		if (wt == null) {
			return true;
		}

		NodeRef person = personService.getPerson(userName);
		Map<QName, Serializable> props = wt.getProperties();

		String ownerName = (String) props.get(ContentModel.PROP_OWNER);
		if (userName != null && userName.equalsIgnoreCase(ownerName)) {
			return true;
		}
		
		List<NodeRef> accessUseres = new ArrayList<NodeRef>();
		accessUseres.add(getUserGroupRef(props.get(WorkflowModel.ASSOC_ASSIGNEE)));
		accessUseres.add(getUserGroupRef(props.get(WorkflowModel.ASSOC_GROUP_ASSIGNEE)));
		accessUseres.addAll(getUserGroupRefs(props.get(WorkflowModel.ASSOC_GROUP_ASSIGNEES)));
		accessUseres.addAll(getUserGroupRefs(props.get(WorkflowModel.ASSOC_ASSIGNEES)));
		accessUseres.addAll(getUserGroupRefs(wt.getProperties().get(WorkflowModel.ASSOC_POOLED_ACTORS)));
		accessUseres.add(wt.getPath().getInstance().getInitiator());

		if (accessUseres.contains(person)) {
			return true;
		}

		Set<String> userGroups = authorityService.getAuthoritiesForUser(userName);
		for (String groupName : userGroups) {
			NodeRef groupRef = authorityService.getAuthorityNodeRef(groupName);
			if (groupRef != null && accessUseres.contains(groupRef)) {
				return true;
			}
		}
		
		// Orgchart related operations
		if(userName != null)
		{
			OrgchartPerson oUser = orgchartService.getPerson(userName);
			List<OrgchartUnit> units = orgchartService.getSupervisioningUnitsForPerson(oUser);
			for (OrgchartUnit unit: units)
			{
				List<OrgchartPerson> managees = orgchartService.getUnitMembers(unit);
				for (OrgchartPerson managee : managees)
				{
					if(managee.getName().equalsIgnoreCase(ownerName))
						return true;
					NodeRef manageeRef = managee.getNode();
					if(accessUseres.contains(manageeRef))
						return true;
				}
			}
		}

		return false;
	}

	public boolean isStartTaskOfProcessInvolvedIn(WorkflowTask wt, String userName)
	{
		return wt.getId().contains(ActivitiConstants.START_TASK_PREFIX) 
				&& isUserPartOfProcess(wt.getPath().getInstance().getId(), userName);
	}
	
	public boolean isStartTaskOfProcessInvolvedIn(WorkflowTask wt, List<WorkflowTask> allWorkflowTasks, String userName)
	{
		return wt.getId().contains(ActivitiConstants.START_TASK_PREFIX) 
				&& isUserPartOfProcess(allWorkflowTasks, userName);
	}

	public boolean fromSameParallelReviewWorkflow(WorkflowTask wt, String userName)
	{
		// check whether this is parallel review workflow, "parallel" will match all jbpm and activity parallel workflows
		if (wt.getPath().getInstance().getDefinition().getName().toLowerCase().contains("parallel")) {
			WorkflowTaskQuery tasksQuery = new WorkflowTaskQuery();
			tasksQuery.setTaskState(null);
			tasksQuery.setActive(null);
			tasksQuery.setProcessId(wt.getPath().getInstance().getId());
			List<WorkflowTask> allWorkflowTasks = workflowService.queryTasks(tasksQuery, true);

			for (WorkflowTask task : allWorkflowTasks) {
				if (isInitiatorOrAssigneeOrManager(task, userName)) {
					// if at list one match then user has task from the same workflow
					return true;
				}
			}
		}
		return false;
	}

	public boolean isUserPartOfProcess(WorkflowTask wt, String userName)
	{
		return isUserPartOfProcess(wt.getPath().getInstance().getId(), userName);
	}
	
	public boolean isUserPartOfProcess(String workflowId, String userName)
	{
		WorkflowTaskQuery tasksQuery = new WorkflowTaskQuery();
		tasksQuery.setTaskState(null);
		tasksQuery.setActive(null);
		tasksQuery.setProcessId(workflowId);
		List<WorkflowTask> allWorkflowTasks = workflowService.queryTasks(tasksQuery, true);
		
		return isUserPartOfProcess(allWorkflowTasks, userName);
	}
	
	public boolean isUserPartOfProcess(List<WorkflowTask> allWorkflowTasks, String userName)
	{
		for (WorkflowTask task : allWorkflowTasks) {
			if (isInitiatorOrAssigneeOrManager(task, userName)) {
				// if at list one match then user has task from the same workflow
				return true;
			}
		}
		return false;
	}

	private NodeRef getUserGroupRef(Object o)
	{
		NodeRef result = null;
		if (o == null || o instanceof NodeRef) {
			result = (NodeRef) o;
		} else {
			try {
				result = personService.getPerson(o.toString());
			} catch (Exception e) {
				try {
					result = authorityService.getAuthorityNodeRef(o.toString());
				} catch (Exception e1) {
					// do nothing
				}
			}

		}

		return result;
	}

	private Collection<NodeRef> getUserGroupRefs(Object o)
	{
		List<NodeRef> result = new ArrayList<NodeRef>();
		if (o != null && o instanceof Collection) {
			for (Iterator<?> it = ((Collection<?>) o).iterator(); it.hasNext();) {
				result.add(getUserGroupRef(it.next()));

			}
		}

		return result;
	}
	
	public void setOrgchartService(OrgchartService orgchartService)
	{
		this.orgchartService = orgchartService;
	}
	
	public void setPersonService(PersonService personService)
	{
		this.personService = personService;
	}

	public void setAuthorityService(AuthorityService authorityService)
	{
		this.authorityService = authorityService;
	}
	
}