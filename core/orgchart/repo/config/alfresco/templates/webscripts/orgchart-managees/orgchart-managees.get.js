function proceedUnit(unit, superviseRecursively)
{
	var result = [];
	for each( user in unit.members )
		result.push( user );
		
	if( superviseRecursively )
	{
		for each( subunit in unit.children )
		{
			for each( user in proceedUnit( subunit, superviseRecursively ) )
				result.push( user );
		}
	}
	
	return result;
}

(function() {
	try {
		var userName = url.templateArgs['userName'];
		
		// Get UI config node, create if it does not exist
		var confFolder = companyhome.childrenByXPath('/sys:system/sys:alvex/alvex:data/alvex:orgchart')[0];
		var conf = confFolder.childByNamePath('orgchart-view.default');
		if(conf == null)
		{
			var f = function() { conf = confFolder.createNode('orgchart-view.default','alvexoc:UIConfig','sys:children'); };
			sudoUtils.sudo(f);
		}
		
		var confValue = conf.properties['alvexoc:superviseUnitsRecursively'];
		// Protect from confValue == null on first access after Alvex upgrade
		var superviseRecursively = confValue ? confValue : false;
		
		var person = orgchart.getPerson(userName);
		
		model.managees = [];
		for each(u in person.getSupervisioningUnits() )
		{
			var res = proceedUnit( u, superviseRecursively );
			for each( r in res )
				model.managees.push( r );
		}
		
		status.code = 200;
	} catch (e) {
		status.code = 500;
		status.message = e.message;
		model.message = e.message;
	}
})();
