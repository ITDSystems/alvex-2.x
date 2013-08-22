(function(){
	try{
		model.roleInsts = [];
		var user = orgchart.getPerson( url.templateArgs['userName'] );
		for each ( unit in user.getUnits() )
		{
			var unitName = unit.getDisplayName();
			var id = unit.getId();
			if( user.getRoles( unit ).length > 0 )
			{
				for each ( ri in user.getRoles( unit ) )
				{
					model.roleInsts.push( { 'unit':  unitName, 'id': id, 
								'role': ri.getDefinition().getDisplayName() } );
				}
			} else {
				model.roleInsts.push( { 'unit': unitName, 'id': id, 'role': '' } );
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
