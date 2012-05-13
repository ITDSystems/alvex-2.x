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
			
		// add roles
		var roles = json.get('data');
		for (i = 0; i < roles.length(); i++ )
			OrgStruct.addGroupRole(groupId, roles.get(i).get("name").toString(), roles.get(i).get("description").toString());
		model.code = 200;
	}
	catch (ex)
	{
		model.code = 500;
		model.message = ex.message;
	}
})();
