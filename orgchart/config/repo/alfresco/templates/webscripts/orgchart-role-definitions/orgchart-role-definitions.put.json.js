(function() {
	var roleName = url.templateArgs['role'];
	try {
		var roleDisplayName = json.get('data').has('displayName') ? json.get('data').get('displayName') : null;
		var roleWeight = json.get('data').has('weight') ? json.get('data').get('weight') : null;
		// Init orgchart on first access
		if(!orgchart.exists())
			orgchart.init();
		model.role = orgchart.createRole(roleName, roleDisplayName, roleWeight);
		status.code = 200;
	} catch (e) {
		status.code = 500;
		status.message = e.message;
		model.message = e.message;
	}
})();