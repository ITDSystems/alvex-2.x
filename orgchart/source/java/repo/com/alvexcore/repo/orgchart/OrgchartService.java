/**
 * Copyright © 2012 ITD Systems
 *
 * This file is part of Alvex
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
package com.alvexcore.repo.orgchart;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.alfresco.model.ContentModel;
import org.alfresco.service.cmr.repository.AssociationRef;
import org.alfresco.service.cmr.repository.ChildAssociationRef;
import org.alfresco.service.cmr.repository.NodeRef;
import org.alfresco.service.cmr.repository.NodeService;
import org.alfresco.service.cmr.repository.StoreRef;
import org.alfresco.service.cmr.security.AuthorityService;
import org.alfresco.service.cmr.security.AuthorityType;
import org.alfresco.service.namespace.QName;
import org.alfresco.service.namespace.QNamePattern;
import org.alfresco.service.namespace.RegexQNamePattern;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.beans.factory.annotation.Required;

import com.alvexcore.repo.AlvexContentModel;
import com.alvexcore.repo.OrgchartExtension;

/**
 * Service to work with orgchart
 * @author Alexey Ermakov
 *
 */
public class OrgchartService implements InitializingBean {

	private static final QName NAME_ROLES = QName.createQName(
			AlvexContentModel.ALVEXOC_MODEL_URI, "roles");
	private static final QName NAME_BRANCHES = QName.createQName(
			AlvexContentModel.ALVEXOC_MODEL_URI, "branches");

	private NodeService nodeService;
	private AuthorityService authorityService;

	private NodeRef dataNode;
	private NodeRef rolesNode;
	private NodeRef branchesNode;

	/*
	 * Setters and getters 
	 */

	/**
	 * Returns node service
	 * @return NodeService instance
	 */
	public NodeService getNodeService() {
		return nodeService;
	}

	/**
	 * Returns authority service
	 * @return AuthorityService instance
	 */
	public AuthorityService getAuthorityService() {
		return authorityService;
	}

	/**
	 * Sets node service
	 * @param nodeService NodeService instance
	 */
	@Required
	public void setNodeService(NodeService nodeService) {
		this.nodeService = nodeService;
	}

	/**
	 * Sets authenication service
	 * @param authorityService Sets AuthorityService instance
	 */
	@Required
	public void setAuthorityService(AuthorityService authorityService) {
		this.authorityService = authorityService;
	}

	/*
	 * Startup functions
	 */

	@Override
	public void afterPropertiesSet() throws Exception {
		//
	}

	/**
	 * Sets up orgchart service
	 * @throws Exception
	 */
	public void setUp() throws Exception {
		dataNode = nodeService
				.getRootNode(StoreRef.STORE_REF_WORKSPACE_SPACESSTORE);
		for (int i = 0; i < OrgchartExtension.ORGCHART_STORAGE_PATH.length; i++) {
			List<ChildAssociationRef> assocs = nodeService.getChildAssocs(
					dataNode, ContentModel.ASSOC_CHILDREN,
					OrgchartExtension.ORGCHART_STORAGE_PATH[i]);
			if (assocs.size() != 1)
				throw new Exception("Cannot retreive orgchart data node");
			dataNode = assocs.get(0).getChildRef();
		}
		rolesNode = getFirstChild(dataNode, ContentModel.ASSOC_CHILDREN,
				NAME_ROLES);
		branchesNode = getFirstChild(dataNode, ContentModel.ASSOC_CHILDREN,
				NAME_BRANCHES);
	}

	/*
	 * Helpers
	 */

	/**
	 * Helper function to retrieve only first child association
	 * @param node Node to search associations for
	 * @param typeQNamePattern Pattern of association type 
	 * @param qnamePattern Pattern for association name
	 * @return Node or null if not found
	 * @throws Exception
	 */
	protected NodeRef getFirstChild(NodeRef node,
			QNamePattern typeQNamePattern, QNamePattern qnamePattern)
			throws Exception {
		List<ChildAssociationRef> assocs = nodeService.getChildAssocs(node,
				typeQNamePattern, qnamePattern);
		if (assocs.size() > 1)
			throw new Exception("There is more than one association in result");
		return assocs.size() == 1 ? assocs.get(0).getChildRef() : null;
	}

