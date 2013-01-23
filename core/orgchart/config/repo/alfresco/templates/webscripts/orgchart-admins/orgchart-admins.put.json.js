(function() {
	var unitId = url.templateArgs['id'];
	try {
		if( json.get('data').has('nodeRefs') )
		{
			var personRefs = json.get('data').get('nodeRefs').split(',');
			for each (ref in personRefs) {
				var person = search.findNode(ref);
				orgchart.getUnit(unitId).addAdmin(person);
			}
		}
		else if ( json.get('data').has('logins') )
		{
			var logins = json.get('data').get('logins').split(',');
			for each (login in logins) {
				var person = people.getPerson(login);
				orgchart.getUnit(unitId).addAdmin(person);
			}
		}
		status.code = 200;
	} catch (e) {
		status.code = 500;
		status.message = e.message;
		model.message = e.message;
	}
})();
