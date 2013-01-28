(function(){
	try{
		// establish connection
		var connector = remote.connect("alfresco");

		// Call the repo to collect server meta-data
		var repo_json = eval('(' + connector.get("/api/server") + ')');

		// Create model and defaults
		model.serverEdition = "Unknown";
		model.serverVersion = "Unknown (Unknown)";
		model.serverSchema = "Unknown";

		// Check if we got a positive result
		if (repo_json.data)
		{
			model.serverEdition = repo_json.data.edition;
			model.serverVersion = repo_json.data.version;
			model.serverSchema = repo_json.data.schema;
		}

		// get license id
		var licenseId = eval('('+connector.get('/api/alvex/license')+')').data.id;
		// get repo extensions
		var repoExts = eval('('+connector.get('/api/alvex/extension/list')+')').data;
		repoId = repoExts.systemId;
		// build list of all extensions
		var exts = [];
		for each (ext in repoExts.extensions)
			if (exts.indexOf(ext) == -1)
				exts.push(ext);
		for each (ext in extensionRegistry.getInstalledExtensions())
		{
			var flag = true;
			for each (x in exts)
				if (x == ext.getId())
				{
					flag = false;
					break;
				}
			if (flag)
				exts.push(ext.getId());
		}
		// get updates info
		model.updates = [];
		for each (ext in exts)
		{
			// collect necessary info
			var extInfo = eval('('+connector.get('/api/alvex/extension/'+ext+'/info')+')');
			var repoVersion = "";
			var repoHashes = [];
			if (extInfo.code == 200)
			{
				repoVersion = extInfo.data.version;
				for each (hashEntry in extInfo.data.hashes)
					repoHashes[hashEntry.file] = hashEntry.hash;
			}
			var shareVersion = "";
			var shareHashes = [];
			for each (extObj in extensionRegistry.getInstalledExtensions())
				if (extObj.getId() == ext)
				{
					shareVersion = extObj.getVersion();
					var hashes = extObj.getMD5Hashes();
					for (key in hashes)
						shareHashes[key] = hashes[key];
					break;
				}
			// check
			update = extensionRegistry.checkForUpdates(
				ext,
				extensionRegistry.getSystemId(),
				shareHashes,
				shareVersion,
				repoId,
				repoHashes,
				repoVersion,
				licenseId
			);
			// convert result
			shareFiles = [];
			repoFiles = [];
			for (key in update.repoFiles)
				repoFiles.push({
					"file": escape(key),
					"status": update.repoFiles[key]
				});
			for (key in update.shareFiles)
				shareFiles.push({
					"file": escape(key),
					"status": update.shareFiles[key]
				});
			// add
			model.updates.push({
				"extensionId": escape(update.extensionId),
				"repoVersion": escape(update.repoVersion),
				"shareVersion": escape(update.shareVersion),
				"repoLatestVersion": escape(update.repoLatestVersion),
				"shareLatestVersion": escape(update.shareLatestVersion),
				"repoFiles": repoFiles,
				"shareFiles": shareFiles,
				"motd": escape(update.motd)
			});
		}
	} catch (e)
	{
		model.message = e.message;
	}
})();
