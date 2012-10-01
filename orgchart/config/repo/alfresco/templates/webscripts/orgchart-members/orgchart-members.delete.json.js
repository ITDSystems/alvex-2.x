(function() {
	var unitId = url.templateArgs['id'];
	try {
		var personLogins = json.get('data').get('logins').split(',');
		for each (login in personLogins) {
			var person = people.getPerson(login);
			orgchart.getUnit(unitId).deleteMember(person);
		}
		status.code = 200;
	} catch (e) {
		status.code = 500;
		status.message = e.message;
		model.message = e.message;
	}
})();