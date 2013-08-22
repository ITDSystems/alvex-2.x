(function() {
	var roleName = url.templateArgs['role'];
	try {
		var units = orgchart.getUnitsWithRoleAdded(roleName);
		var names = [];
		if( units.length == 0 ) {
			orgchart.dropRole(roleName);
		} else {
			model.message = "Can not delete: role is used";
			model.details = "alvex.orgchart.error.roleDefIsUsed|";
			for each (unit in units)
				names.push( unit.getDisplayName() );
			model.details += names.join(', ');
		}
		status.code = 200;
	} catch (e) {
		status.code = 500;
		status.message = e.message;
		model.message = e.message;
	}
})();