(function() {
	var branchName = url.templateArgs['branch'];
	try {
		orgchart.dropBranch(branchName);
		status.code = 200;
	} catch (e) {
		status.code = 500;
		status.message = e.message;
		model.message = e.message;
	}
})();