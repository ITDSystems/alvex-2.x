<import resource="classpath:alfresco/templates/orgstruct.lib.js">
(function()
{
	// get group
	groupId = url.templateArgs['groupID'];
	
	try
	{
		// check input
		if (!json.has('data'))
			throw {message: 'No input data found'};
		
		// remove managers
		users = json.get('data');
		for (i = 0; i < users.length(); i++ )
			OrgStruct.removeGroupManager(groupId, users.getString(i));		
	}
	catch (ex)
	{
		model.code = 500;
		model.message = ex.message;
		return;
	}
	model.code = 200;
})();
