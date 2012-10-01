(function() {
	try {
		var userName = url.templateArgs['user'];
		model.managees = orgchart.getPerson(userName).managees;
		status.code = 200;
	} catch (e) {
		status.code = 500;
		status.message = e.message;
		model.message = e.message;
	}
})();