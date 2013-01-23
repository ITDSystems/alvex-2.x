(function() {
	try {
		if(orgchart.exists())
			model.branches = orgchart.branches;
		status.code = 200;
	} catch (e) {
		status.code = 500;
		status.message = e.message;
		model.message = e.message;
	}
})();