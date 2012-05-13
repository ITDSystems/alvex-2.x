(function(){
	model.extensions = [];
	try {
		model.systemId = extensionRegistry.getSystemId();
		for each(extension in extensionRegistry.getInstalledExtensions())
			model.extensions.push(extension.getId());
		model.code = 200;
	} catch (e) {
		model.code = 500;
		model.message = e.message;
	}
})();
