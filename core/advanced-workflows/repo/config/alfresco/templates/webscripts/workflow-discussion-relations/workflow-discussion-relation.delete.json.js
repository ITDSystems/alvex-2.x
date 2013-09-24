(function() {
	var discussionId = decodeURIComponent(url.templateArgs['discussionId']);
	var workflowId = decodeURIComponent(url.templateArgs['workflowId']);
	try {
		if( discussionId && workflowId )
		{
			var store = companyhome.childrenByXPath('/sys:system/sys:alvex/alvex:data/alvex:advanced-workflows')[0];
			var workflowFolder = store.childByNamePath(workflowId);
			if( workflowFolder && workflowFolder !== null )
				for each(var node in workflowFolder.children)
					if( node.properties['alvexcm:relationType'] === 'workflow-discussion' 
							&& node.properties['alvexcm:relatedObject'] === discussionId )
						node.remove();
		}
		status.code = 200;
	} catch (e) {
		status.code = 500;
		status.message = e.message;
		model.message = e.message;
	}
})();