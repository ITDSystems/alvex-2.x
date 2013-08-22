(function() {
	try {
		var dlRef = json.get('data').get('dlRef'); //"workspace://SpacesStore/10119ea8-1ebe-45c8-a651-782c0ce0d15b";
		var dlField = json.get('data').get('dlField'); //"alvexdt:correspondent";

		var dl = search.findNode( dlRef );

		for each ( cl in dl.assocs["alvexdr:attachedMasterData"] )
		{
			if( cl.properties["alvexdr:masterDataTargetField"] == dlField )
			{
				dl.removeAssociation( cl, "alvexdr:attachedMasterData" );
				cl.remove();
			}
		}

		var type = json.get('data').get('type');
		var store = companyhome.childrenByXPath('/sys:system/sys:alvex/alvex:data/alvex:documents-registers')[0];

		if( type == "internal" )
		{
			var masterDataRef = json.get('data').get('masterDataRef'); //"workspace://SpacesStore/a534356f-8dd6-4d9a-8ffb-dc1adb140c01";
			var masterDataField = json.get('data').get('masterDataField'); //"dl:issueStatus";

			if( (masterDataRef != "") && (masterDataField != "") )
			{
				var cl = search.findNode( masterDataRef );

				var newClConf = store.createNode(null,'alvexdr:internalMasterData','sys:children');
				newClConf.properties["alvexdr:masterDataTargetField"] = dlField;
				newClConf.properties["alvexdr:masterDataDataListColumn"] = masterDataField;
				newClConf.save();
				newClConf.createAssociation( cl, "alvexdr:masterDataDataList" );

				dl.createAssociation( newClConf, "alvexdr:attachedMasterData" );
			}
		}

		status.code = 200;
	} catch (e) {
		status.code = 500;
		status.message = e.message;
		model.message = e.message;
	}
})();