	/**
	 * Helper function to retrieve target of first association only
	 * @param node Node to search associations for
	 * @param typeQNamePattern Pattern of association type 
	 * @return Node or null if not found
	 * @throws Exception
	 */
	protected NodeRef getFirstTarget(NodeRef node, QNamePattern typeQNamePattern)
			throws Exception {
		// FIXME be careful with this call, since its arguments are unclear
		List<AssociationRef> assocs = nodeService.getTargetAssocs(node,
				typeQNamePattern);
		if (assocs.size() > 1)
			throw new Exception("There is more than one association in result");
		return assocs.size() == 1 ? assocs.get(0).getTargetRef() : null;
	}

	/**
	 * Helper function to get assoc qname by role name
	 * @param name Role name
	 * @return Assoc qname
	 */
	protected QName getRoleAssocQName(String name) {
		return QName.createQName(AlvexContentModel.ALVEXOC_MODEL_URI, name);
	}

	/**
	 * Helper function to get assoc qname by subunit name 
	 * @param name Member name
	 * @return Assoc qname
	 */
	protected QName getSubunutAssocQName(String name) {
		return QName.createQName(AlvexContentModel.ALVEXOC_MODEL_URI, name);
	}

	/**
	 * Creates orgchart unit as a child of node in repo specified by reference 
	 * @param parent Reference to parent node 
	 * @param name Name of the unit to create
	 * @param weight TODO
	 * @return New orgchart unit
	 * @throws Exception
	 */
	protected OrgchartUnit createUnit(NodeRef parent, String name,
			String displayName, int weight) throws Exception {
		String groupName = authorityService.createAuthority(
				AuthorityType.GROUP, displayName);
		NodeRef node = nodeService.createNode(parent,
				AlvexContentModel.ASSOC_SUBUNIT, getSubunutAssocQName(name),
				AlvexContentModel.TYPE_ORGCHART_UNIT).getChildRef();
		Map<QName, Serializable> props = new HashMap<QName, Serializable>();
		props.put(AlvexContentModel.PROP_GROUP_NAME, groupName);
		props.put(AlvexContentModel.PROP_UNIT_NAME, name == null ? node.getId()
				: name);
		props.put(AlvexContentModel.PROP_UNIT_DISPLAY_NAME, displayName == null ? node.getId()
				: displayName);
		props.put(AlvexContentModel.PROP_UNIT_WEIGHT, weight);
		nodeService.setProperties(node, props);
		// TODO add roles to unit
		return new OrgchartUnit(node, name, displayName, groupName, weight);
	}

	/**
	 * Returns orgchart unit by its node reference
	 * @param node Reference to unit's node
	 * @return Orgchart unit
	 * @throws Exception
	 */
	protected OrgchartUnit getUnitByRef(NodeRef node) throws Exception {
		Map<QName, Serializable> props = nodeService.getProperties(node);
		return new OrgchartUnit(node,
				(String) props.get(AlvexContentModel.PROP_UNIT_NAME),
				(String) props.get(AlvexContentModel.PROP_UNIT_DISPLAY_NAME),
				(String) props.get(AlvexContentModel.PROP_GROUP_NAME),
				(Integer) props.get(AlvexContentModel.PROP_UNIT_WEIGHT));
	}

	/**
	 * Helper function to get subunit by name
	 * @param parent Reference to node of parent orgchart unit
	 * @param name Name of the subunit
	 * @return Orgchart unit
	 * @throws Exception
	 */
	protected OrgchartUnit getSubunit(NodeRef parent, String name)
			throws Exception {
		NodeRef node = getFirstChild(parent, AlvexContentModel.ASSOC_SUBUNIT,
				getSubunutAssocQName(name));
		return getUnitByRef(node);
	}

	/**
	 * Helper function to check if subunit exists
	 * @param parent Reference to the node of parent orgchart unit
	 * @param name Subunit name
	 * @return True if unit exists and false otherwise
	 */
	protected boolean subunitExists(NodeRef parent, String name) {
		try {
			getSubunit(parent, name);
			return true;
		} catch (Exception e) {
			return false;
		}
	}

	/**
	 * Returns list of subunits 
	 * @param unit Reference to a node of the unit
	 * @return List of subunits
	 * @throws Exception
	 */
	protected List<OrgchartUnit> listSubunits(NodeRef unit) throws Exception {
		List<OrgchartUnit> result = new ArrayList<OrgchartUnit>();
		for (ChildAssociationRef assoc : nodeService.getChildAssocs(unit,
				AlvexContentModel.ASSOC_SUBUNIT, RegexQNamePattern.MATCH_ALL))
			result.add(getUnitByRef(assoc.getChildRef()));
		return result;
	}

