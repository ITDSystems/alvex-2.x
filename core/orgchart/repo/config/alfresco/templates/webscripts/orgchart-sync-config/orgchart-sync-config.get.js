(function(){
	try {
		// Get config node, create if it does not exist
		var confFolder = companyhome.childrenByXPath('/sys:system/sys:alvex/alvex:data/alvex:orgchart')[0];
		var conf = confFolder.childByNamePath('orgchart-sync.default');
		model.data = {};

		// Default reply
		if(conf == null)
		{
			var f = function() { conf = confFolder.createNode('orgchart-sync.default','alvexoc:syncConfig','sys:children'); };
			sudoUtils.sudo(f);
		}

		// Read config and push it for the response
		model.data.configNodeRef = conf.getNodeRef().toString();
		model.data.syncSource = conf.properties['alvexoc:syncSource'];
		if( conf.properties['alvexoc:syncRootGroupName'] )
			model.data.syncRootGroupName = conf.properties['alvexoc:syncRootGroupName'];
		else
			model.data.syncRootGroupName = '';

		status.code = 200;
	} catch (e) {
		status.code = 500;
		status.message = e.message;
		model.message = e.message;
	}
})();
