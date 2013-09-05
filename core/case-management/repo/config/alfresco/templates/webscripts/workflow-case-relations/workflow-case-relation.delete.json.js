(function() {
	var caseId = decodeURIComponent(url.templateArgs['caseId']);
	var workflowId = decodeURIComponent(url.templateArgs['workflowId']);
	try {
		if( caseId && workflowId )
		{
			/*var nodes = search.luceneSearch(
					'+PATH:"/sys:system/sys:alvex/alvex:data/alvex:case-management//." ' 
					+ '+TYPE: "alvexcm:workflowRelation" ' 
					+ '+@alvexcm\\:relationType: "case" ' 
					+ '+@alvexcm\\:workflowInstance: "' + workflowId + '" '
					+ '+@alvexcm\\:relatedObject: "' + caseId + '" ');
			for each (var node in nodes)
				node.remove();*/
			var store = companyhome.childrenByXPath('/sys:system/sys:alvex/alvex:data/alvex:case-management')[0];
			for each(var node in store.children)
			{
				var name = node.name.split('$').join('$');
				if(name === caseId+'-'+workflowId)
					node.remove();
            }
		}
		status.code = 200;
	} catch (e) {
		status.code = 500;
		status.message = e.message;
		model.message = e.message;
	}
})();