<import resource="classpath:alfresco/extension/templates/webscripts/alvex-config/alvex-config.lib.js">

var sortByWeight = function(a, b)
{
	var weightA = parseFloat( a.definition.weight );
	var weightB = parseFloat( b.definition.weight );
	if( weightA != weightB )
		return weightA - weightB;
	else
		return a.definition.displayName.localeCompare(b.definition.displayName);
};

var sortByName = function(a, b)
{
	var nameA = a.lastName + ' ' + a.firstName;
	var nameB = b.lastName + ' ' + b.firstName;
	return nameA.localeCompare(nameB);
};

function addRolesFromChildUnits( uroles, unit )
{
	for each (child in unit.children)
	{
		for each (cr in child.roles)
			uroles.push(cr);
		addRolesFromChildUnits( uroles, child );
	}
};

function addMembersFromUnit( unit, presentMap, showRecursively )
{
	var rusers = unit.members.sort( sortByName );
	for each (var assignee in rusers)
		if (!(assignee.userName in presentMap))
		{
			var person = people.getPerson(assignee.userName);
			var firstName = (person.properties['cm:firstName'] != null ) ? 
								person.properties['cm:firstName'] : '';
			var lastName = (person.properties['cm:lastName'] != null ) ? 
								person.properties['cm:lastName'] : '';
			model.unit.people.push({
				userName: assignee.userName,
				firstName: firstName,
				lastName: lastName,
				nodeRef: assignee.getNode().toString(),
				roleName: '',
				roleDisplayName: 'members'
			});
			presentMap[assignee.userName] = true;
		}
	if( showRecursively )
		for each (child in unit.children)
			addMembersFromUnit( child, presentMap, showRecursively );
};

(function(){
	try{
		var uiConfig = Alvex.configs.getConfig('orgchart', 'ui-config');
		if( ! uiConfig )
			uiConfig = Alvex.configs.createConfig('orgchart', 'ui-config');
		var showRecursively = uiConfig.properties['alvexoc:showUnitsRecursively'];
		var unitId = url.templateArgs['id'];
		var unit = orgchart.getUnit(unitId);
		model.unit = {
			name: unit.name,
			weight: unit.weight,
			displayName: unit.displayName,
			id: unit.id,
			people: []
		};
		var presentMap = [];
		
		var uroles = unit.roles;
		
		if( showRecursively )
			addRolesFromChildUnits( uroles, unit );
		
		uroles = uroles.sort( sortByWeight );
		
		for each (var role in uroles)
		{
			var rusers = role.assignees.sort( sortByName );
			for each (var assignee in rusers) {
				presentMap[assignee.userName] = true;
				model.unit.people.push({
					userName: assignee.userName,
					firstName: assignee.firstName,
					lastName: assignee.lastName,
					nodeRef: assignee.getNode().toString(),
					roleName: role.definition.name,
					roleDisplayName: role.definition.displayName
				});
			}
		}
		addMembersFromUnit( unit, presentMap, showRecursively );
		status.code = 200;
	}
	catch (e) {
		status.code = 500;
		status.message = e.message;
		model.message = e.message;
	}
})();
