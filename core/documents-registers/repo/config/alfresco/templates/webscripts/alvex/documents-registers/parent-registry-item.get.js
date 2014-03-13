(function() {
	try {
		var fileRef = args['fileRef'];
		var node = search.findNode(fileRef);
		model.itemRef = (String)(alvexRegistriesService.getParentRegistryItems(node));
		status.code = 200;
	} catch (e) {
		status.code = 500;
		status.message = e.message;
		model.message = e.message;
	}
})();
