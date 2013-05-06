<import resource="classpath:alfresco/extension/templates/webscripts/alvex-config/alvex-config.lib.js">

(function (){
	try {
		var ext = url.templateArgs['extension'];
		var config = url.templateArgs['config'];
		var node = Alvex.configs.getConfig(ext, config);
		if (!node) {
			// create empty config
			node = Alvex.configs.createConfig(ext, config)
		}
		model.nodeRef = node.nodeRef.toString();
		model.props = [];
		for each (var key in node.getPropertyNames(true)) {
			if (key.indexOf('alvex') >= 0)
				model.props.push({
					'key': key,
					'value': node.properties[key]
				});
		}
	} catch (e) {
		model.error_message = e.toString();
		status.code = 500;
	}
})();
