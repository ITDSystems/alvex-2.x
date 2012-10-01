<import resource="classpath:alfresco/templates/webscripts/workflow-shortcut/workflow-shortcut.lib.js">

(function(){
	var group = args['group'];
	var workflow = args['workflow'];

	if ( (!group) || (!workflow) || (group == '') || (workflow == '') )
	{
		status.code = 500;
		status.message = 'Mandatory fields were not provided.';
		status.redirect = true;
		return;
	}

	try {
		var dict = companyhome.childrenByXPath("app:dictionary")[0];
		var folder = Utils.getDir("app:alvex/app:workflow-shortcut/", dict);

		var children = folder.children;
		for (c in children) {
			var node = children[c];
			if (node.name == group + '.config') {
				var lines = new String(node.content).toString().split('\n');
				var new_lines = [];
				for(l in lines)
					if( (lines[l] != workflow) && (lines[l] != '') )
						new_lines.push(lines[l]);
				node.content = new_lines.join('\n');
				node.save();
			}
		}
		status.code = 200;
	} catch(e) {
		status.code = 500;
		status.message = e.message;
		status.redirect = true;
	}
})();
