(function(){
	model.extensions = [];
	try {
		model.systemId = extensionRegistry.getSystemId();
		for each(extension in extensionRegistry.getInstalledExtensions())
			model.extensions.push(extension.getId());
		
		status.code = 200;
		
	} catch (e) {
		status.code = 500;
		status.message = e.message;
		model.message = e.message;
	}
})();
