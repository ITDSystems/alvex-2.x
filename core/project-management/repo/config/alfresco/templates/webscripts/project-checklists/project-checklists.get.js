(function() {
	try{
		// Request parameters
		var projectId = decodeURIComponent(url.templateArgs['projectId']);
		var site = siteService.getSite(projectId);
		var cont = site.getContainer("checklists");
		if( cont === null )
			cont = site.createContainer("checklists");
		
		model.data = [];
		
		for each( var item in cont.children )
		{
			var data = {};
			data.ref = item.nodeRef.toString();
			data.status = item.properties['alvexcm:checkListItemStatus'];
			data.summary = item.properties['alvexcm:checkListItemSummary'];
			model.data.push(data);
		}
		status.code = 200;
	} catch (e) {
		status.code = 500;
		status.message = e.message;
		model.message = e.message;
	}
})();