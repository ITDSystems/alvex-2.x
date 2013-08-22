(function() {
	try {
		var dlRef = json.get('register');
		var number = json.get('number');
		var prop = json.get('prop').replace('_',':');
		
		var dl = search.findNode(dlRef);
		
		var correct = true;
		
		for each (item in dl.children)
			if(item.properties[prop] == number)
				correct = false;
			
		model.correct = correct.toString();
		
		if(correct)
		{
			dl.properties["alvexdr:inc"]++;
			dl.save();
		}
		
		status.code = 200;
	} catch (e) {
		status.code = 500;
		status.message = e.message;
		model.message = e.message;
	}
})();
