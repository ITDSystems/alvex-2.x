(function (){
	var ext = url.templateArgs['extension'];
	var config = url.templateArgs['config'];
	var nodes = search.xpathSearch('/sys:system/sys:alvex/alvex:data/alvex:'+ext+'/'+config);
	model.props = [];
	if (nodes.length == 1) {
		var node = nodes[0];
		model.nodeRef = node.nodeRef.toString();
		for each (var key in node.getPropertyNames(true)) {
			if (key.indexOf('alvex') >= 0)
			model.props.push({
				'key': key,
				'value': node.properties[key]
			});
		}
	}
	else {
		model.nodeRef = null;
	}
})();
