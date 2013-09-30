(function() {
	var caseId = decodeURIComponent(url.templateArgs['caseId']);
	var workflowId = decodeURIComponent(url.templateArgs['workflowId']);
	try {
		if( caseId && workflowId )
		{
			var f = function()
			{
				var store = companyhome.childrenByXPath('/sys:system/sys:alvex/alvex:data/alvex:case-management')[0];
				var caseFolder = store.childByNamePath(caseId);
				if( caseFolder && caseFolder !== null )
					for each(var node in caseFolder.children)
						if( node.properties['alvexcm:relationType'] === 'case-workflows' 
								&& node.properties['alvexcm:workflowInstance'] === workflowId )
							node.remove();
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