(function(){
	try{
		var unitId = url.templateArgs['id'];
		var unit = orgchart.getUnit(unitId);
		model.unit = {
			name: unit.name,
			weight: unit.weight,
			displayName: unit.displayName,
			id: unit.id,
			people: []
		};
		var tmp = [];
		for each (var role in unit.roles)
			for each (var assignee in role.assignees) {
				tmp[assignee.userName] = true;
				model.unit.people.push({
					userName: assignee.userName,
					firstName: assignee.firstName,
					lastName: assignee.lastName,
					nodeRef: assignee.getNode().toString(),
					roleName: role.definition.name,
					roleDisplayName: role.definition.displayName
				});
			}
		for each (var assignee in unit.members)
			if (!(assignee.userName in tmp))
			{
				var person = people.getPerson(assignee.userName);
				model.unit.people.push({
					userName: assignee.userName,
					firstName: person.properties['cm:firstName'],
					lastName: person.properties['cm:lastName'],
					nodeRef: assignee.getNode().toString(),
					roleName: '',
					roleDisplayName: 'members'
				});	
			}	
		status.code = 200;
	}
	catch (e) {
		status.code = 500;
		status.message = e.message;
		model.message = e.message;
	}
})();