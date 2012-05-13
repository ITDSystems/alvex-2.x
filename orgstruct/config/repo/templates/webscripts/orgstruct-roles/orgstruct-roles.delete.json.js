<import resource="classpath:alfresco/templates/orgstruct.lib.js">
(function()
{
	// get group
	group = url.templateArgs['groupID'];
	
	try
	{
		// check input
		if (!json.has('data'))
			throw {message: 'No input data found'};
		
		// remove managers
		roles = json.get('data');
		for (i = 0; i < roles.length(); i++ )
			OrgStruct.removeGroupRole(group, roles.getString(i));
	}
	catch (ex)
	{
		model.code = 500;
		model.message = ex.message;
		return;
	}
	model.code = 200;
})();
