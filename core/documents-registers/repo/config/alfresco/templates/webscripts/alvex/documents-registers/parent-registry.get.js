(function() {
	try {
		var itemRef = args['itemRef'];
		var item = search.findNode(itemRef);
		model.registryName = item.parent.name;
		model.siteName = item.parent.parent.parent.name;
		status.code = 200;
	} catch (e) {
		status.code = 500;
		status.message = e.message;
		model.message = e.message;
	}
})();
