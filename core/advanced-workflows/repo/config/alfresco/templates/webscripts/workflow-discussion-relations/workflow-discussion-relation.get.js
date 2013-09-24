var getNodes = function(folder)
{
	var nodes = [];
	if( !folder || folder === null )
		return nodes;
	
	for each(var node in folder.children)
		if( node.properties['alvexcm:relationType'] === 'workflow-discussion' )
			nodes.push(node);
	for each(var nodeGroup in folder.assocs)
	{
		for each(var node in nodeGroup )
			if( node.properties['alvexcm:relationType'] === 'workflow-discussion' )
				nodes.push(node);
	}
	return nodes;
};

(function() {
	// Request parameters
	var workflowId = decodeURIComponent(url.templateArgs['workflowId']).split('$').join('$');
	var discussionId = decodeURIComponent(url.templateArgs['discussionId']);
	model.nodes = [];
	var nodes = [];
	
	try {
		// Get relations
		if( discussionId && discussionId !== null && discussionId !== 'null' )
		{
			var store = companyhome.childrenByXPath('/sys:system/sys:alvex/alvex:data/alvex:advanced-workflows')[0];
			var discussionFolder = store.childByNamePath(discussionId);
			nodes = getNodes(discussionFolder);
		}
		else if( workflowId && workflowId !== null && workflowId !== 'null' )
		{
			var store = companyhome.childrenByXPath('/sys:system/sys:alvex/alvex:data/alvex:advanced-workflows')[0];
			var workflowFolder = store.childByNamePath(workflowId);
			nodes = getNodes(workflowFolder);
		}
		// Process relations
		for each( var node in nodes )
		{
			var idParts = node.properties["alvexcm:relatedObject"].split('#');
			var discussion = search.findNode(idParts[0] + "://" + idParts[1] + "/" + idParts[2]);
			var workflowInstance = workflow.getInstance(node.properties["alvexcm:workflowInstance"]);
			model.nodes.push(
					{
						"discussion": {
							"nodeRef": discussion.nodeRef.toString()
						},
						"workflowInstance": {
							"id": workflowInstance.id,
							"description": workflowInstance.description
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