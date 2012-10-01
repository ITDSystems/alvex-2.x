(function() {
	var roleName = url.templateArgs['role'];
	try {
		orgchart.dropRole(roleName);
		status.code = 200;
	} catch (e) {
		status.code = 500;
		status.message = e.message;
		model.message = e.message;
	}
})();