(function() {
	try {
		var dlRef = json.get('register');
		var number = json.get('number');
		var prop = json.get('prop').replace('_',':');
		
		var dl = search.findNode(dlRef);
		model.correct = alvexRegistriesService.commitNextNumber(dl, number, prop).toString();
		
		status.code = 200;
	} catch (e) {
		status.code = 500;
		status.message = e.message;
		model.message = e.message;
	}
})();
