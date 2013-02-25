(function() {
	try {
		var siteName = url.templateArgs['site'];
		var contName = url.templateArgs['container'];
		var dlTitle = url.templateArgs['listTitle'];
		var dlRef = args['dlRef'];

		var list;
		model.data = [];

		if( siteName && contName && dlTitle )
		{
			var site = siteService.getSite(siteName);
			var cont = site.getContainer(contName);
		
			for each (dl in cont.children)
				if(dl.properties.title == dlTitle)
					list = dl;
		}
		else if (dlRef)
		{
			list = search.findNode( dlRef );
		}

		for each (item in list.children)
		{
			var newItem = {};
			for (p in item.properties)
				newItem[p.replace(/\{.*\}/,'')] = item.properties[p].toString();
			model.data.push(newItem);
		}
		
		status.code = 200;
	} catch (e) {
		status.code = 500;
		status.message = e.message;
		model.message = e.message;
	}
})();
