<import resource="classpath:alfresco/extension/templates/webscripts/alvex-config/alvex-config.lib.js">

(function (){
	model.message = null;
	try {
		var ext = url.templateArgs['extension'];
		var config = url.templateArgs['config'];
		var node = Alvex.configs.getConfig(ext, config);
		if (!node)
			node = Alvex.configs.createConfig(ext, config);
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
