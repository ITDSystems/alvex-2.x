<import resource="classpath:alfresco/templates/orgstruct.lib.js">
<import resource="classpath:alfresco/templates/utils.lib.js">
(function(){
	var includeNodeRefs = args["includeNodeRefs"] == 'true';
	// build response
	try {
		model.data = OrgStruct.getUserManageesNames(url.templateArgs["userId"])
		model.code = 200;
		if(includeNodeRefs)
			for each (group in model.data)
				Utils.addUsersNodeRefs(group.managees);
	} catch (e) {
		model.code = 500;
		model.message = e.message;
	}
})();
