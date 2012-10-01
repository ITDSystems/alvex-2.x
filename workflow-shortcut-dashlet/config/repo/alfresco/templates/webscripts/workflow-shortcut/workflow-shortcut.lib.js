var Utils = {

	getDir: function (path, folder)
	{
		path = path.replace(/\/+/g, '/').replace(/^\//g, '');
		var steps = path.split('/');
		var new_folder = folder.childrenByXPath(steps[0])[0];
		if( new_folder == undefined )
			new_folder = folder.createNode( steps[0].replace(/.*:/g,''), 
				"cm:folder", null, "cm:contains", steps[0] );
		if( steps.length == 1 || steps[1] == '' )
			return new_folder;
		return this.getDir(steps.slice(1).join('/'), new_folder);
	}

};
