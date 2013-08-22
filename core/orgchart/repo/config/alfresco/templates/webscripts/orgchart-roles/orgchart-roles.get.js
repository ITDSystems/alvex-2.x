var sortByWeight = function(a, b)
{
	var weightA = parseFloat( a.getDefinition().getWeight() );
	var weightB = parseFloat( b.getDefinition().getWeight() );
	if( weightA != weightB )
		return weightA - weightB;
	else
		return a.getDefinition().getDisplayName().localeCompare(b.getDefinition().getDisplayName());
};

(function() {
	try {
		var unitId = url.templateArgs['id'];
		model.roles = orgchart.getUnit(unitId).roles.sort( sortByWeight );
		status.code = 200;
	} catch (e) {
		status.code = 500;
		status.message = e.message;
		model.message = e.message;
	}
})();
