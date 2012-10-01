<import resource="classpath:alfresco/templates/webscripts/workflow-shortcut/workflow-shortcut.lib.js">

(function(){
	if (!(json.has('group') && json.has('workflow')))
	{
		status.code = 500;
		status.message = 'Mandatory fields were not provided.';
		status.redirect = true;
		return;
	}

	try {
		var dict = companyhome.childrenByXPath("app:dictionary")[0];
		var folder = Utils.getDir("app:alvex/app:workflow-shortcut/", dict);

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
		status.code = 200;
	} catch(e) {
		status.code = 500;
		status.message = e.message;
		status.redirect = true;
	}
})();
