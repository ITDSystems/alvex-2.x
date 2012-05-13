// object to manage orgstruct
var OrgStruct = {
	// id of the root group
	ROOT_GROUP_ID: '__orgstruct__',

	// returns info for group specified by id
	getGroupInfo: function (groupId) {
		if (!(group = groups.getGroup(groupId)))
			throw {message: "Group doesn't exist"};
		return {id: group.getShortName(), name: group.getDisplayName()};
	},
	
	// returns subgroups of the group specified by id
	getGroupChilds: function (groupId) {
		var group = null;
		if (!(group = groups.getGroup(groupId)))
			throw {message: "Group doesn't exist"};
		var resp = [];
		for each (var x in group.getChildGroups())
			if (x.getDisplayName().indexOf('__') != 0)
				resp.push({
					'shortName': x.getShortName(),
					'displayName': x.getDisplayName()
				});
		return resp;
	},

	// returns group members
	getGroupMembers: function (groupId) {
		// get group by id and then return list of all its members
		var group = null;
		if (!(group = groups.getGroup(groupId)))
			throw {message: "Group " + groupId + " doesn't exist"};
		return group.getChildUsers();
	},
		
	// returns group members names
	getGroupMembersNames: function (groupId) {
		// return list of all its members names
		var result = [];
		for each (var user in this.getGroupMembers(groupId)) {
			var shortName = user.getShortName();
			var node = people.getPerson( shortName );
			var name = (node.properties.lastName ? node.properties.lastName + ", " : "")
					+ (node.properties.firstName ? node.properties.firstName : "");
			result.push( {'shortName': shortName, 'name': name} );
		}
		return result;
	},
		
	// returns group managers
	getGroupManagers: function (groupId) {
		// get group by id
		var group = null;
		if (!(group = groups.getGroup(groupId)))
			throw {message: "Group doesn't exist"};

		// find managers group
		for each (var gr in group.getChildGroups())
			if (gr.getDisplayName() == '__managers__')
				return gr.getChildUsers();
		return null;
	},
	
	// returns group managers names
	getGroupManagersNames: function (groupId) {
		// return list of all its managers names
		var result = [];
		for each (var user in this.getGroupManagers(groupId)) {
			var shortName = user.getShortName();
			var node = people.getPerson( shortName );
			var name = (node.properties.lastName ? node.properties.lastName + ", " : "")
					+ (node.properties.firstName ? node.properties.firstName : "");
			result.push( {'shortName': shortName, 'name': name} );
		}
		return result;
	},
	
	// adds group as child of existent one
	addGroup: function (groupId, groupName, parentId) {
		// check groups ids
		if (groupId.match(/[^a-zA-z_0-9.]/))
			throw {message: 'Invalid group Id.'};
		if (parentId && parentId.match(/[^a-zA-z_0-9.]/))
			throw {message: 'Invalid parent group Id.'};
		// get parent group
		var parentGroup = null;
		if (parentId && !(parentGroup = groups.getGroup(parentId)))
			throw {message: "Parent group doesn't exist."};
		if (!parentId && !(parentGroup = groups.getGroup(OrgStruct.ROOT_GROUP_ID)))
			throw {message: "OrgStruct is not initialiazed yet."};
	
			
		// create group or skip if exists
		if (groups.getGroup(groupId))
			return;
		var newGroup = parentGroup.createGroup(groupId, groupName);
	                   
	    newGroup.createGroup(groupId+'.__managers__', '__managers__');
	    newGroup.createGroup(groupId+'.__roles__', '__roles__');
	},
	
	// adds user to group managers
	addGroupManager: function (groupId, userId) {
		// get group by id
		var group = null;
		if (!(group = groups.getGroup(groupId+'.__managers__')))
			throw {message: "Managers group doesn't exist"};
		// add manager
		group.addAuthority(userId);
	},
	
	// adds user to group
	addGroupMember: function (groupId, userId) {
		// get group by id
		var group = null;
		if (!(group = groups.getGroup(groupId)))
			throw {message: "Group doesn't exist"};
		// add manager
		group.addAuthority(userId);
	},		
	
	// removes user from group
	removeGroupMember: function (groupId, userId) {
		// get group by id
		var group = null;
		if (!(group = groups.getGroup(groupId)))
			throw {message: "Group doesn't exist"};
		// add manager
		group.removeUser(userId);
	},
	
	// removes user from group managers
	removeGroupManager: function (groupId, userId) {
		// get group by id
		var group = null;
		if (!(group = groups.getGroup(groupId+'.__managers__')))
			throw {message: "Managers group doesn't exist"};
		// add manager
		group.removeUser(userId);
	},
	
	// returns managees for user specified by id
	getUserManagees: function (userId) {
		// try to get user
		var user = null;
		if (!(user = people.getPerson(userId)))
			throw {message: "User cannot be found"};
		
		// get user's groups
		var gr = [];
		for each(x in people.getContainerGroups(user))
			gr.push(groups.getGroup(x.properties['cm:authorityName'].replace(/^GROUP_/, '')));
		// iterate through groups and find manageable groups
		var result = [];
		for each(var group in gr)
			if (group.getDisplayName() == '__managers__')
			{
				// get all manageable users
				var parentGroups = group.getParentGroups();
				for each(var pg in parentGroups)
					result.push({ 'group': pg.getShortName(),
                                  'managees': OrgStruct.getGroupMembers(pg.getShortName())});
			}
		
		return result;
	},

	// returns managees names for user specified by id
	getUserManageesNames: function (userId) {
		// get managees
		var managees = OrgStruct.getUserManagees(userId);
		var result = [];
		for each (var item in managees)
		{
			var z = [];
			for each (user in item.managees) {
				var shortName = user.getShortName();
				var node = people.getPerson( shortName );
				var name = (node.properties.lastName ? node.properties.lastName + ", " : "")
						+ (node.properties.firstName ? node.properties.firstName : "");
				z.push( {'shortName': shortName, 'name': name} );
			}
			result.push({'group': item.group, 'managees': z})
		}
		return result;
	},

	// returns list of group roles
	getGroupRolesNames: function (groupId) {
		var group = groups.getGroup(groupId+'.__roles__');
		if (group == null) 
			throw {message: 'Cannot retrieve roles for specified group.'};
		var res = [];
		for each(gr in group.getChildGroups())
			res.push({
				'shortName': gr.getShortName(),
				'roleName': gr.getShortName().replace(groupId+'.__roles__.',''),
				'roleDesc': gr.getDisplayName()
			});
		return res;
	},

	// removes role from group
	revomeGroupRole: function (groupId, roleName) {
		var roles = groups.getGroup(groupId+'.__roles__')
		if (roles == null)
			throw {message: 'Cannot retrieve group roles.'};
		for each(role in roles.getChildGroups())
			if (role.getShortName() == groupId+'.__roles__.'+roleName)
				role.deleteGroup();
	},

	// adds new group role
	addGroupRole: function (groupId, roleName, roleDescription) {
		var roles = groups.getGroup(groupId+'.__roles__')
		if (roles == null)
			throw {message: 'Cannot retrieve group roles.'};
		if (groups.getGroup(groupId+'.__roles__'+roleName))
			return;
		roles.createGroup(groupId+'.__roles__.'+roleName, roleDescription);
	},

	// revokes role from user
	revokeRoleFromUser: function (groupId, roleName, userName) {
		OrgStruct.removeGroupMember(groupId+'.__roles__.'+roleName, userName);
	},

	// returns users the role is assigned to
	getUsersRoleAssignedTo: function (groupId, roleName) {
		return OrgStruct.getGroupMembersNames(groupId+'.__roles__.'+roleName);
	}, 

	// assigns role to user
	assignRoleTo: function (groupId, roleName, userName) {
		OrgStruct.addGroupMember(groupId+'.__roles__.'+roleName, userName);
	},

	getViews: function () {
		return OrgStruct.getGroupChilds(OrgStruct.ROOT_GROUP_ID);
	},

	init: function () {
		if (!groups.getGroup(OrgStruct.ROOT_GROUP_ID))
			groups.createRootGroup(OrgStruct.ROOT_GROUP_ID, 'Org. structure root group');
	}
	
};
