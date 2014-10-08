(function() {
	try {
		var props = {};
		props.name = json.get("name");
		props.type = json.get("type");
		if(props.type == "datalist")
		{
			props.datalistRef = json.get("datalistRef");
			props.valueColumn = json.get("valueColumn");
			props.labelColumn = json.get("labelColumn");
		}
		if(props.type == "restJSON")
		{
			props.masterDataURL = json.get("masterDataURL");
			props.dataRootJsonQuery = json.get("dataRootJsonQuery");
			props.valueField = json.get("valueField");
			props.labelField = json.get("labelField");
			props.caching = json.get("caching");
		}
		if(props.type == "restXML")
		{
			props.masterDataURL = json.get("masterDataURL");
			props.dataRootXpathQuery = json.get("dataRootXpathQuery");
			props.valueXpath = json.get("valueXpath");
			props.labelXpath = json.get("labelXpath");
			props.caching = json.get("caching");
		}
		model.source = alvexMasterDataService.createMasterDataSource(props);
		status.code = 200;
	} catch (e) {
		status.code = 500;
		status.message = e.message;
		model.message = e.message;
	}
})();
