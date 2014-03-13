(function() {
	try {
		var dlRef = args['register'];
		var dl = search.findNode(dlRef);
		model.number = alvexRegistriesService.suggestNextNumber(dl);
		status.code = 200;
	} catch (e) {
		status.code = 500;
		status.message = e.message;
		model.message = e.message;
	}
})();
