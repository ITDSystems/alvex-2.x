(function(){
	try{
		model.roleInsts = [];
		var user = orgchart.getPerson( url.templateArgs['userName'] );
		for each ( unit in user.getUnits() )
		{
			var unitName = unit.getDisplayName();
			for each ( ri in user.getRoles( unit ) )
			{
				model.roleInsts.push( { 'unit':  unitName,
									'role': ri.getDefinition().getDisplayName() 
								} );
			}
		}
		status.code = 200;
	}
	catch (e) {
		status.code = 500;
		status.message = e.message;
		model.message = e.message;
	}
})();