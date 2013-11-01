(function() {
	try{
		// Request parameters
		var projectId = decodeURIComponent(url.templateArgs['projectId']);
		var site = siteService.getSite(projectId);
		var cont = site.getContainer("contacts");
		if( cont === null )
			cont = site.createContainer("contacts");
		
		model.data = [];
		
		for each( var item in cont.children )
		{
			var data = {};
			data.ref = item.nodeRef.toString();
			data.firstName = item.properties['alvexcm:contactFirstName'];
			data.lastName = item.properties['alvexcm:contactLastName'];
			data.company = item.properties['alvexcm:contactCompany'];
			data.position = item.properties['alvexcm:contactPosition'];
			data.phone = item.properties['alvexcm:contactPhone'];
			data.email = item.properties['alvexcm:contactEmail'];
			model.data.push(data);
		}
		status.code = 200;
	} catch (e) {
		status.code = 500;
		status.message = e.message;
		model.message = e.message;
	}
})();