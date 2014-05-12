(function() {
	try {
		model.regs = [];
		
		var siteRef = args['siteRef'];
      
		var item = search.findNode( siteRef );
		var dlCont = null;
		for(var i = 0; i < item.children.length; i++)
		{
			if( item.children[i].name == "dataLists" )
			   dlCont = item.children[i];
		}

		for(var i = 0; i < dlCont.children.length; i++)
		{
			if( alvexDictionaryService.isRegistry( dlCont.children[i] ) )
			{
				model.regs.push( {
					"type": dlCont.children[i].properties["dl:dataListItemType"],
					"ref": dlCont.children[i].nodeRef.toString(),
					"name": dlCont.children[i].name
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
