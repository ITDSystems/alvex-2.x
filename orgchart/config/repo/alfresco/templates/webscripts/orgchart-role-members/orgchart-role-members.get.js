(function() {
	var unitId = url.templateArgs['id'];
	var roleName = url.templateArgs['role'];
	try {
		model.assignees = orgchart.getUnit(unitId).getRole(roleName).assignees;
		status.code = 200;
	} catch (e) {
		status.message = e.message;
		status.message = e.message;
		model.message = e.message;
	}
})();