	/**
	 * Helper function to get role definition by node reference
	 * @param node Reference to role definition node
	 * @return Role definition
	 * @throws Exception
	 */
	protected RoleDefinition getRoleDefinitionByRef(NodeRef node)
			throws Exception {
		Map<QName, Serializable> props = nodeService.getProperties(node);
		return new RoleDefinition(node,
				(Integer) props.get(AlvexContentModel.PROP_ROLE_WEIGHT),
				(String) props.get(AlvexContentModel.PROP_ROLE_NAME),
				(String) props.get(AlvexContentModel.PROP_ROLE_DISPLAY_NAME),
				(String) props.get(AlvexContentModel.PROP_ROLE_GROUP_NAME));
	}

	/**
	 * Helper function to get role instance by node reference
	 * @param node Reference to role instance node
	 * @return Role instance
	 * @throws Exception
	 */
	protected RoleInstance getRoleInstanceByRef(NodeRef node) throws Exception {
		return new RoleInstance(node, getFirstTarget(node,
				AlvexContentModel.ASSOC_ROLE_DEF));
	}

	protected OrgchartPerson getPersonByRef(NodeRef node) throws Exception {
		// FIXME this depends on Alfresco content model, not on API only
		return new OrgchartPerson(node, (String) nodeService.getProperty(node,
				ContentModel.PROP_USERNAME));
	}

	/*
	 * Base orgchart operations
	 */

	/**
	 * Checks if orgchart exists.
	 * @return True if orgchart initialized and false otherwise
	 */
	public boolean exists() {
		return rolesNode != null && branchesNode != null;
	}

	/**
	 * Initializes orgchart.
	 */
	public void init() throws Exception {
		// do nothing if orgchart already initialized
		if (exists())
			throw new Exception("Orgchart is already initialized");
		// get orgchart storage node

		// create nodes
		// create container for roles definitions
		rolesNode = nodeService.createNode(dataNode,
				ContentModel.ASSOC_CHILDREN, NAME_ROLES,
				ContentModel.TYPE_CONTAINER).getChildRef();
		// create container for orgchart branches
		branchesNode = nodeService.createNode(dataNode,
				ContentModel.ASSOC_CHILDREN, NAME_BRANCHES,
				AlvexContentModel.TYPE_ORGCHART_UNIT).getChildRef();
		// TODO create default roles
	}

	/**
	 * Drops orgchart completely
	 */
	public void drop() throws Exception {
		if (!exists())
			return;
		for (OrgchartUnit branch : listBranches())
			dropBranch(branch.getName());
		nodeService.deleteNode(branchesNode);
		nodeService.deleteNode(rolesNode);
		rolesNode = null;
		branchesNode = null;
	}

	/*
	 * Roles related orgchart operations
	 */

	/**
	 * Checks if specified role exists in orgchart
	 * @param name Name of the role
	 * @return True if role exists and null otherwise
	 * @throws Exception 
	 */
	public boolean roleExists(String name) {
		try {
			getRole(name);
			return true;
		} catch (Exception e) {
			return false;
		}
	}

	/**
	 * Creates new orgchart role
	 * @param name Role name
	 * @param weight Role weight
	 * @param groupShortName Group short name
	 * @param groupDisplayName Group display name
	 * @throws Exception
	 */
	public RoleDefinition createRole(String name, int weight, String displayName)
			throws Exception {
		if (roleExists(name))
			throw new Exception("Role already exists");
		String groupFullName = authorityService.createAuthority(
				AuthorityType.GROUP, displayName);
		Map<QName, Serializable> props = new HashMap<QName, Serializable>();
		props.put(AlvexContentModel.PROP_ROLE_NAME, name);
		props.put(AlvexContentModel.PROP_ROLE_DISPLAY_NAME, displayName);
		props.put(AlvexContentModel.PROP_ROLE_WEIGHT, weight);
		props.put(AlvexContentModel.PROP_ROLE_GROUP_NAME, groupFullName);
		return new RoleDefinition(nodeService.createNode(rolesNode,
				ContentModel.ASSOC_CHILDREN, getRoleAssocQName(name),
				AlvexContentModel.TYPE_ROLE_DEF, props).getChildRef(), weight,
				name, displayName, groupFullName);
	}

	/**
	 * Updates role definition
	 * @param name Role name
	 * @param weight New role weight or null
	 * @param displayName New role display name or null
	 * @return Update role definition
	 * @throws Exception
	 */

