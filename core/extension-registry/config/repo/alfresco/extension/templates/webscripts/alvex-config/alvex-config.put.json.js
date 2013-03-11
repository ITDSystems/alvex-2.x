(function (){
	model.message = null;
	try {
		var ext = url.templateArgs['extension'];
		var config = url.templateArgs['config'];
		var nodes = search.xpathSearch('/sys:system/sys:alvex/alvex:data/alvex:'+ext+'/'+config);
		if (nodes.length == 1) {
			var node = nodes[0];
		}
		else {
			var nodeType = json.get('type');
			var node = search.xpathSearch('/sys:system/sys:alvex/alvex:data')[0].createNode(config, nodeType);
		}
		var props = json.get('props');
		var names = props.names();
		for each (var i = 0; i < names.length(); i++) {
			var key = names.get(i);
			node.properties[key] = props.get(key);
		}
		node.save();
		status.code = 200;
	}
	catch (e) {
		status.code = 500;
		model.message = e.toString();
	}
	model.code = status.code;
})();
