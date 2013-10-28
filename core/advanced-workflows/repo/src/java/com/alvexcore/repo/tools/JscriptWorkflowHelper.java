package com.alvexcore.repo.tools;

import java.util.Date;
import java.util.List;
import java.util.ArrayList;
import java.io.Serializable;
import java.util.HashMap;
import java.util.Map;
import java.util.TimeZone;
import java.text.DateFormat;
import java.text.SimpleDateFormat;

import org.mozilla.javascript.Scriptable;

import org.alfresco.service.cmr.workflow.WorkflowInstance;
import org.alfresco.repo.jscript.BaseScopableProcessorExtension;
import org.springframework.beans.factory.annotation.Required;
import org.alfresco.service.ServiceRegistry;
import org.alfresco.repo.jscript.ScriptNode;
import org.alfresco.repo.jscript.ValueConverter;

import org.alfresco.service.cmr.workflow.WorkflowTaskState;
import org.alfresco.service.cmr.workflow.WorkflowTaskQuery;
import org.alfresco.service.cmr.workflow.WorkflowTask;
import org.alfresco.service.namespace.QName;
import org.alfresco.model.ContentModel;
import org.alfresco.service.namespace.NamespaceService;

public class JscriptWorkflowHelper extends BaseScopableProcessorExtension {

	/** Node Value Converter */
	private ValueConverter converter = null;

	private WorkflowHelper workflowHelper;
	private ServiceRegistry serviceRegistry;

	/**
	 * Sets template service
	 * @param workflowHelper
	 */
	@Required
	public void setWorkflowHelper(WorkflowHelper workflowHelper) {
		this.workflowHelper = workflowHelper;
		this.serviceRegistry = workflowHelper.getServiceRegistry();
	}

	public synchronized Scriptable getWorkflowInstance(String id)
	{
		// FIXME
		WorkflowInstance wi = workflowHelper.getWorkflowService().getWorkflowById(id);
		
		List<WorkflowInstance> cmrWorkflowInstances = new ArrayList<WorkflowInstance>();
		cmrWorkflowInstances.add(wi);
		return formatWorkflowList(cmrWorkflowInstances, true);
		
		//HashMap<String, Object> res = formatWorkflow(wi, false);
		//Scriptable activeInstancesScriptable =
		//	(Scriptable)getValueConverter().convertValueForScript(this.serviceRegistry, scope, null, res);
		//return activeInstancesScriptable;
	}
	
	public String getWorkflowIdByTaskId(String taskId) throws Exception {
		return workflowHelper.getWorkflowIdByTaskId( taskId );
	}

	/**
	 * Get completed workflow instances for definition id
	 * 
	 * @param id
	 * @return completed workflow instances spawned from given definition id
	 */
	public synchronized Scriptable getCompletedWorkflowInstances(String defId)
	{
		List<WorkflowInstance> cmrWorkflowInstances = workflowHelper.getCompletedWorkflowInstances(defId);
		return formatWorkflowList(cmrWorkflowInstances, true);
	}

	public synchronized Scriptable getActiveWorkflowsForNode(ScriptNode node)
	{
		List<WorkflowInstance> cmrWorkflowInstances = workflowHelper.getActiveWorkflowsForNode(node.getNodeRef());
		return formatWorkflowList(cmrWorkflowInstances, true);
	}
	
	public synchronized Scriptable getCompletedWorkflowsForNode(ScriptNode node)
	{
		List<WorkflowInstance> cmrWorkflowInstances = workflowHelper.getCompletedWorkflowsForNode(node.getNodeRef());
		return formatWorkflowList(cmrWorkflowInstances, true);
	}
	
	protected Scriptable formatWorkflowList(List<WorkflowInstance> cmrWorkflowInstances, boolean includeTasks)
	{
		ArrayList<Serializable> activeInstances = new ArrayList<Serializable>();
		for (WorkflowInstance cmrWorkflowInstance : cmrWorkflowInstances)
		{
			HashMap<String, Object> res = formatWorkflow(cmrWorkflowInstance, includeTasks);
			activeInstances.add(res);
		}
		
		Scriptable activeInstancesScriptable =
			(Scriptable)getValueConverter().convertValueForScript(this.serviceRegistry, getScope(), null, activeInstances);
		
		return activeInstancesScriptable;
	}

	protected HashMap<String, Object> formatWorkflow(WorkflowInstance cmrWorkflowInstance, boolean includeTasks)
	{
		QName PROP_OUTCOME = QName.createQName(NamespaceService.BPM_MODEL_1_0_URI, "outcome");
		QName PROP_COMMENT = QName.createQName(NamespaceService.BPM_MODEL_1_0_URI, "comment");
		QName PROP_COMPLETION_DATE = QName.createQName(NamespaceService.BPM_MODEL_1_0_URI, "completionDate");
		
		HashMap<String, Object> res = new HashMap<String, Object>();
		res.put("id", cmrWorkflowInstance.getId());
		res.put("description", cmrWorkflowInstance.getDescription());
		res.put("type", cmrWorkflowInstance.getDefinition().getId());
		res.put("dueDate", cmrWorkflowInstance.getDueDate());
			
		if( includeTasks )
		{
			WorkflowTaskQuery tasksQuery = new WorkflowTaskQuery();
			tasksQuery.setTaskState(WorkflowTaskState.COMPLETED);
			tasksQuery.setActive(null);
			tasksQuery.setProcessId(cmrWorkflowInstance.getId());
			List<WorkflowTask> tasks = workflowHelper.getWorkflowService().queryTasks(tasksQuery);
			ArrayList<Map<String, String>> tresults = new ArrayList<Map<String, String>>(tasks.size());

			for (WorkflowTask task : tasks)
			{
				Map<QName, Serializable> taskProps = task.getProperties();
				Map<String, String> props = new HashMap<String, String>();
				String outcome = (String) taskProps.get(PROP_OUTCOME);
				if( "Approve".equals(outcome) || "Reject".equals(outcome) 
						|| "Next".equals(outcome) || "Resubmit".equals(outcome) )
				{
					props.put("owner", (String) taskProps.get(ContentModel.PROP_OWNER));
					props.put("outcome", (String) taskProps.get(PROP_OUTCOME));
					props.put("comment", (String) taskProps.get(PROP_COMMENT));
					Date compl = (Date) taskProps.get(PROP_COMPLETION_DATE);
					TimeZone tz = TimeZone.getTimeZone("UTC");
					DateFormat df = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'");
					df.setTimeZone(tz);
					props.put("date", df.format(compl));
					tresults.add(props);
				}
			}
			
			res.put("tasks", tresults);
		}
		
		return res;
	}
	
	/**
	* Gets the value converter
	* 
	* @return the value converter
	*/
	protected ValueConverter getValueConverter()
	{
		if (converter == null)
		{
			converter = new ValueConverter();
		}
		return converter;
	}
}