	public RoleDefinition modifyRole(String name, Integer weight,
			String displayName) throws Exception {
		NodeRef role = getFirstChild(rolesNode, ContentModel.ASSOC_CHILDREN,
				getRoleAssocQName(name));
		if (displayName != null)
			nodeService.setProperty(role,
					AlvexContentModel.PROP_ROLE_DISPLAY_NAME, displayName);
		if (weight != null)
			nodeService.setProperty(role, AlvexContentModel.PROP_ROLE_WEIGHT,
					weight.intValue());
		return getRoleDefinitionByRef(role);
	}

	/**
	 * Returns role definition for role instance
	 * @param role Role instance
	 * @return Role definition
	 * @throws Exception
	 */
	public RoleDefinition getDefinitionForRole(RoleInstance role)
			throws Exception {
		return getRoleDefinitionByRef(role.getDefinition());
	}

	/**
	 * Drops orgchart role
	 * @param name Name of the role to delete
	 */
	public void dropRole(String name) throws Exception {
		RoleDefinition role = getRole(name);
		for (OrgchartUnit unit : listUnitsWithRoleAdded(role))
			removeRole(unit, role);
		authorityService.deleteAuthority(role.getGroupName());
		nodeService.deleteNode(role.getNode());
	}

	/**
	 * Get role definition by name
	 * @param name Role name
	 * @return Role definition
	 * @throws Exception
	 */
	public RoleDefinition getRole(String name) throws Exception {
		return getRoleDefinitionByRef(getFirstChild(rolesNode,
				ContentModel.ASSOC_CHILDREN, getRoleAssocQName(name)));
	}

	/**
	 * Gets role definition by id
	 * @param id Role definition id
	 * @return Role definition
	 * @throws Exception
	 */
	public RoleDefinition getRoleById(String id) throws Exception {
		return getRoleDefinitionByRef(new NodeRef(
				StoreRef.STORE_REF_WORKSPACE_SPACESSTORE, id));
	}
	
	public List<RoleDefinition> listRoles() throws Exception {
		List<RoleDefinition> result = new ArrayList<RoleDefinition>();
		for (ChildAssociationRef assoc : nodeService.getChildAssocs(rolesNode,
				ContentModel.ASSOC_CHILDREN, RegexQNamePattern.MATCH_ALL))
			result.add(getRoleDefinitionByRef(assoc.getChildRef()));
		return result;
	}

	/**
	 * Adds role to orgchart unit
	 * @param unit Orgchart unit
	 * @param role Role definition
	 * @throws Exception
	 */
	public RoleInstance addRole(OrgchartUnit unit, RoleDefinition role)
			throws Exception {
		NodeRef node = nodeService.createNode(unit.getNode(),
				AlvexContentModel.ASSOC_ROLE,
				getRoleAssocQName(role.getName()),
				AlvexContentModel.TYPE_ROLE_INST).getChildRef();
		nodeService.createAssociation(node, role.getNode(), 
				AlvexContentModel.ASSOC_ROLE_DEF);
		return new RoleInstance(unit.getNode(), role.getNode());
	}

	/**
	 * Get role instance by orgchart unit and role definition
	 * @param unit Orgchart unit
	 * @param role Role definition
	 * @return Role instance
	 * @throws Exception
	 */
	public RoleInstance getRoleForUnit(OrgchartUnit unit, RoleDefinition role)
			throws Exception {
		return new RoleInstance(
				getFirstChild(unit.getNode(), AlvexContentModel.ASSOC_ROLE,
						getRoleAssocQName(role.getName())), role.getNode());
	}

	/**
	 * Checks if specified role added to unit
	 * @param unit Orgchart unit
	 * @param role Role definition
	 * @return True of role assigned to unit and false otherwise
	 */
	public boolean isRoleAddedToUnit(OrgchartUnit unit, RoleDefinition role) {
		try {
			getRoleForUnit(unit, role);
			return true;
		} catch (Exception e) {
			return false;
		}
	}

	/**
	 * Removes role from unit
	 * @param unit Orgchart unit
	 * @param role Role definition
	 * @throws Exception
	 */
	public void removeRole(OrgchartUnit unit, RoleDefinition role)
			throws Exception {
		RoleInstance roleInstance = getRoleForUnit(unit, role);
		for (OrgchartPerson person : listRoleAssignees(roleInstance))
			revokeRole(roleInstance, person);
		nodeService.deleteNode(roleInstance.getNode());
	}

