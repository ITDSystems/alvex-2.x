<import resource="classpath:alfresco/templates/orgstruct.lib.js">
<import resource="classpath:alfresco/templates/utils.lib.js">

(function(){
	// retreive parameters
	var includeNodeRefs = args["includeNodeRefs"] == 'true';
	
	// build orgchart tree	
	try {
		model.data = OrgStruct.getViews();
		if (includeNodeRefs)
			Utils.addGroupsNodeRefs(model.data);
		model.code = 200;
	} catch (e) {
		model.code = 500;
		model.message = e.message;
	}
})();
