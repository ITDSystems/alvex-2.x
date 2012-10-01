(function(){
	try{
		var unitId = url.templateArgs['id'];
		orgchart.dropUnit(unitId);
		status.code = 200;
	}
	catch (e) {
		status.code = 500;
		status.message = e.message;
		model.message = e.message;
	}
})();