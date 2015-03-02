(function() {
	try {
		var dlRef = args['register'];
		var itemRef = args['item'];
		var dl = null;
		if(dlRef !== null) {
			dl = search.findNode(dlRef);
		} else if(itemRef !== null) {
			var item = search.findNode(itemRef);
			dl = item.parent;
			dlRef = dl.nodeRef.toString();
		}
		model.dlRef = dlRef;
		try {
			model.createMode = dl.properties["alvexdr:createIdMode"];
			model.allowEdit = dl.properties["alvexdr:allowIdEdit"];
		} catch (e) {
			// Access denied to register, only to item
			// It's ok, return code 200 and 'not allowed to change number'
			model.createMode = "";
			model.allowEdit = false;
		}
		status.code = 200;
	} catch (e) {
		status.code = 500;
		status.message = e.message;
		model.message = e.message;
	}
})();
