(function() {
	try {
		model.masterData = [];
		var dlRef = args['dlRef'];
		var itemRef = args['itemRef'];
		if(itemRef && itemRef != '')
		{
			var node = search.findNode( itemRef );
			dlRef = (node && node.parent ? node.parent.nodeRef.toString() : '');
		}
		
		var fieldName = args['fieldName'];
		var refs = args['refs'];

		if( refs && refs != '' )
		{
			var cls = refs.split(',');
			for each( ref in cls )
			{
				var dl = search.findNode( ref );
				if( dl.type == "{http://alvexcore.com/prefix/alvexdr}internalMasterData" )
				{
					model.masterData.push( {'type': 'internal', 'dlRef': ref, 
								'dlField': dl.properties["alvexdr:masterDataTargetField"],
								'clRef': dl.assocs["alvexdr:masterDataDataList"][0].nodeRef.toString(), 
								'clField': dl.properties["alvexdr:masterDataDataListColumn"]} );
				}
			}
		}
		else if ( dlRef && fieldName && dlRef != '' && fieldName != '' )
		{
			var fieldName = fieldName.replace('prop_','').replace('_',':');

			var dl = search.findNode( dlRef );
			for each( cl in dl.assocs["alvexdr:attachedMasterData"] )
			{
				if( cl.properties["alvexdr:masterDataTargetField"] == fieldName )
				{
					if( cl.type == "{http://alvexcore.com/prefix/alvexdr}internalMasterData" )
					{
						model.masterData.push( {'type': 'internal', 'dlRef': dlRef, 
								'dlField': cl.properties["alvexdr:masterDataTargetField"],
								'clRef': cl.assocs["alvexdr:masterDataDataList"][0].nodeRef.toString(), 
								'clField': cl.properties["alvexdr:masterDataDataListColumn"]} );
					}
				}
			}
		}

		status.code = 200;
	} catch (e) {
		status.code = 500;
		status.message = e.message;
		model.message = e.message;
	}
})();
