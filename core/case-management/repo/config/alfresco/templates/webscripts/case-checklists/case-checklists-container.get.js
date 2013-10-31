(function() {
	try{
		// Request parameters
		var caseId = decodeURIComponent(url.templateArgs['caseId']);
		var site = siteService.getSite(caseId);
		var cont = site.getContainer("checklists");
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