	/**
	 * Assign role to a user
	 * @param role Role instance
	 * @param person Person
	 * @throws Exception
	 */
	public void assignRole(RoleInstance role, OrgchartPerson person)
			throws Exception {
		nodeService.createAssociation(role.getNode(), person.getNode(),
				AlvexContentModel.ASSOC_ROLE_MEMBER);
		String groupName = (String) nodeService.getProperty(
				role.getDefinition(), AlvexContentModel.PROP_ROLE_GROUP_NAME);
		authorityService.addAuthority(groupName, person.getName());
	}

	/**
	 * Revokes role from person
	 * @param role Role instance
	 * @param person Person
	 * @throws Exception
	 */
	public void revokeRole(RoleInstance role, OrgchartPerson person)
			throws Exception {
		nodeService.removeAssociation(role.getNode(), person.getNode(),
				AlvexContentModel.ASSOC_ROLE_MEMBER);
		String groupName = (String) nodeService.getProperty(
				role.getDefinition(), AlvexContentModel.PROP_ROLE_GROUP_NAME);
		authorityService.removeAuthority(groupName, person.getName());
	}

	/**
	 * Checks if role assigned to user
	 * @param role Role instance
	 * @param person Person
	 * @return True if role assigned and false otherwise
	 */
	public boolean isRoleAssigned(RoleInstance role, OrgchartPerson person) {
		for (AssociationRef assoc : nodeService.getTargetAssocs(role.getNode(),
				AlvexContentModel.ASSOC_ROLE_MEMBER))
			if (assoc.getTargetRef().equals(person.getNode()))
				return true;
		return false;
	}

	public List<OrgchartPerson> listRoleAssignees(RoleInstance role)
			throws Exception {
		List<OrgchartPerson> result = new ArrayList<OrgchartPerson>();
		// FIXME be careful with this call, since its arguments are unclear
		for (AssociationRef assoc : nodeService.getTargetAssocs(role.getNode(),
				AlvexContentModel.ASSOC_ROLE_MEMBER))
			result.add(getPersonByRef(assoc.getTargetRef()));
		return result;
	}

	/**
	 * Lists all orgchart unit roles
	 * @param unit Orgchart unit
	 * @return List of orgchart unit roles
	 * @throws Exception
	 */
	public List<RoleInstance> listRolesForUnit(OrgchartUnit unit)
			throws Exception {
		List<RoleInstance> result = new ArrayList<RoleInstance>();
		for (ChildAssociationRef assoc : nodeService.getChildAssocs(
				unit.getNode(), AlvexContentModel.ASSOC_ROLE,
				RegexQNamePattern.MATCH_ALL))
			result.add(getRoleInstanceByRef(assoc.getChildRef()));
		return result;
	}

	/**
	 * Lists all orgchart units with role assigned to
	 * @param role Role definition
	 * @return List of orgchart units
	 * @throws Exception
	 */
	public List<OrgchartUnit> listUnitsWithRoleAdded(RoleDefinition role)
			throws Exception {
		List<OrgchartUnit> result = new ArrayList<OrgchartUnit>();
		for (AssociationRef assoc : nodeService.getSourceAssocs(role.getNode(),
				AlvexContentModel.ASSOC_ROLE_DEF))
			result.add(getUnitByRef(nodeService.getPrimaryParent(
					assoc.getSourceRef()).getChildRef()));
		return result;
	}

	/**
	 * Get all person roles in orgchart unit
	 * @param unit Orgchart unit
	 * @param person Person
	 * @return List of role definitions
	 * @throws Exception
	 */
	public List<RoleDefinition> getRolesForPerson(OrgchartUnit unit,
			OrgchartPerson person) throws Exception {
		List<RoleDefinition> result = new ArrayList<RoleDefinition>();
		for (RoleInstance role : listRolesForUnit(unit))
			for (OrgchartPerson assignee : listRoleAssignees(role))
				if (assignee.getNode().equals(person.getNode())) {
					result.add(getRoleDefinitionByRef(role.getDefinition()));
					break;
				}
		return result;
	}

	/*
	 * Orgchart branches related operations
	 */
	/**
	 * Returns branch by name
	 * @param name Name of the branch
	 * @return Orgchart unit corresponding to the branch
	 * @throws Exception
	 */
	public OrgchartUnit getBranch(String name) throws Exception {
		return getSubunit(branchesNode, name);
	}

