(function() {
	try {
		var unitId = url.templateArgs['id'];
		model.roles = orgchart.getUnit(unitId).roles;
		status.code = 200;
	} catch (e) {
		status.code = 500;
		status.message = e.message;
		model.message = e.message;
	}
})();