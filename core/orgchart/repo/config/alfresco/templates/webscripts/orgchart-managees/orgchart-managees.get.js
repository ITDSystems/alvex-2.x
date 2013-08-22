(function() {
	try {
		var userName = url.templateArgs['userName'];
		model.managees = orgchart.getPerson(userName).managees;
		status.code = 200;
	} catch (e) {
		status.code = 500;
		status.message = e.message;
		model.message = e.message;
	}
})();