	/**
	 * Checks if orgchart branch exists or not
	 * @param name Branch name
	 * @return True if branch exists and false otherwise
	 */
	public boolean branchExists(String name) {
		return subunitExists(branchesNode, name);
	}

	/**
	 * Creates new orgchart branch
	 * @param name Branch name
	 * @param group Name of the group for branch
	 * @return Orgchart unit for new branch
	 * @throws Exception
	 */
	public OrgchartUnit createBranch(String name, String displayName)
			throws Exception {
		if (branchExists(name))
			throw new Exception("Branch already exists");
		return createUnit(branchesNode, name, displayName, 0);
	}

	/**
	 * Drops orgchart branch
	 * @param name Name of the branch
	 * @throws Exception
	 */
	public void dropBranch(String name) throws Exception {
		dropUnit(getBranch(name));
	}

	/**
	 * Lists orgchart branches
	 * @return List of orgchart branches
	 * @throws Exception
	 */
	public List<OrgchartUnit> listBranches() throws Exception {
		return listSubunits(branchesNode);
	}

	/*
	 * Orgchart unit related operations
	 */

	/**
	 * Creates new orgchart unit
	 * @param parent Parent orgchart unit
	 * @param name Name of the unit to create
	 * @param weight TODO
	 * @return New unit
	 * @throws Exception
	 */
	public OrgchartUnit createUnit(OrgchartUnit parent, String name,
			String displayName, int weight) throws Exception {
		return createUnit(parent.getNode(), name, displayName, weight);
	}

	/**
	 * Drops orgchart unit
	 * @param unit Orgcahrt unit to delete
	 * @throws Exception
	 */
	public void dropUnit(OrgchartUnit unit) throws Exception {
		authorityService.deleteAuthority(unit.getGroupName());
		for (RoleInstance role : listRolesForUnit(unit))
			removeRole(unit, getRoleDefinitionByRef(role.getNode()));
		nodeService.deleteNode(unit.getNode());
	}

	/**
	 * Updates orgchart unit
	 * @param unit Orgchart unit
	 * @param displayName New display name or null
	 * @param weight New weight or null
	 * @return Orgchart unit
	 * @throws Exception
	 */
	public OrgchartUnit modifyUnit(OrgchartUnit unit, String displayName,
			Integer weight) throws Exception {
		if (displayName != null)
			nodeService.setProperty(unit.getNode(),
					AlvexContentModel.PROP_UNIT_DISPLAY_NAME, displayName);
		if (weight != null)
			nodeService.setProperty(unit.getNode(),
					AlvexContentModel.PROP_UNIT_WEIGHT, (int) weight);
		return getUnitByRef(unit.getNode());
	}

	/**
	 * Returns subunit by name
	 * @param parent Parent irgchart unit
	 * @param name Name of the subunit to retrieve
	 * @return Orgchart unit
	 * @throws Exception
	 */
	public OrgchartUnit getSubunit(OrgchartUnit parent, String name)
			throws Exception {
		return getSubunit(parent.getNode(), name);
	}

	/**
	 * Checks if orgchart subunit exists
	 * @param parent Parent orgchart unit
	 * @param name Name of the subunit
	 * @return True if unit exists and false otherwise
	 */
	public boolean subunitExists(OrgchartUnit parent, String name) {
		return subunitExists(parent.getNode(), name);
	}

	/**
	 * Gets unit by id
	 * @param id Orgchart unit id
	 * @return Orgchart unit
	 * @throws Exception
	 */
	public OrgchartUnit getUnitById(String id) throws Exception {
		return getUnitByRef(new NodeRef(
				StoreRef.STORE_REF_WORKSPACE_SPACESSTORE, id));

	}

	/**
	 * Lists orgchart unit subunits
	 * @param unit Orgchart unit
	 * @return List of subunits
	 * @throws Exception
	 */
	public List<OrgchartUnit> listSubunits(OrgchartUnit unit) throws Exception {
		return listSubunits(unit.getNode());
	}

	/**
	 * Get parent orgchart unit 
	 * @param unit Orgchart unit
	 * @return Parent orgchart unit or null if there's no parent
	 * @throws Exception
	 */
	public OrgchartUnit getParentUnit(OrgchartUnit unit) throws Exception {
		NodeRef node = nodeService.getPrimaryParent(unit.getNode())
				.getParentRef();
		return node.equals(branchesNode) ? null : getUnitByRef(node);
	}

	/*
	 * Orgchart membership related operations
	 */

