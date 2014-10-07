(function() {
	try {
		var contRef = decodeURIComponent(args['contRef']);
		var cont = search.findNode(contRef);
		model.data = alvexMasterDataService.getAttachedMasterData(cont);
		status.code = 200;
	} catch (e) {
		status.code = 500;
		status.message = e.message;
		model.message = e.message;
	}
})();
