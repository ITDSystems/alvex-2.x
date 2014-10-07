(function() {
	try {
		var type = args['type'];
		var container = args['container'];
		var node = search.findNode(container);
		model.type = alvexDictionaryService.getCompleteTypeDescription(type, node);
		status.code = 200;
	} catch (e) {
		status.code = 500;
		status.message = e.message;
		model.message = e.message;
	}
})();