	/**
	 * Gets orgchart person by name
	 * @param name Person name
	 * @return Orgchart person
	 * @throws Exception
	 */
	public OrgchartPerson getPerson(String name) throws Exception {
		return getPersonByRef(authorityService
				.getAuthorityNodeRef(authorityService.getName(
						AuthorityType.USER, name)));
	}

	/**
	 * Adds person to unit as member
	 * @param unit Orgchart unit
	 * @param person Orgchart person
	 * @throws Exception
	 */
	public void addMemeber(OrgchartUnit unit, OrgchartPerson person)
			throws Exception {
		nodeService.createAssociation(unit.getNode(), person.getNode(),
				AlvexContentModel.ASSOC_MEMBER);
		authorityService.addAuthority(unit.getGroupName(), person.getName());
	}

	/**
	 * Removes person from unit
	 * @param unit Orgchart unit
	 * @param person Person
	 * @throws Exception
	 */
	public void removeMember(OrgchartUnit unit, OrgchartPerson person)
			throws Exception {
		nodeService.removeAssociation(unit.getNode(), person.getNode(),
				AlvexContentModel.ASSOC_MEMBER);
		authorityService.removeAuthority(unit.getGroupName(),
				person.getName());
	}

	/**
	 * Checks if person is a member of unit
	 * @param unit Orgchart unit
	 * @param person Person
	 * @return True if person is a member of unit and false otherwise
	 */
	public boolean isMember(OrgchartUnit unit, OrgchartPerson person) {
		for (AssociationRef assoc : nodeService.getTargetAssocs(unit.getNode(),
				AlvexContentModel.ASSOC_MEMBER))
			if (assoc.getTargetRef().equals(person.getNode()))
				return true;
		return false;
	}

	/**
	 * Lists members of orgchart unit
	 * @param unit Orgchart unit
	 * @return List of orgchart persons
	 * @throws Exception
	 */
	public List<OrgchartPerson> listMembers(OrgchartUnit unit) throws Exception {
		List<OrgchartPerson> result = new ArrayList<OrgchartPerson>();
		for (AssociationRef assoc : nodeService.getTargetAssocs(unit.getNode(),
				AlvexContentModel.ASSOC_MEMBER))
			result.add(getPersonByRef(assoc.getTargetRef()));
		return result;
	}

	/**
	 * Get all units where person has membership
	 * @param person Person
	 * @return List of orgchart units
	 * @throws Exception
	 */
	public List<OrgchartUnit> getUnitsForPerson(OrgchartPerson person)
			throws Exception {
		List<OrgchartUnit> result = new ArrayList<OrgchartUnit>();
		for (AssociationRef assoc : nodeService.getSourceAssocs(
				person.getNode(), AlvexContentModel.ASSOC_MEMBER))
			result.add(getUnitByRef(assoc.getSourceRef()));
		return result;
	}

	/*
	 * Orgchart supervisor/admin related operations
	 */

	/**
	 * Adds person to unit as supervisor
	 * @param unit Orgchart unit
	 * @param person Orgchart person
	 * @throws Exception
	 */
	public void addSupervisor(OrgchartUnit unit, OrgchartPerson person)
			throws Exception {
		nodeService.createAssociation(unit.getNode(), person.getNode(),
				AlvexContentModel.ASSOC_SUPERVISOR);
	}

	/**
	 * Removes supervisor from unit
	 * @param unit Orgchart unit
	 * @param person Person
	 * @throws Exception
	 */
	public void removeSupervisor(OrgchartUnit unit, OrgchartPerson person)
			throws Exception {
		nodeService.removeAssociation(unit.getNode(), person.getNode(),
				AlvexContentModel.ASSOC_SUPERVISOR);
	}

	/**
	 * Checks if person is a supervisor of unit
	 * @param unit Orgchart unit
	 * @param person Person
	 * @return True if person is a supervisor of unit and false otherwise
	 */
	public boolean isSupervisor(OrgchartUnit unit, OrgchartPerson person) {
		for (AssociationRef assoc : nodeService.getTargetAssocs(unit.getNode(),
				AlvexContentModel.ASSOC_SUPERVISOR))
			if (assoc.getTargetRef().equals(person.getNode()))
				return true;
		return false;
	}

