function get_dir(path, folder) {
	path = path.replace(/\/+/g, '/').replace(/^\//g, '');
	var steps = path.split('/');
	var new_folder = folder.childByNamePath(steps[0]);
	if( new_folder == undefined )
		new_folder = folder.createFolder(steps[0]);
	if( steps.length == 1 || steps[1] == '' )
		return new_folder;
	return get_dir(steps.slice(1).join('/'), new_folder);
};

(function(){
	if (!(json.has('group') && json.has('workflow')))
	{
		status.code = 500;
		status.message = 'Mandatory fields were not provided.';
		status.redirect = true;
		return;
	}

	try {
		var dict = search.luceneSearch('PATH:"/app:company_home/app:dictionary"')[0];
		var folder = get_dir("Dashlets/workflow-shortcut/", dict);

		var group = json.get('group');
		var workflow = json.get('workflow');

		var children = folder.children;
		for (c in children) {
			var node = children[c];
			if (node.name == group + '.config') {
				var lines = new String(node.content).toString().split('\n');
				var exist = false;
				for(l in lines)
					if(lines[l] == workflow)
						exist = true;
				if(!exist && workflow != '')
					lines.push(workflow);
				node.content = lines.join('\n');
				node.save();
			}
		}
		model.code = 200;
	} catch(e) {
		status.code = 500;
		status.message = e.message;
		status.redirect = true;
	}
})();
