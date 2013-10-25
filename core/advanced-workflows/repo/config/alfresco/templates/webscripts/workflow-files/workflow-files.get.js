try {
	var ref = args['packageRef'];
	var cont = search.findNode(ref);
	model.files = [];
	for each( item in cont.children)
		model.files.push( {
				"nodeRef": item.nodeRef.toString(),
				"name": item.name
			});
	status.code = 200;			
} catch (ex) {
	status.code = 500;
	status.message = ex.message;
	model.message = ex.message;
}
