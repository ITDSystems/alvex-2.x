(function() {
	try {
		model.workflowsAvailable = alvexRegistriesService.workflowsAvailableForRegistryItem().toString();
		status.code = 200;
	} catch (e) {
		status.code = 500;
		status.message = e.message;
		model.message = e.message;
	}
})();
