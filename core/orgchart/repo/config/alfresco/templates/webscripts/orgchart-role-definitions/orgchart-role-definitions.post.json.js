(function() {
	var roleId = url.templateArgs['id'];
	try {
		var roleDisplayName = json.get('data').get('displayName');
		var roleWeight = json.get('data').get('weight');
		model.role = orgchart.getRoleById(roleId).update(roleDisplayName, +roleWeight);
		status.code = 200;
	} catch (e) {
		status.code = 500;
		status.message = e.message;
		model.message = e.message;
	}
})();