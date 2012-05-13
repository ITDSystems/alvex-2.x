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

var group = args['group'];
if(!group || group == 'undefined')
	group = 'default';

var allowedWorkflows = [];

var dict = search.luceneSearch('PATH:"/app:company_home/app:dictionary"')[0];
var folder = get_dir("Dashlets/workflow-shortcut/", dict);

if(folder != undefined) {
	var children = folder.children;
	var found = false;
	for (c in children) {
		var node = children[c];
		if (node.name == group + '.config') {
			found = true;
			var lines = new String(node.content).toString().split('\n');
			for(l in lines)
				if(lines[l] != '')
					allowedWorkflows.push({name : lines[l]});
		}
	}
	if(!found) {
		var file = folder.createFile(group + '.config');
		file.mimetype = "text/plain";
		file.content = '';
		file.save();
	}
}

model.workflows = jsonUtils.toJSONString(allowedWorkflows);
