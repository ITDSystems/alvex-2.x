<import resource="classpath:alfresco/templates/orgstruct.lib.js">
(function()
{
	// get group
	group = url.templateArgs['groupID'];
	role = url.templateArgs['roleName'];
	
	try
	{
		// check input
		if (!json.has('data'))
			throw {message: 'No input data found'};
		
		// revoke roles
		users = json.get('data');
		for (i = 0; i < users.length(); i++ )
			OrgStruct.revokeRoleFromUser(group, role, users.getString(i));
	}
	catch (ex)
	{
		model.code = 500;
		model.message = ex.message;
		return;
	}
	model.code = 200;
})();
