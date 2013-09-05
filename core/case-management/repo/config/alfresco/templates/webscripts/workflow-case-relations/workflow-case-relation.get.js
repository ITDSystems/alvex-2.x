(function() {
	// Request parameters
	var caseId = decodeURIComponent(url.templateArgs['caseId']);
	var workflowId = decodeURIComponent(url.templateArgs['workflowId']);
	var nodes = [];
	model.nodes = [];
	
	try {
		// Get relations
		if( caseId )
		{
			/*nodes = search.luceneSearch(
					'+PATH:"/sys:system/sys:alvex/alvex:data/alvex:case-management//." ' 
					+ '+TYPE: "alvexcm:workflowRelation" ' 
					+ '+@alvexcm\\:relationType: "case" ' 
					+ '+@alvexcm\\:relatedObject: "' + caseId + '" ');*/
			var store = companyhome.childrenByXPath('/sys:system/sys:alvex/alvex:data/alvex:case-management')[0];
			for each(var node in store.children)
				if(node.name.match(caseId+'-') != null)
					nodes.push(node);
		}
		else if( workflowId )
		{
			/*nodes = search.luceneSearch(
					'+PATH:"/sys:system/sys:alvex/alvex:data/alvex:case-management//." ' 
					+ '+TYPE: "alvexcm:workflowRelation" ' 
					+ '+@alvexcm\\:relationType: "case" ' 
					+ '+@alvexcm\\:workflowInstance: "' + workflowId + '" ');*/
			var store = companyhome.childrenByXPath('/sys:system/sys:alvex/alvex:data/alvex:case-management')[0];
			for each(var node in store.children)
				if(node.name.match('-'+workflowId) != null)
					nodes.push(node);
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