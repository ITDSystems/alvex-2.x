(function(){
	try {
		model.data = {};
		var workflowId = url.templateArgs['workflowId'];
		// Get config node, create if it does not exist
		var confFolder = companyhome.childrenByXPath('/sys:system/sys:alvex/alvex:data/alvex:related-workflows')[0];
		var conf = confFolder.childByNamePath(workflowId);
		if(conf == null)
			model.data.parentTask = '';
		else
			model.data.parentTask = conf.properties['alvexrwf:parent'];

		status.code = 200;
	} catch (e) {
		status.code = 500;
		status.message = e.message;
		model.message = e.message;
	}
})();
