(function(){
	try{
		var unitId = url.templateArgs['id'];
		var destUnitId = url.templateArgs['dest'];
		var src = orgchart.getUnit( unitId );
		var dest = orgchart.getUnit( destUnitId );
		src.move( dest );
		status.code = 200;
	}
	catch (e) {
		status.code = 500;
		status.message = e.message;
		model.message = e.message;
	}
})();
