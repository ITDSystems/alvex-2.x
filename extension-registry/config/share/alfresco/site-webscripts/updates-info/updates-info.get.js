(function(){
	try{
		// get repo extensions
		var connector = remote.connect("alfresco");
		var repoExts = eval('('+connector.get('/api/itd/extension/list')+')').data;
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
			var extInfo = eval('('+connector.get('/api/itd/extension/'+ext+'/info')+')');
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
				repoVersion
			);
			// convert result
			shareFiles = [];
			repoFiles = [];
			for (key in update.repoFiles)
				repoFiles.push({
					"file": key,
					"status": update.repoFiles[key]
				});
			for (key in update.shareFiles)
				shareFiles.push({
					"file": key,
					"status": update.shareFiles[key]
				});
			// add
			model.updates.push({
				"extensionId": update.extensionId,
				"repoVersion": update.repoVersion,
				"shareVersion": update.shareVersion,
				"repoLatestVersion": update.repoLatestVersion,
				"shareLatestVersion": update.shareLatestVersion,
				"repoFiles": repoFiles,
				"shareFiles": shareFiles,
				"motd": update.motd
			});
		}
		model.code = 200;
	} catch (e)
	{
		model.code = 500;
		model.message = e.message;
	}
})();
