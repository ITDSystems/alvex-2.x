var Utils = {
	//adds nodeRefs to array of usernames
	addUsersNodeRefs: function (user_list) {
		for each (var user in user_list)
			user.nodeRef = people.getPerson( user.shortName ).getNodeRef().toString();
	},

	//adds nodeRefs to array of groups
	addGroupsNodeRefs: function (groups_list) {
		for each (var group in groups_list)
			group.nodeRef = groups.getGroup( group.shortName ).getGroupNodeRef().toString();
	}
};
