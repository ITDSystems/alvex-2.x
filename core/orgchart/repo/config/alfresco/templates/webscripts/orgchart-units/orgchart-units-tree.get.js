var sortByWeight = function(a, b)
{
	var weightA = parseFloat( a.weight );
	var weightB = parseFloat( b.weight );
	if( weightA != weightB )
		return weightA - weightB;
	else
		return a.displayName.localeCompare(b.displayName);
};

function buildTree(unit) {
	var el = {
		name: unit.name,
		displayName: unit.displayName,
		weight: unit.weight,
		groupRef: unit.groupRef,
		id: unit.id,
		children: []
	};
	var cunits = unit.children.sort( sortByWeight );
	for each (var child in cunits)
		el.children.push(buildTree(child));
	return el;
}

(function(){
	try{
		var branchName = url.templateArgs['branch'];
		model.tree = buildTree(orgchart.getBranch(branchName));
		status.code = 200;
	}
	catch (e) {
		status.code = 500;
		status.message = e.message;
		model.message = e.message;
	}
})();
