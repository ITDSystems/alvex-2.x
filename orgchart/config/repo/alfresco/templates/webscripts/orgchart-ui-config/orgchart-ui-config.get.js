(function(){
	try {
		// Get config node, create if it does not exist
		var confFolder = companyhome.childrenByXPath('/sys:system/sys:alvex/alvex:data/alvex:orgchart')[0];
		var conf = confFolder.childByNamePath('orgchart-view.default');
		if(conf == null)
			conf = confFolder.createNode('orgchart-view.default','alvexoc:UIConfig','sys:children');

		// Read config and push it for the response
		model.data = {};
		model.data.configNodeRef = conf.getNodeRef().toString();
		model.data.showUnitsRecursively = conf.properties['alvexoc:showUnitsRecursively'].toString();
		model.data.viewType = conf.properties['alvexoc:viewType'];
		if( conf.properties['alvexoc:defaultRoleName'] )
			model.data.defaultRoleName = conf.properties['alvexoc:defaultRoleName'];
		else
			model.data.defaultRoleName = '';

		status.code = 200;
	} catch (e) {
		status.code = 500;
		status.message = e.message;
		model.message = e.message;
	}
})();