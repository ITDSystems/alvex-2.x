var getNodes = function(folder)
{
	var nodes = [];
	if( !folder || folder === null )
		return nodes;
	
	for each(var node in folder.children)
		if( node.properties['alvexcm:relationType'] === 'case-workflows' )
			nodes.push(node);
	for each(var nodeGroup in folder.assocs)
	{
		for each(var node in nodeGroup )
			if( node.properties['alvexcm:relationType'] === 'case-workflows' )
				nodes.push(node);
	}
	return nodes;
};

(function() {
	// Request parameters
	var workflowId = decodeURIComponent(url.templateArgs['workflowId']).split('$').join('$');
	var caseId = decodeURIComponent(url.templateArgs['caseId']);
	model.nodes = [];
	var nodes = [];
	
	try {
		// Get relations
		if( caseId && caseId !== null && caseId !== 'null' )
		{
			var store = companyhome.childrenByXPath('/sys:system/sys:alvex/alvex:data/alvex:case-management')[0];
			var caseFolder = store.childByNamePath(caseId);
			nodes = getNodes(caseFolder);
		}
		else if( workflowId && workflowId !== null && workflowId !== 'null' )
		{
			var store = companyhome.childrenByXPath('/sys:system/sys:alvex/alvex:data/alvex:case-management')[0];
			var workflowFolder = store.childByNamePath(workflowId);
			nodes = getNodes(workflowFolder);
		}
		// Process relations
		for each( var node in nodes )
		{
			var caseSite = siteService.getSite(node.properties["alvexcm:relatedObject"]);
			var workflowInstance = workflow.getInstance(node.properties["alvexcm:workflowInstance"]);
			model.nodes.push(
					{
						"caseSite": {
							"shortName": caseSite.shortName,
							"title": caseSite.title,
							"description": caseSite.description
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