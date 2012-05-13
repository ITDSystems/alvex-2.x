(function(){
	var id = url.templateArgs['id'];
	for each(extension in extensionRegistry.getInstalledExtensions())
		if (extension.getId() == id)
		{
			model.id = id;
			model.version = extension.getVersion();
			model.hashes = [];
			var hashes = extension.getMD5Hashes();
			for (key in hashes)
				model.hashes.push({
					"file": key,
					"hash": hashes[key]
				});
			model.code = 200;
			return;
		}
	model.message = "Extension not found";
	model.code = 500;
})();
