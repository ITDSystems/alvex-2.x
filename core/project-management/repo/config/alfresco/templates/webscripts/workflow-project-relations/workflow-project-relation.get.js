var getNodes = function(folder)
{
	var nodes = [];
	if( !folder || folder === null )
		return nodes;
	
	for each(var node in folder.children)
		if( ( node.properties['alvexcm:relationType'] === 'project-workflows' )
					|| ( node.properties['alvexcm:relationType'] === 'case-workflows' ) )
			nodes.push(node);
	for each(var nodeGroup in folder.assocs)
	{
		for each(var node in nodeGroup )
			if( ( node.properties['alvexcm:relationType'] === 'project-workflows' )
					|| ( node.properties['alvexcm:relationType'] === 'case-workflows' ) )
				nodes.push(node);
	}
	return nodes;
};

(function() {
	// Request parameters
	var workflowId = decodeURIComponent(url.templateArgs['workflowId']).split('$').join('$');
	var projectId = decodeURIComponent(url.templateArgs['projectId']);
	model.nodes = [];
	var nodes = [];
	var legacyNodes = [];
	
	try {
		// Get relations
		if( projectId && projectId !== null && projectId !== 'null' )
		{
			var store = companyhome.childrenByXPath('/sys:system/sys:alvex/alvex:data/alvex:project-management')[0];
			var projectFolder = store.childByNamePath(projectId);
			nodes = getNodes(projectFolder);
			// Proceed legacy nodes - migration from 2013.09 release when project-management was case-management
			var legacyStore = companyhome.childrenByXPath('/sys:system/sys:alvex/alvex:data/alvex:case-management')[0];
			if( legacyStore && legacyStore !== null )
			{
				var legacyProjectFolder = legacyStore.childByNamePath(projectId);
				legacyNodes = getNodes(legacyProjectFolder);
				for each(var ln in legacyNodes)
					nodes.push(ln);
			}
		}
		else if( workflowId && workflowId !== null && workflowId !== 'null' )
		{
			var store = companyhome.childrenByXPath('/sys:system/sys:alvex/alvex:data/alvex:project-management')[0];
			var workflowFolder = store.childByNamePath(workflowId);
			nodes = getNodes(workflowFolder);
			// Proceed legacy nodes - migration from 2013.09 release when project-management was case-management
			var legacyStore = companyhome.childrenByXPath('/sys:system/sys:alvex/alvex:data/alvex:case-management')[0];
			if( legacyStore && legacyStore !== null )
			{
				var legacyProjectFolder = legacyStore.childByNamePath(workflowId);
				legacyNodes = getNodes(legacyProjectFolder);
				for each(var ln in legacyNodes)
					nodes.push(ln);
			}
		}
		// Process relations
		for each( var node in nodes )
		{
			var projectSite = siteService.getSite(node.properties["alvexcm:relatedObject"]);
			var workflowInstance = workflow.getInstance(node.properties["alvexcm:workflowInstance"]);
			if( projectSite && workflowInstance)
			{
				model.nodes.push(
					{
						"projectSite": {
							"shortName": projectSite.shortName,
							"title": projectSite.title,
							"description": projectSite.description
						},
						"workflowInstance": {
							"id": workflowInstance.id,
							"description": workflowInstance.description
						}
					});
			}
		}
		
		status.code = 200;
	} catch (e) {
		status.code = 500;
		status.message = e.message;
		model.message = e.message;
	}
})();