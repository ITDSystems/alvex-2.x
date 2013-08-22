if (!Alvex) {
	var Alvex = {};
};

if (!Alvex.configs) {
	Alvex.configs = {};
};

Alvex.configs.map = {
	'orgchart/ui-config': 'alvexoc:UIConfig',
	'orgchart/sync-config': 'alvexoc:syncConfig'
};

// returns node that stores config
Alvex.configs.getContainer = function (ext) {
	var nodes = search.xpathSearch('/sys:system/sys:alvex/alvex:data/alvex:' + ext);
	if (nodes.length == 0)
		throw new Error('Extension container not found. Is Alvex initialized?');
	return nodes[0];
};

// creates config with default settings specified in model
Alvex.configs.createConfig = function (ext, config) {
	var container = Alvex.configs.getContainer(ext);
	var nodeType = Alvex.configs.map[ext + '/' + config];
	if (!nodeType)
		throw new Error('Unknown config type');
	return container.createNode(config, nodeType, 'sys:children');
};

// returns specified config or null if not found
Alvex.configs.getConfig = function (ext, config) {
	var container = Alvex.configs.getContainer(ext);
	return container.childByNamePath(config);
};
