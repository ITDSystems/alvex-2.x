(function() {
	try{
		// Request parameters
		var projectId = decodeURIComponent(url.templateArgs['projectId']);
		var site = siteService.getSite(projectId);
		var cont = site.getContainer("contacts");
		if( cont === null )
			cont = site.createContainer("contacts");
		cont = site.getContainer("conversations");
		if( cont === null )
			cont = site.createContainer("conversations");
		cont = site.getContainer("checklists");
		if( cont === null )
			cont = site.createContainer("checklists");
		model.ref = cont.nodeRef.toString();
		status.code = 200;
	} catch (e) {
		status.code = 500;
		status.message = e.message;
		model.message = e.message;
	}
})();