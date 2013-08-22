(function (){
	model.js = null;
	try {
		var connector = remote.connect('alvexupdate');
		var resp = 	connector.get('/js');
		model.js = extensionRegistry.removeSignature(resp);
		if (!model.js)
			status.code = 500;
	} catch (e) {
		status.code = 500;
	}
})();
