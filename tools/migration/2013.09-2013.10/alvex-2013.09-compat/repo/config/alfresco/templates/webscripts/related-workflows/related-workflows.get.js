try {
	var task = workflow.getTask(args['taskId']);
	var prop = args['propName'].replace('prop_', '').replace('_', ':');
	relatedWorkflows = task.getProperties()[prop];
	if (relatedWorkflows == undefined)
		relatedWorkflows = "";
	model.workflows = [];
	for each(id in relatedWorkflows.split(','))
		if (id != ''){
			var inst = workflow.getInstance(id);
			var workflowStatus = '';
			if (!inst)
				continue;

			workflowStatus = inst.isActive() ? 'in-progress' : 'complete';
			
			var assignees = [];
			for each (var path in inst.paths)
				for each (var taskInst in path.tasks)
				{
					var owner = taskInst.properties['cm:owner'];
					if (owner)
					{
						var person = people.getPerson(owner);
						if (person)
						{
							assignees.push({
								firstName: person.properties['cm:firstName'],
								lastName: person.properties['cm:lastName'],
								userName: owner
							});
						}
					}
				}

			var desc = String(inst.getDescription());
			var start_date = inst.getStartDate();
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

			var end_date = inst.getEndDate();
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

			var due_date = null;
			for each (var path in inst.paths)
				for each (var taskInst in path.tasks)
					if( taskInst.properties['bpm:dueDate'] != null )
						due_date = new Date( taskInst.properties['bpm:dueDate'].getTime() );

			var due_date_string = '';
			if(due_date != null) {
				var s_year    = due_date.getUTCFullYear();
				var s_month   = due_date.getUTCMonth();
				var s_day     = due_date.getUTCDate();
				var s_hours   = due_date.getUTCHours();
				var s_minutes = due_date.getUTCMinutes();
				due_date_string = s_year + "-" + s_month + "-" + s_day + "-" + s_hours + "-" + s_minutes;
			}
			due_date_string = String(due_date_string);

			model.workflows.push({
				'id': id,
				'status': workflowStatus,
				'active': String(workflowStatus != 'complete'),
				'description': desc,
				'start_date': start_date_string, 
				'end_date': end_date_string,
				'due_date': due_date_string,
				'assignees': assignees
			});
		}
		model.workflows.sort(
				function(a,b)
				{
					return a.active < b.active
					|| a.active == b.active && a.start_date > b.start_date;
				});
	status.code = 200;			
} catch (ex) {
	status.code = 500;
	status.message = ex.message;
	model.message = ex.message;
}
