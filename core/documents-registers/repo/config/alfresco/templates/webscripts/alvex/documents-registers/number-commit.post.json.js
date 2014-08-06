(function() {
	try {
		var dlRef = json.get('register');
		var number = json.get('number');
		var prop = json.get('prop').replace('_',':');
		
		var dl = search.findNode(dlRef);
		var result = alvexRegistriesService.commitNextNumber(dl, number, prop);
		model.success = result.success;
		model.reason = result.reason;
		model.id = result.id;
		model.ref = result.nodeRef;
		
		status.code = 200;
	} catch (e) {
		status.code = 500;
		status.message = e.message;
		model.message = e.message;
	}
})();
