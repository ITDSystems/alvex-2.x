(function() {
	try {
		var unitId = url.templateArgs['id'];
		model.members = orgchart.getUnit(unitId).members;
		status.code = 200;
	} catch (e) {
		status.code = 500;
		status.message = e.message;
		model.message = e.message;
	}
})();