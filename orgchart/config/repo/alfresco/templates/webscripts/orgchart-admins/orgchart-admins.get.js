(function() {
	try {
		var unitId = url.templateArgs['id'];
		model.admins = orgchart.getUnit(unitId).admins;
		status.code = 200;
	} catch (e) {
		status.code = 500;
		status.message = e.message;
		model.message = e.message;
	}
})();