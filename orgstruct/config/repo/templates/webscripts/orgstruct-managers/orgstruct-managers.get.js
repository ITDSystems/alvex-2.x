<import resource="classpath:alfresco/templates/orgstruct.lib.js">
<import resource="classpath:alfresco/templates/utils.lib.js">
(function()
{
	var includeNodeRefs = args["includeNodeRefs"] == 'true';
	// get group id
	try{
		var groupId = url.templateArgs['groupID'];
			
		// get managers
		model.data = OrgStruct.getGroupManagersNames(groupId);
		if(includeNodeRefs)
			Utils.addUsersNodeRefs(model.data);
		model.code = 200;
	} catch(e){
		model.code = 500;
		model.message = e.message;
	}
})()
