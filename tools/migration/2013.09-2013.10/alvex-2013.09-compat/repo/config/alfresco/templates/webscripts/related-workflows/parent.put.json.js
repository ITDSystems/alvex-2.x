(function(){
	try {
		var workflowId = url.templateArgs['workflowId'];
		var taskId = decodeURIComponent( json.get('data').get('taskId') );

		// Get config node, create if it does not exist
		var confFolder = companyhome.childrenByXPath('/sys:system/sys:alvex/alvex:data/alvex:related-workflows')[0];
		var conf = confFolder.childByNamePath(workflowId);
		if(conf == null)
			conf = confFolder.createNode(workflowId,'alvexrwf:workflowDetails','sys:children');
		conf.properties['alvexrwf:parent'] = taskId;
		conf.save();

		status.code = 200;
	} catch (e) {
		status.code = 500;
		status.message = e.message;
		model.message = e.message;
	}
})();
