(function(){
	try {
		var found = false;
		var id = url.templateArgs['id'];
		for each(extension in extensionRegistry.getInstalledExtensions())
			if (extension.getId() == id)
			{
				found = true;
				model.id = id;
				model.version = extension.getVersion();
				model.hashes = [];
				var hashes = extension.getMD5Hashes();
				for (key in hashes)
					model.hashes.push({
						"file": key,
						"hash": hashes[key]
					});
			}
		
		if( !found )
		{
			status.code = 500;
			status.message = "Extension not found";
			model.message = "Extension not found";
			return;
		}
		
		status.code = 200;
		
	} catch(e) {
		status.code = 500;
		status.message = e.message;
		model.message = e.message;
	}
})();
