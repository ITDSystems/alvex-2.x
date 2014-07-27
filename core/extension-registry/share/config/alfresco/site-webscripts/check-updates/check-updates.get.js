(function(){
	/* This script is intended to perform actual updates check.
	 * It's NOT about UI for updates, UI part calls this script.
	 * It works on Share side since it should gather and return info for both Repo and Share tiers.
	 * */
	model.json = null;
	try{
		/*
		// establish connection
		var connector = remote.connect("alfresco");

		// Call the repo to collect server meta-data
		var repo_json = eval('(' + connector.get("/api/server") + ')');

		model.serverEdition = repo_json.data.edition;
		model.serverVersion = repo_json.data.version;
		model.serverSchema = repo_json.data.schema;

		// get license id
		var licenseId = eval('('+connector.get('/api/alvex/license')+')').license.id;
		// get repo extensions
		var response = eval('('+connector.get('/api/alvex/extension-list')+')').data;
		var repoId = response.systemId;
		var extensions = [];
		for each (var e in response.extensions)
			extensions[e.id] = {
				repoVersion: e.repoVersion,
				repoEdition: e.repoEdition,
				repoHashes: e.repoHashes,
				shareVersion: null,
				shareEdition: null,
				shareHashes: []
		}

		for each (var e in extensionRegistry.getInstalledExtensions()) {
			if (!(extensions[e.getId()]))
				extensions[e.getId()] = {
					repoVersion: null,
					repoEdition: null,
					repoHashes: []
				}
			extensions[e.getId()].shareVersion = e.getVersion();
			extensions[e.getId()].shareEdition = e.getEdition();
			extensions[e.getId()].shareHashes = [];
			var hashes = e.getMD5Hashes();
			for (var h in hashes)
				extensions[e.getId()].shareHashes.push({
					'file': h,
					'hash': hashes[h]
				});
		}

		var req = {
			version: response.version,
			edition: response.edition,
			repoId: repoId,
			licenseId: licenseId,
			extensions: extensions
		}

		//connector = remote.connect("alvexupdate");
		model.localData = jsonUtils.toJSONString(req);
		//model.remoteData = connector.post('/', jsonUtils.toJSONString(req));
		*/
		status.code = 200;
	} catch (e)
	{
		status.code = 500;
	}
})();