	/**
	 * Lists supervisors of orgchart unit
	 * @param unit Orgchart unit
	 * @return List of orgchart persons
	 * @throws Exception
	 */
	public List<OrgchartPerson> listSupervisors(OrgchartUnit unit)
			throws Exception {
		List<OrgchartPerson> result = new ArrayList<OrgchartPerson>();
		for (AssociationRef assoc : nodeService.getTargetAssocs(unit.getNode(),
				AlvexContentModel.ASSOC_SUPERVISOR))
			result.add(getPersonByRef(assoc.getTargetRef()));
		return result;
	}

	/**
	 * Get all units where person is supervisor
	 * @param person Person
	 * @return List of orgchart units
	 * @throws Exception
	 */
	public List<OrgchartUnit> getSupervisioningUnitsForPerson(
			OrgchartPerson person) throws Exception {
		List<OrgchartUnit> result = new ArrayList<OrgchartUnit>();
		for (AssociationRef assoc : nodeService.getSourceAssocs(
				person.getNode(), AlvexContentModel.ASSOC_SUPERVISOR))
			result.add(getUnitByRef(assoc.getSourceRef()));
		return result;
	}

	/**
	 * Adds person to unit as admin
	 * @param unit Orgchart unit
	 * @param person Orgchart person
	 * @throws Exception
	 */
	public void addAdmin(OrgchartUnit unit, OrgchartPerson person)
			throws Exception {
		nodeService.createAssociation(unit.getNode(), person.getNode(),
				AlvexContentModel.ASSOC_ADMIN);
	}

	/**
	 * Removes admin from unit
	 * @param unit Orgchart unit
	 * @param person Person
	 * @throws Exception
	 */
	public void removeAdmin(OrgchartUnit unit, OrgchartPerson person)
			throws Exception {
		nodeService.removeAssociation(unit.getNode(), person.getNode(),
				AlvexContentModel.ASSOC_ADMIN);
	}

	/**
	 * Checks if person is an admin of unit
	 * @param unit Orgchart unit
	 * @param person Person
	 * @return True if person is an admin of unit and false otherwise
	 */
	public boolean isAdmin(OrgchartUnit unit, OrgchartPerson person) {
		for (AssociationRef assoc : nodeService.getTargetAssocs(unit.getNode(),
				AlvexContentModel.ASSOC_ADMIN))
			if (assoc.getTargetRef().equals(person.getNode()))
				return true;
		return false;
	}

	/**
	 * Lists admins of orgchart unit
	 * @param unit Orgchart unit
	 * @return List of orgchart persons
	 * @throws Exception
	 */
	public List<OrgchartPerson> listAdmins(OrgchartUnit unit) throws Exception {
		List<OrgchartPerson> result = new ArrayList<OrgchartPerson>();
		for (AssociationRef assoc : nodeService.getTargetAssocs(unit.getNode(),
				AlvexContentModel.ASSOC_ADMIN))
			result.add(getPersonByRef(assoc.getTargetRef()));
		return result;
	}

	/**
	 * Get all units where person is supervisor
	 * @param person Person
	 * @return List of orgchart units
	 * @throws Exception
	 */
	public List<OrgchartUnit> getAdminingUnitsForPerson(OrgchartPerson person)
			throws Exception {
		List<OrgchartUnit> result = new ArrayList<OrgchartUnit>();
		for (AssociationRef assoc : nodeService.getSourceAssocs(
				person.getNode(), AlvexContentModel.ASSOC_ADMIN))
			result.add(getUnitByRef(assoc.getSourceRef()));
		return result;
	}

	/*
	 * Orgchart delegations related operations
	 */

	/**
	 * Sets out-of-office flag for person
	 * @param person Person
	 * @param value Flag value
	 * @throws Exception
	 */
	public void setOutOfOffice(OrgchartPerson person, boolean value)
			throws Exception {
		if (!nodeService.hasAspect(person.getNode(),
				AlvexContentModel.ASPECT_ORGCHART_MEMBER))
			throw new Exception("Person has no aspect assigned");
		nodeService.setProperty(person.getNode(),
				AlvexContentModel.PROP_OUT_OF_OFFICE, value);
	}

	/**
	 * Gets out-of-office flag for person
	 * @param person Person
	 * @return Out-of-office flag value
	 * @throws Exception
	 */
	public boolean getOutOfOffice(OrgchartPerson person) throws Exception {
		if (!nodeService.hasAspect(person.getNode(),
				AlvexContentModel.ASPECT_ORGCHART_MEMBER))
			throw new Exception("Person has no aspect assigned");
		return (Boolean) nodeService.getProperty(person.getNode(),
				AlvexContentModel.PROP_OUT_OF_OFFICE);
	}
}