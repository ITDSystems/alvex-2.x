<import resource="classpath:alfresco/templates/orgstruct.lib.js">

(function()
{
	// get group id
	try
	{
		var groupId = url.templateArgs['groupID'];

		// check input
		if (!json.has('data'))
			throw {message: 'No input data found'};
			
		// add managers
		var users = json.get('data');
		for (i = 0; i < users.length(); i++ )
			OrgStruct.addGroupManager(groupId, users.getString(i));
		model.code = 200;
	}
	catch (ex)
	{
		model.code = 500;
		model.message = ex.message;
	}
})();
