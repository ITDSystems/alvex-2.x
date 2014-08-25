(function() {
	try {
		var type = args['type'];
		model.type = alvexDictionaryService.getCompleteTypeDescription(type);
		status.code = 200;
	} catch (e) {
		status.code = 500;
		status.message = e.message;
		model.message = e.message;
	}
})();