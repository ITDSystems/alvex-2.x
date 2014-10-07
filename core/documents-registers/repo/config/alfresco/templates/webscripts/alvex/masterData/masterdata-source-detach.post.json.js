(function() {
	try {
		var contRef = json.get("contRef");
		var cont = search.findNode(contRef);
		var fieldName = json.get("field");
		alvexMasterDataService.detachMasterData(cont, fieldName);
		status.code = 200;
	} catch (e) {
		status.code = 500;
		status.message = e.message;
		model.message = e.message;
	}
})();
