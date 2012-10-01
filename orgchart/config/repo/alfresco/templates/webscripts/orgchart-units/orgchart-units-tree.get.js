function buildTree(unit) {
	var el = {
		name: unit.name,
		displayName: unit.displayName,
		weight: unit.weight,
		id: unit.id,
		children: []
	};
	for each (var child in unit.children)
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