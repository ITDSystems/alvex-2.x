(function() {
	var unitId = url.templateArgs['id'];
	try {
		var personRefs = json.get('data').get('nodeRefs').split(',');
		for each (ref in personRefs) {
			var person = search.findNode(ref);
			orgchart.getUnit(unitId).deleteAdmin(person);
		}
		status.code = 200;
	} catch (e) {
		status.code = 500;
		status.message = e.message;
		model.message = e.message;
	}
})();