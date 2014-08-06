(function() {
	try {
		var dlRef = json.get('register');
		var createMode = json.get('createMode');
		var allowEdit = json.get('allowEdit');
		var dl = search.findNode(dlRef);
		dl.properties["alvexdr:createIdMode"] = createMode;
		dl.properties["alvexdr:allowIdEdit"] = allowEdit;
		dl.save();
		model.createMode = dl.properties["alvexdr:createIdMode"];
		model.allowEdit = dl.properties["alvexdr:allowIdEdit"];
		model.dlRef = dlRef;
		status.code = 200;
	} catch (e) {
		status.code = 500;
		status.message = e.message;
		model.message = e.message;
	}
})();
