<import resource="classpath:alfresco/site-webscripts/org/alfresco/components/workflow/workflow.lib.js">

var Utils = {

	getAllowedWorkflows: function ()
	{
		var workflowDefinitions = getWorkflowDefinitions();

		var allowedWorkflows = [];

		connector = remote.connect('alfresco');
		var workflows = eval('('+connector.get('/api/alvex/workflow-shortcut/allowed-workflows')+')');

		var wfl_list = [];

		for(w in workflows.workflows) {
			var found = false;
			for(l in wfl_list)
				if(wfl_list[l].name == workflows.workflows[w].name)
					found = true;
			if(!found)
				wfl_list.push(workflows.workflows[w]);
		}
		
		for(w in wfl_list) {
			for(wd in workflowDefinitions) {
				if(wfl_list[w].name == workflowDefinitions[wd].name) {
					allowedWorkflows.push({	"name": wfl_list[w].name,
								"title": workflowDefinitions[wd].title,
								"description": workflowDefinitions[wd].description });
				}
			}
		}
		
		return allowedWorkflows;
	}

};