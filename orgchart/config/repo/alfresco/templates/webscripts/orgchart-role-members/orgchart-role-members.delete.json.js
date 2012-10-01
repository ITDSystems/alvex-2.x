(function() {
	var unitId = url.templateArgs['id'];
	var roleName = url.templateArgs['role'];
	try {
		var personLogins = json.get('data').get('logins').split(',');
		for each (login in personLogins) {
			var person = people.getPerson(login);
			orgchart.getUnit(unitId).getRole(roleName).deleteMember(person);
		}		
		status.code = 200;
	} catch (e) {
		status.message = e.message;
		status.message = e.message;
		model.message = e.message;
	}
})();