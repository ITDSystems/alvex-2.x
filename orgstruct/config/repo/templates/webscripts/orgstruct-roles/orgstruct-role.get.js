<import resource="classpath:alfresco/templates/orgstruct.lib.js">
<import resource="classpath:alfresco/templates/utils.lib.js">
(function()
{
	var includeNodeRefs = args["includeNodeRefs"] == 'true';
	var groupId = url.templateArgs['groupID'];
	var roleName = url.templateArgs['roleName'];

	// get group id
	try{
		// get users
		model.data = OrgStruct.getUsersRoleAssignedTo(groupId, roleName);
		if(includeNodeRefs)
			Utils.addUsersNodeRefs(model.data);
		model.code = 200;
	} catch(e){
		model.code = 500;
		model.message = e.message;
	}
})()
