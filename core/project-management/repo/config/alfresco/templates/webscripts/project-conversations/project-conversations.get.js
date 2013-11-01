(function() {
	try{
		// Request parameters
		var projectId = decodeURIComponent(url.templateArgs['projectId']);
		var site = siteService.getSite(projectId);
		var cont = site.getContainer("conversations");
		if( cont === null )
			cont = site.createContainer("conversations");
		
		model.data = [];
		
		for each( var item in cont.children )
		{
			var data = {};
			data.ref = item.nodeRef.toString();
			data.type = item.properties['alvexcm:conversationType'];
			data.date = utils.toISO8601(item.properties['alvexcm:conversationDate']);
			data.summary = item.properties['alvexcm:conversationSummary'];
			data.details = item.properties['alvexcm:conversationDetails'];
			data.people = [];
			data.files = [];
			for each( var p in item.assocs['alvexcm:conversationParticipants'] )
			{
				data.people.push( { 
					"name": p.properties.firstName + ' ' + p.properties.lastName, 
					"userName": p.properties.userName,
					"ref": p.nodeRef.toString()
				} );
			}
			for each( var f in item.assocs['alvexcm:conversationAttachments'] )
			{
				data.files.push( { 
					"name": f.name, 
					"ref": f.nodeRef.toString()
				} );
			}
				
			model.data.push(data);
		}
		status.code = 200;
	} catch (e) {
		status.code = 500;
		status.message = e.message;
		model.message = e.message;
	}
})();