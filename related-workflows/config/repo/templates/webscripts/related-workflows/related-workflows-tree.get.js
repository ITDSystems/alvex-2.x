// extracts task info
function getRelatedWorkflows(taskId, prop, acc)
{
	var task = workflow.getTask(taskId);
	var relatedWorkflows = task.properties[prop];
	if (relatedWorkflows == null)
		relatedWorkflows = "";		
	for each(id in relatedWorkflows.split(','))
		if (id != ''){
			var is_active = String(workflow.getInstance(id).isActive());
			var desc = String(workflow.getInstance(id).getDescription());
	
			var start_date = workflow.getInstance(id).getStartDate();
			var start_date_string = null;
			if(start_date != null) {
				var s_year    = start_date.getUTCFullYear();
				var s_month   = start_date.getUTCMonth();
				var s_day     = start_date.getUTCDate();
				var s_hours   = start_date.getUTCHours();
				var s_minutes = start_date.getUTCMinutes();
				start_date_string = s_year + "-" + s_month + "-" + s_day + "-" + s_hours + "-" + s_minutes;
			}
			start_date_string = String(start_date_string);
	
			var end_date = workflow.getInstance(id).getEndDate();
			var end_date_string = null;
			if(end_date != null) {
				var e_year    = end_date.getUTCFullYear();
				var e_month   = end_date.getUTCMonth();
				var e_day     = end_date.getUTCDate();
				var e_hours   = end_date.getUTCHours();
				var e_minutes = end_date.getUTCMinutes();
				end_date_string = e_year + "-" + e_month + "-" + e_day + "-" + e_hours + "-" + e_minutes;
			}
			end_date_string = String(end_date_string);
			
			var workflowInfo = {"id": id,
	                        "active": is_active,
	                        "description": desc,
	                        "start_date": start_date_string,
	                        "end_date": end_date_string,
	                        "relatedWorkflows": []};
			var currentSubTaskId = memoService.getValue('workflows.'+id+'.tasks.current')
			if (currentSubTaskId != null)
				getRelatedWorkflows(currentSubTaskId, prop, workflowInfo.relatedWorkflows);
			acc.push(workflowInfo);
		}	
}

// get task by id
try {
	model.data = {"id": url.templateArgs['taskId'], "name": "name", workflows: []};
	getRelatedWorkflows(url.templateArgs['taskId'], args['propName'].replace('prop_', '').replace('_', ':'), model.data.workflows);
	model.code = 200;			
} catch (ex) {
	model.code = 500;
	model.message = ex.message;
}
