(function() {
	try {
		var dlRef = json.get('data').get('dlRef'); //"workspace://SpacesStore/10119ea8-1ebe-45c8-a651-782c0ce0d15b";
		var dlField = json.get('data').get('dlField'); //"alvexdt:correspondent";

		var dl = search.findNode( dlRef );

		for each ( cl in dl.assocs["alvexdr:attachedClassifiers"] )
		{
			if( cl.properties["alvexdr:classifierTargetField"] == dlField )
			{
				dl.removeAssociation( cl, "alvexdr:attachedClassifiers" );
				cl.remove();
			}
		}

		var type = json.get('data').get('type');
		var store = companyhome.childrenByXPath('/sys:system/sys:alvex/alvex:data/alvex:documents-registers')[0];

		if( type == "internal" )
		{
			var classifierRef = json.get('data').get('classifierRef'); //"workspace://SpacesStore/a534356f-8dd6-4d9a-8ffb-dc1adb140c01";
			var classifierField = json.get('data').get('classifierField'); //"dl:issueStatus";

			if( (classifierRef != "") && (classifierField != "") )
			{
				var cl = search.findNode( classifierRef );

				var newClConf = store.createNode(null,'alvexdr:internalClassifier','sys:children');
				newClConf.properties["alvexdr:classifierTargetField"] = dlField;
				newClConf.properties["alvexdr:classifierDataListColumn"] = classifierField;
				newClConf.save();
				newClConf.createAssociation( cl, "alvexdr:classifierDataList" );

				dl.createAssociation( newClConf, "alvexdr:attachedClassifiers" );
			}
		}

		status.code = 200;
	} catch (e) {
		status.code = 500;
		status.message = e.message;
		model.message = e.message;
	}
})();
