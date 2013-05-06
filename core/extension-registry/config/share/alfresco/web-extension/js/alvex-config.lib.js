if (!Alvex)
	var Alvex = {};
if (!Alvex.configs)
	Alvex.configs = {};

Alvex.configs.getConfig = function (ext, config) {
	return eval('(' + remote.connect('alfresco').get('/api/alvex/config/' + ext + '/'+ config) + ')');
};