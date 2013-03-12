(function() {
	try {
		model.dls = [];
		var sites = siteService.listSites('','');
		for each( site in sites )
		{
			if( ! site.hasContainer( 'dataLists' ) 
					|| ! site.getContainer( 'dataLists' ) 
					|| ! site.getContainer( 'dataLists' ).children )
				continue;
			var dls = site.getContainer( 'dataLists' ).children;
			for each(dl in dls)
			{
				model.dls.push( {
					"siteTitle": site.title,
					"siteName": site.shortName,
					"listTitle": dl.properties.title, 
					"itemType": dl.properties["dl:dataListItemType"],
					"nodeRef": dl.nodeRef.toString()
				} );
			}
		}
		status.code = 200;
	} catch (e) {
		status.code = 500;
		status.message = e.message;
		model.message = e.message;
	}
})();
