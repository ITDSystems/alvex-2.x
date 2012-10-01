(function() {
	var branchName = url.templateArgs['branch'];
	try {
		var branchDisplayName = json.get('data').get('displayName');
		// Init orgchart on first access
		if(!orgchart.exists())
			orgchart.init();
		model.branch = orgchart.createBranch(branchName, branchDisplayName);
		status.code = 200;
	} catch (e) {
		status.code = 500;
		status.message = e.message;
		model.message = e.message;
	}
})();