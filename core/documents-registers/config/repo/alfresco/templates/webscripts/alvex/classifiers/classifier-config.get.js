(function() {
	try {
		model.classifiers = [];
		var dlRef = args['dlRef'];
		var fieldName = args['fieldName'];
		var refs = args['refs'];

		if( refs && refs != '' )
		{
			var cls = refs.split(',');
			for each( ref in cls )
			{
				var dl = search.findNode( ref );
				if( dl.type == "{http://alvexcore.com/prefix/alvexdr}internalClassifier" )
				{
					model.classifiers.push( {'type': 'internal', 'dlRef': ref, 
								'dlField': dl.properties["alvexdr:classifierTargetField"],
								'clRef': dl.assocs["alvexdr:classifierDataList"][0].nodeRef.toString(), 
								'clField': dl.properties["alvexdr:classifierDataListColumn"]} );
				}
			}
		}
		else if ( dlRef && fieldName && dlRef != '' && fieldName != '' )
		{
			var fieldName = fieldName.replace('prop_','').replace('_',':');

			var dl = search.findNode( dlRef );
			for each( cl in dl.assocs["alvexdr:attachedClassifiers"] )
			{
				if( cl.properties["alvexdr:classifierTargetField"] == fieldName )
				{
					if( cl.type == "{http://alvexcore.com/prefix/alvexdr}internalClassifier" )
					{
						model.classifiers.push( {'type': 'internal', 'dlRef': dlRef, 
								'dlField': cl.properties["alvexdr:classifierTargetField"],
								'clRef': cl.assocs["alvexdr:classifierDataList"][0].nodeRef.toString(), 
								'clField': cl.properties["alvexdr:classifierDataListColumn"]} );
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
