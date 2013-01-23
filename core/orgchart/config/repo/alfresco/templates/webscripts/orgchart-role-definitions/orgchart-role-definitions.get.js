var sortByWeight = function(a, b)
{
	var weightA = parseFloat( a.getWeight() );
	var weightB = parseFloat( b.getWeight() );
	if( weightA != weightB )
		return weightA - weightB;
	else
		return a.getDisplayName().localeCompare(b.getDisplayName());
};

(function() {
	try {
		if(orgchart.exists())
			model.roles = orgchart.roles.sort( sortByWeight );
		status.code = 200;
	} catch (e) {
		status.code = 500;
		status.message = e.message;
		model.message = e.message;
	}
})();