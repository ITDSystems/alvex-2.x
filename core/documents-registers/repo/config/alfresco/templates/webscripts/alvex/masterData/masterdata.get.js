(function() {
	try {
		model.srcName = decodeURIComponent(url.templateArgs['source']);
		var src = alvexMasterDataService.getMasterDataSource(model.srcName);
		model.data = alvexMasterDataService.getMasterData(src);
		status.code = 200;
	} catch (e) {
		status.code = 500;
		status.message = e.message;
		model.message = e.message;
	}
})();
