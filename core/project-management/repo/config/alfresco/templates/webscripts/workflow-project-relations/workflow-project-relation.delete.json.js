(function() {
	var projectId = decodeURIComponent(url.templateArgs['projectId']);
	var workflowId = decodeURIComponent(url.templateArgs['workflowId']);
	try {
		if( projectId && workflowId )
		{
			var f = function()
			{
				var store = companyhome.childrenByXPath('/sys:system/sys:alvex/alvex:data/alvex:project-management')[0];
				var projectFolder = store.childByNamePath(projectId);
				if( projectFolder && projectFolder !== null )
					for each(var node in projectFolder.children)
						if( node.properties['alvexcm:relationType'] === 'project-workflows' 
								&& node.properties['alvexcm:workflowInstance'] === workflowId )
							node.remove();
				var workflowFolder = store.childByNamePath(workflowId);
				if( workflowFolder && workflowFolder !== null )
					for each(var node in workflowFolder.children)
						if( node.properties['alvexcm:relationType'] === 'workflow-deadline-event-' + projectId )
						{
							var parts = node.properties['alvexcm:relatedObject'].split('#');
							var eventNode = search.findNode(parts[0] + "://" + parts[1] + "/" + parts[2]);
							eventNode.remove();
							node.remove();
						}
			};
			sudoUtils.sudo(f);
		}
		status.code = 200;
	} catch (e) {
		status.code = 500;
		status.message = e.message;
		model.message = e.message;
	}
})();