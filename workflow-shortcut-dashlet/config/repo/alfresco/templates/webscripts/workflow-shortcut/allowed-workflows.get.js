<import resource="classpath:alfresco/templates/webscripts/workflow-shortcut/workflow-shortcut.lib.js">

var allowedWorkflows = [];

var gr_list = people.getContainerGroups(person);

var dict = companyhome.childrenByXPath("app:dictionary")[0];
var folder = Utils.getDir("app:alvex/app:workflow-shortcut/", dict);

if(folder != undefined) {
	var children = folder.children;
	for (c in children) {
		var node = children[c];

		var read_this = false;
		if (node.name == 'default.config')
			read_this = true;
		for (gr in gr_list)
			if (node.name == gr_list[gr].properties['cm:authorityName'].replace(/^GROUP_/, '')+'.config')
				read_this = true;

		if (read_this == true) {
			var lines = new String(node.content).toString().split('\n');
			for(l in lines)
				if(lines[l] != '')
					allowedWorkflows.push({name : lines[l]});
		}
	}
}

model.workflows = allowedWorkflows;
