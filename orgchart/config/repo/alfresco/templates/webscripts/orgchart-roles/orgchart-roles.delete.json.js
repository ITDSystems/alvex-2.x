(function() {
	try {
		var unitId = url.templateArgs['id'];
		var roleName = url.templateArgs['role'];
		orgchart.getUnit(unitId).removeRole(roleName);
		status.code = 200;
	} catch (e) {
		status.code = 500;
		status.message = e.message;
		model.message = e.message;
	}
})();