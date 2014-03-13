(function() {
	try {
		var itemRef = args['itemRef'];
		var item = search.findNode(itemRef);
		var desc = alvexRegistriesService.getParentRegistryDetails(item);
		model.registryName = desc.registryName;
		model.siteName = desc.siteName;
		status.code = 200;
	} catch (e) {
		status.code = 500;
		status.message = e.message;
		model.message = e.message;
	}
})();
