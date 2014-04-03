var getNodes = function(folder)
{
	var nodes = [];
	if( !folder || folder === null )
		return nodes;
	
	for each(var node in folder.children)
		if( node.properties['alvexcm:relationType'] === 'related-workflow' )
			nodes.push(node);
	for each(var nodeGroup in folder.assocs)
	{
		for each(var node in nodeGroup )
			if( node.properties['alvexcm:relationType'] === 'related-workflow' )
				nodes.push(node);
	}
	return nodes;
};

(function() {
	// Request parameters
	var workflowId = decodeURIComponent(url.templateArgs['workflowId']).split('$').join('$');
	model.nodes = [];
	var nodes = [];
	
	try {
		// Get relations
		if( workflowId && workflowId !== null && workflowId !== 'null' )
		{
			var store = companyhome.childrenByXPath('/sys:system/sys:alvex/alvex:data/alvex:advanced-workflows')[0];
			var workflowFolder = store.childByNamePath(workflowId);
			nodes = getNodes(workflowFolder);
		}
		// Process relations
		for each( var node in nodes )
		{
			var workflowInstance = workflow.getInstance(node.properties["alvexcm:workflowInstance"]);
			var relatedWorkflow = workflow.getInstance(node.properties["alvexcm:relatedObject"]);
			if( workflowInstance === null || relatedWorkflow === null )
				continue;
			
			var assignees = [];
			for each(var path in relatedWorkflow.getPaths())
			{
				if(!path.isActive())
					continue;
				for each(var task in path.getTasks())
				{
					var userName = task.getProperties()["cm:owner"];
					var user = people.getPerson(userName);
					assignees.push(user);
				}
			}
			
			model.nodes.push(
					{
						"workflowInstance": {
							"id": workflowInstance.id,
							"description": workflowInstance.description,
							"status": workflowInstance.isActive() ? 'in-progress' : 'complete',
							"startDate": workflowInstance.startDate ? utils.toISO8601(workflowInstance.startDate) : "null",
							"endDate": workflowInstance.endDate ? utils.toISO8601(workflowInstance.endDate) : "null",
							"dueDate": "null",
							"assignees": []
						},
						"relatedWorkflow": {
							"id": relatedWorkflow.id,
							"description": relatedWorkflow.description,
							"status": relatedWorkflow.isActive() ? 'in-progress' : 'complete',
							"startDate": relatedWorkflow.startDate ? utils.toISO8601(relatedWorkflow.startDate) : "null",
							"endDate": relatedWorkflow.endDate ? utils.toISO8601(relatedWorkflow.endDate) : "null",
							"dueDate": "null",
							"assignees": assignees
						}
					});
		}
		
		status.code = 200;
	} catch (e) {
		status.code = 500;
		status.message = e.message;
		model.message = e.message;
	}
})();