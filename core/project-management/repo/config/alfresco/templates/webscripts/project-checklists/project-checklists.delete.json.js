(function() {
	try{
		// Request parameters
		var proto = decodeURIComponent(url.templateArgs['proto']);
		var space = decodeURIComponent(url.templateArgs['space']);
		var id = decodeURIComponent(url.templateArgs['id']);
		var node = search.findNode( proto + "://" + space + "/" + id );
		if( node && node !== null )
			node.remove();
		status.code = 200;
	} catch (e) {
		status.code = 500;
		status.message = e.message;
		model.message = e.message;
	}
})();