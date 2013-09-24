(function() {
	var srcWfId = decodeURIComponent(url.templateArgs['srcWfId']);
	var targetWfId = decodeURIComponent(url.templateArgs['targetWfId']);
	try {
		if( srcWfId && targetWfId )
		{
			var store = companyhome.childrenByXPath('/sys:system/sys:alvex/alvex:data/alvex:advanced-workflows')[0];
			var workflowFolder = store.childByNamePath(srcWfId);
			if( workflowFolder && workflowFolder !== null )
				for each(var node in workflowFolder.children)
					if( node.properties['alvexcm:relationType'] === 'related-workflow' 
							&& node.properties['alvexcm:relatedObject'] === targetWfId )
						node.remove();
		}
		status.code = 200;
	} catch (e) {
		status.code = 500;
		status.message = e.message;
		model.message = e.message;
	}
})();