(function(){
	model.extensions = [];
	try {
		model.systemId = extensionRegistry.getSystemId();
		model.version = extensionRegistry.getReleaseVersion();
		model.edition = extensionRegistry.getReleaseEdition();

		for each(extension in extensionRegistry.installedExtensions) {
			var hashes = [];
			var h = extension.mD5Hashes;
			for (key in h)
				hashes.push({
					"file": key,
					"hash": h[key]
				});
			model.extensions.push({
				id: extension.id,
				version: extension.version,
				edition: extension.edition,
				hashes: hashes
			});
		}
		
		status.code = 200;
		
	} catch (e) {
		status.code = 500;
		status.message = e.message;
		model.message = e.message;
	}
})();
