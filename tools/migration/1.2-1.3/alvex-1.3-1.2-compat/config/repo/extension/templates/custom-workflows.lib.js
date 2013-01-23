function default_task_callback(ev)
{
	var processName = task.processDefinitionId.match(/(\w*):.*/)[1];
	var taskName = task.name;
	var assignee = task.assignee;

	if (processName == 'activitiBasicWorkflow')
		if (ev == 'assignment')
			for each(document in bpm_package.children)
			{
				document.setPermission(
					'Coordinator',
					assignee
				);
				document.save();
			}

}

function task_callback_wrapper(ev)
{
	var nodes = companyhome.childrenByXPath('app:dictionary/app:scripts/app:custom_workflows/app:callbacks');
	if (nodes.length == 1)
	{
		var node = nodes[0];
		// tricky, but works :)
		this.eval(String(node.content));
		task_callback(ev);
	}
	else
		default_task_callback(ev);
}
