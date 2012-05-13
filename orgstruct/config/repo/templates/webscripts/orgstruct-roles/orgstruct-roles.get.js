<import resource="classpath:alfresco/templates/orgstruct.lib.js">
<import resource="classpath:alfresco/templates/utils.lib.js">
(function()
{
	var includeNodeRefs = args["includeNodeRefs"] == 'true';
	// get group id
	try{
		var groupId = url.templateArgs['groupID'];
			
		// get roles
		model.data = OrgStruct.getGroupRolesNames(groupId);
		if(includeNodeRefs)
			Utils.addGroupsNodeRefs(model.data);
		model.code = 200;
	} catch(e){
		model.code = 500;
		model.message = e.message;
	}
})()
