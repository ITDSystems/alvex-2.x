(function(){
	// establish connection
	var connector = remote.connect("alfresco");

	// Call the repo to collect server meta-data
	var resp = eval('(' + connector.get("/api/server") + ')');

	model.serverEdition = resp.data.edition;
	model.serverVersion = resp.data.version;
	model.serverSchema = resp.data.schema;

	var resp = eval('(' + connector.get("/api/alvex/license") + ')');

	// get license id
	model.licenseId = resp.license.id;
	model.alvexVersion = resp.version;
	model.alvexEdition = resp.edition;
	model.alvexCodename = resp.codename;
})();
