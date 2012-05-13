<import resource="classpath:alfresco/templates/orgstruct.lib.js">
<import resource="classpath:alfresco/templates/utils.lib.js">
// build organization structure
function buildTree(groupId, addMembers, addManagers, includeNodeRefs){
	// get group
	var groupInfo = OrgStruct.getGroupInfo(groupId);
	
	// response
	var resp = {
		id: groupInfo.id,
		name: groupInfo.name,
		children: []
	};

	// add members if needed
	if(addMembers) {
		resp.members = OrgStruct.getGroupMembersNames(groupId);
		if(includeNodeRefs)
			Utils.addUsersNodeRefs(resp.members);
	}
	
	// add managers if needed
	if(addManagers) {
		resp.managers = OrgStruct.getGroupManagersNames(groupId);
		if(includeNodeRefs)
			Utils.addUsersNodeRefs(resp.managers);
	}
	
	// recursively get info bout subgroups
	for each (x in OrgStruct.getGroupChilds(groupId))
		resp.children.push(buildTree(x.shortName, addMembers, addManagers, includeNodeRefs))
	
	return resp;
}

(function(){
	// retreive parameters
	var addMembers = args["addMembers"] == 'true';
	var addManagers = args["addManagers"] == 'true';
	var includeNodeRefs = args["includeNodeRefs"] == 'true';
	
	// build orgchart tree	
	try {
		model.data = buildTree(args['rootGroup'], addMembers, addManagers, includeNodeRefs);
		status.code = 200;
	} catch (e) {
		status.code = 500;
		status.message = e.message;
	}
})();
