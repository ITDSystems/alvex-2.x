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
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.alfresco.error.AlfrescoRuntimeException;
import org.alfresco.model.ContentModel;
import org.alfresco.service.ServiceRegistry;
import org.alfresco.service.cmr.repository.AssociationRef;
import org.alfresco.service.cmr.repository.ChildAssociationRef;
import org.alfresco.service.cmr.repository.NodeRef;
import org.alfresco.service.cmr.repository.NodeService;
import org.alfresco.service.cmr.repository.StoreRef;
import org.alfresco.service.cmr.security.AuthorityService;
import org.alfresco.service.cmr.security.AuthorityType;
import org.alfresco.service.cmr.security.PermissionService;
import org.alfresco.repo.security.authentication.AuthenticationUtil;
import org.alfresco.repo.security.authentication.AuthenticationUtil.RunAsWork;
import org.alfresco.service.namespace.QName;
import org.alfresco.service.namespace.QNamePattern;
import org.alfresco.service.namespace.RegexQNamePattern;
import org.alfresco.service.namespace.NamespaceService;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.beans.factory.annotation.Required;

import com.alvexcore.repo.AlvexContentModel;
import com.alvexcore.repo.ExtensionAware;
import com.alvexcore.repo.OrgchartExtension;
import com.alvexcore.repo.RepositoryExtension;

/**
 * Service to work with orgchart
 *
 */

class MakeOrgchartMember implements RunAsWork<Void> {

	private NodeService nodeService;
	private OrgchartPerson person;

	public MakeOrgchartMember(NodeService nodeService, OrgchartPerson person) {
		this.nodeService = nodeService;
		this.person = person;
	}

	@Override
	public Void doWork() throws Exception {
		nodeService.addAspect(person.getNode(),
				AlvexContentModel.ASPECT_ORGCHART_MEMBER, null);
		return null;
	}

}

public class OrgchartServiceImplCE implements InitializingBean, OrgchartService, ExtensionAware {

	protected static final QName NAME_ROLES = QName.createQName(
			AlvexContentModel.ALVEXOC_MODEL_URI, "roles");
	protected static final QName NAME_BRANCHES = QName.createQName(
			AlvexContentModel.ALVEXOC_MODEL_URI, "branches");
	private static final String ID_BRANCHES_NODE = "branchesNode";
	private static final String ID_ROLES_NODE = "rolesNode";
	protected static final String UI_CONFIG_FILE_NAME = "orgchart-view.default";
	protected static final String SYNC_CONFIG_FILE_NAME = "orgchart-sync.default";
	protected static final QName NAME_UI_CONFIG = QName.createQName(
			NamespaceService.CONTENT_MODEL_1_0_URI, UI_CONFIG_FILE_NAME);
	protected static final QName NAME_SYNC_CONFIG = QName.createQName(
			NamespaceService.CONTENT_MODEL_1_0_URI, SYNC_CONFIG_FILE_NAME);

	protected NodeService nodeService;
	protected AuthorityService authorityService;
	protected PermissionService permissionService;
	protected ServiceRegistry serviceRegistry;
	
	protected RepositoryExtension extension;
	
	/* (non-Javadoc)
	 * @see com.alvexcore.repo.orgchart.OrgchartServiceX#getServiceRegistry()
	 */
	@Override
	public ServiceRegistry getServiceRegistry() {
		return serviceRegistry;
	}

	/**
	 * Sets service registry
	 * @param serviceRegistry ServiceRegistry instance
	 */
	@Required
	public void setServiceRegistry(ServiceRegistry serviceRegistry) {
		this.serviceRegistry = serviceRegistry;
	}

	/* (non-Javadoc)
	 * @see com.alvexcore.repo.orgchart.OrgchartServiceX#getNodeService()
	 */
	@Override
	public NodeService getNodeService() {
		return nodeService;
	}

	/* (non-Javadoc)
	 * @see com.alvexcore.repo.orgchart.OrgchartServiceX#getAuthorityService()
	 */
	@Override
	public AuthorityService getAuthorityService() {
		return authorityService;
	}

	/* (non-Javadoc)
	 * @see com.alvexcore.repo.orgchart.OrgchartServiceX#getPermissionService()
	 */
	@Override
	public PermissionService getPermissionService() {
		return permissionService;
	}

	/*
	 * Startup functions
	 */

	@Override
	public void afterPropertiesSet() throws Exception {
		nodeService = serviceRegistry.getNodeService();
		authorityService = serviceRegistry.getAuthorityService();
		permissionService = serviceRegistry.getPermissionService();
	}

	/* (non-Javadoc)
	 * @see com.alvexcore.repo.orgchart.OrgchartServiceX#setUp()
	 */
	@Override
	public void setUp() throws Exception {
		if (getDataNode() == null)
			throw new Exception("Cannot retreive orgchart data node");
		setRolesNode(getFirstChild(getDataNode(), ContentModel.ASSOC_CHILDREN,
				NAME_ROLES));
		setBranchesNode(getFirstChild(getDataNode(), ContentModel.ASSOC_CHILDREN,
				NAME_BRANCHES));
		// FIXME - return this functionality back
		/*if( getFirstChild(dataNode, ContentModel.ASSOC_CHILDREN, NAME_UI_CONFIG) == null )
		{
			Map<QName, Serializable> props = new HashMap<QName, Serializable>(1);
			props.put(ContentModel.PROP_NAME, UI_CONFIG_FILE_NAME);
			nodeService.createNode(dataNode,
				ContentModel.ASSOC_CHILDREN, NAME_UI_CONFIG,
				AlvexContentModel.TYPE_ORGCHART_UI_CONFIG, props);
		}
		if( getFirstChild(dataNode, ContentModel.ASSOC_CHILDREN, NAME_SYNC_CONFIG) == null )
		{
			Map<QName, Serializable> props = new HashMap<QName, Serializable>(1);
			props.put(ContentModel.PROP_NAME, SYNC_CONFIG_FILE_NAME);
			nodeService.createNode(dataNode,
				ContentModel.ASSOC_CHILDREN, NAME_SYNC_CONFIG,
				AlvexContentModel.TYPE_ORGCHART_SYNC_CONFIG, props);
		}*/
	}

	/*
	 * Helpers
	 */

	/**
	 * Helper function to get QName for delegation assoc
	 * @param role Role instance
	 * @param source Delegation source
	 * @param target Delegation target
	 * @return QName for delegation assoc
	 */
	protected QName getDelegationAssocQName(RoleInstance role,
			OrgchartPerson source, OrgchartPerson target) {
		return QName.createQName(AlvexContentModel.ALVEXOC_MODEL_URI,
				(role == null ? "default" : role.getId()));
	}

	/**
	 * Helper function to retrieve only first child association
	 * @param node Node to search associations for
	 * @param typeQNamePattern Pattern of association type 
	 * @param qnamePattern Pattern for association name
	 * @return Node or null if not found
	 */
	protected NodeRef getFirstChild(NodeRef node,
			QNamePattern typeQNamePattern, QNamePattern qnamePattern) {
		List<ChildAssociationRef> assocs = nodeService.getChildAssocs(node,
				typeQNamePattern, qnamePattern);
		return assocs.size() >= 1 ? assocs.get(0).getChildRef() : null;
	}

	/**
	 * Helper function to retrieve target of first association only
	 * @param node Node to search associations for
	 * @param typeQNamePattern Pattern of association type 
	 * @return Node or null if not found
	 */
	protected NodeRef getFirstTarget(NodeRef node, QNamePattern typeQNamePattern) {
		List<AssociationRef> assocs = nodeService.getTargetAssocs(node,
				typeQNamePattern);
		return assocs.size() >= 1 ? assocs.get(0).getTargetRef() : null;
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
	 * @param displayName Display name of this unit
	 * @param weight Unit weight
	 * @return New orgchart unit
	 */
	protected OrgchartUnit createUnit(NodeRef parent, String name,
			String displayName, int weight) {
		return createUnit(parent, name, displayName, name, weight);
	}

	/**
	 * Creates orgchart unit as a child of node in repo specified by reference 
	 * @param parent Reference to parent node 
	 * @param name Name of the unit to create
	 * @param displayName Display name of this unit
	 * @patem groupName Short name of Alfresco group to be created for this unit
	 * @param weight Unit weight
	 * @return New orgchart unit
	 */
	protected OrgchartUnit createUnit(NodeRef parent, String name,
			String displayName, String groupName, int weight) {
		if( !unitOperationsAllowed( getUnitByRef(parent) ) ) 
			throw new AlfrescoRuntimeException("Org chart modification is not allowed");
		final String groupShortName = groupName;
		final String groupDisplayName = displayName;
		final String groupFullName = AuthenticationUtil
				.runAsSystem(new RunAsWork<String>() {
					public String doWork() throws Exception {
						String name = authorityService.createAuthority(
								AuthorityType.GROUP, groupShortName, groupDisplayName, 
								authorityService.getDefaultZones() );
						authorityService.addAuthority(authorityService.getName(
								AuthorityType.GROUP,
								OrgchartService.GROUP_ORGCHART), name);
						return name;
					}
				});
		NodeRef node = nodeService.createNode(parent,
				AlvexContentModel.ASSOC_SUBUNIT, getSubunutAssocQName(name),
				AlvexContentModel.TYPE_ORGCHART_UNIT).getChildRef();
		Map<QName, Serializable> props = new HashMap<QName, Serializable>();
		props.put(AlvexContentModel.PROP_GROUP_NAME, groupFullName);
		props.put(AlvexContentModel.PROP_UNIT_NAME, name == null ? node.getId()
				: name);
		props.put(AlvexContentModel.PROP_UNIT_DISPLAY_NAME,
				displayName == null ? node.getId() : displayName);
		props.put(AlvexContentModel.PROP_UNIT_WEIGHT, weight);
		nodeService.setProperties(node, props);
		return new OrgchartUnit(node, name, displayName, groupFullName, weight);
	}

	/**
	 * Creates new orgchart unit based on existing group
	 * @param parent Parent orgchart unit
	 * @param groupName Name of the group to base unit on
	 * @return New unit
	 */
	protected OrgchartUnit syncUnit(NodeRef parent, String groupShortName) {
		throw new AlfrescoRuntimeException("Not implemented in CE");
	}

	/**
	 * Returns orgchart unit by its node reference
	 * @param node Reference to unit's node
	 * @return Orgchart unit or null
	 */
	protected OrgchartUnit getUnitByRef(NodeRef node) {
		if (node == null || node == getBranchesNode())
			return null;
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
	 * @return Orgchart unit or null
	 */
	protected OrgchartUnit getSubunit(NodeRef parent, String name) {
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
		return getSubunit(parent, name) != null;
	}

	/**
	 * Returns list of subunits 
	 * @param unit Reference to a node of the unit
	 * @return List of subunits
	 */
	protected List<OrgchartUnit> getSubunits(NodeRef unit) {
		List<OrgchartUnit> result = new ArrayList<OrgchartUnit>();
		for (ChildAssociationRef assoc : nodeService.getChildAssocs(unit,
				AlvexContentModel.ASSOC_SUBUNIT, RegexQNamePattern.MATCH_ALL))
			result.add(getUnitByRef(assoc.getChildRef()));
		return result;
	}

	/**
	 * Helper function to get role definition by node reference
	 * @param node Reference to role definition node
	 * @return Role definition or null
	 */
	protected RoleDefinition getRoleDefinitionByRef(NodeRef node) {
		if (node == null)
			return null;
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
	 * @return Role instance or null
	 */
	protected RoleInstance getRoleInstanceByRef(NodeRef node) {
		if (node == null)
			return null;
		NodeRef role = getFirstTarget(node, AlvexContentModel.ASSOC_ROLE_DEF);
		return role == null ? null : new RoleInstance(node, role);
	}

	/**
	 * Helper function to get orgchart person by node reference
	 * @param node Reference to person node
	 * @return Orgchart person or null
	 */
	protected OrgchartPerson getPersonByRef(NodeRef node) {
		return node == null ? null : new OrgchartPerson(node,
				(String) nodeService.getProperty(node,
						ContentModel.PROP_USERNAME));
	}

	/**
	 * Helper function to get orgchart delegation by node reference
	 * @param node Reference to delegation node
	 * @return Orgchart delegation or null 
	 */
	protected OrgchartDelegation getDelegationByRef(NodeRef node) {
		return node == null ? null : new OrgchartDelegation(node,
				getRoleInstanceByRef(getFirstTarget(node,
						AlvexContentModel.ASSOC_DELEGATION_ROLE)),
				getPersonByRef(getFirstTarget(node,
						AlvexContentModel.ASSOC_DELEGATION_SOURCE)),
				getPersonByRef(getFirstTarget(node,
						AlvexContentModel.ASSOC_DELEGATION_TARGET)));
	}

	/**
	 * Checks if orgchart person has «orgchart member» aspect
	 * @param person Orgchart person to check
	 * @return True if person has aspect and false otherwise
	 */
	protected boolean isOrgchartMember(OrgchartPerson person) {
		return nodeService.hasAspect(person.getNode(),
				AlvexContentModel.ASPECT_ORGCHART_MEMBER);
	}

	/**
	 * Adds «orgchart aspect» to person if necessary
	 * @param person Orgchart person to add aspect to
	 */
	protected void makeOrgchartMember(OrgchartPerson person) {
		if (!isOrgchartMember(person))
			AuthenticationUtil.runAsSystem(new MakeOrgchartMember(nodeService,
					person));
	}
	
	/**
	 * 
	 * @return 
	 */
	protected boolean orgchartOperationsAllowed()
	{
		return serviceRegistry.getAuthorityService().hasAdminAuthority();
	}
	
	/**
	 * 
	 * @return 
	 */
	protected boolean unitOperationsAllowed(OrgchartUnit unit)
	{
		if( orgchartOperationsAllowed() )
			return true;
		String userName = serviceRegistry.getAuthenticationService().getCurrentUserName();
		NodeRef userRef = serviceRegistry.getPersonService().getPerson(userName);
		OrgchartPerson person = getPersonByRef(userRef);
		OrgchartUnit curUnit = unit;
		while( curUnit != null )
		{
			if( isAdmin(curUnit, person) )
				return true;
			curUnit = getParentUnit(curUnit);
		}
		return false;
	}
	
	/*
	 * Base orgchart operations
	 */

	/* (non-Javadoc)
	 * @see com.alvexcore.repo.orgchart.OrgchartServiceX#exists()
	 */
	@Override
	public boolean exists() {
		return getRolesNode() != null && getBranchesNode() != null;
	}

	/* (non-Javadoc)
	 * @see com.alvexcore.repo.orgchart.OrgchartServiceX#init()
	 */
	@Override
	public void init() {
		// do nothing if orgchart already initialized
		if (exists())
			return;
		// get orgchart storage node

		// create nodes
		// create container for roles definitions
		setRolesNode(nodeService.createNode(getDataNode(),
				ContentModel.ASSOC_CHILDREN, NAME_ROLES,
				ContentModel.TYPE_CONTAINER).getChildRef());
		// create container for orgchart branches
		setBranchesNode(nodeService.createNode(getDataNode(),
				ContentModel.ASSOC_CHILDREN, NAME_BRANCHES,
				AlvexContentModel.TYPE_ORGCHART_UNIT).getChildRef());
	}

	/* (non-Javadoc)
	 * @see com.alvexcore.repo.orgchart.OrgchartServiceX#drop()
	 */
	@Override
	public void drop() {
		if (!exists())
			return;
		for (OrgchartUnit branch : getBranches())
			dropBranch(branch.getName());
		nodeService.deleteNode(getBranchesNode());
		nodeService.deleteNode(getRolesNode());
		setRolesNode(null);
		setBranchesNode(null);
	}

	/*
	 * Roles related orgchart operations
	 */

	/* (non-Javadoc)
	 * @see com.alvexcore.repo.orgchart.OrgchartServiceX#roleExists(java.lang.String)
	 */
	@Override
	public boolean roleExists(String name) {
		return getRole(name) != null;
	}

	/* (non-Javadoc)
	 * @see com.alvexcore.repo.orgchart.OrgchartServiceX#createRole(java.lang.String, int, java.lang.String)
	 */
	@Override
	public RoleDefinition createRole(String name, int weight, String displayName) {
		if (roleExists(name))
			throw new AlfrescoRuntimeException("Role already exists");
		if( !orgchartOperationsAllowed() ) 
			throw new AlfrescoRuntimeException("Org chart modification is not allowed");
		final String groupShortName = name;
		final String groupDisplayName = displayName;
		final String groupFullName = AuthenticationUtil
				.runAsSystem(new RunAsWork<String>() {
					public String doWork() throws Exception {
						String name = authorityService.createAuthority(
								AuthorityType.GROUP, groupShortName, groupDisplayName, 
								authorityService.getDefaultZones() );
						authorityService.addAuthority(authorityService.getName(
								AuthorityType.GROUP,
								OrgchartService.GROUP_ORGCHART), name);
						return name;
					}
				});
		Map<QName, Serializable> props = new HashMap<QName, Serializable>();
		props.put(AlvexContentModel.PROP_ROLE_NAME, name);
		props.put(AlvexContentModel.PROP_ROLE_DISPLAY_NAME, displayName);
		props.put(AlvexContentModel.PROP_ROLE_WEIGHT, weight);
		props.put(AlvexContentModel.PROP_ROLE_GROUP_NAME, groupFullName);
		return new RoleDefinition(nodeService.createNode(getRolesNode(),
				ContentModel.ASSOC_CHILDREN, getRoleAssocQName(name),
				AlvexContentModel.TYPE_ROLE_DEF, props).getChildRef(), weight,
				name, displayName, groupFullName);
	}

	/* (non-Javadoc)
	 * @see com.alvexcore.repo.orgchart.OrgchartServiceX#modifyRole(java.lang.String, java.lang.Integer, java.lang.String)
	 */

	@Override
	public RoleDefinition modifyRole(String name, Integer weight,
			String displayName) {
		NodeRef role = getFirstChild(getRolesNode(), ContentModel.ASSOC_CHILDREN,
				getRoleAssocQName(name));
		if (displayName != null)
			nodeService.setProperty(role,
					AlvexContentModel.PROP_ROLE_DISPLAY_NAME, displayName);
		if (weight != null)
			nodeService.setProperty(role, AlvexContentModel.PROP_ROLE_WEIGHT,
					weight.intValue());
		return getRoleDefinitionByRef(role);
	}

	/* (non-Javadoc)
	 * @see com.alvexcore.repo.orgchart.OrgchartServiceX#getDefinitionForRole(com.alvexcore.repo.orgchart.RoleInstance)
	 */
	@Override
	public RoleDefinition getDefinitionForRole(RoleInstance role) {
		return getRoleDefinitionByRef(role.getDefinition());
	}

	/* (non-Javadoc)
	 * @see com.alvexcore.repo.orgchart.OrgchartServiceX#dropRole(java.lang.String)
	 */
	@Override
	public void dropRole(String name) {
		if( !orgchartOperationsAllowed() ) 
			throw new AlfrescoRuntimeException("Org chart modification is not allowed");
		RoleDefinition role = getRole(name);
		for (OrgchartUnit unit : getUnitsWithRoleAdded(role))
			removeRole(unit, role);
		final String groupName = role.getGroupName();
		AuthenticationUtil.runAsSystem(new RunAsWork<Void>() {
			public Void doWork() throws Exception {
				authorityService.deleteAuthority(groupName);
				return null;
			}
		});
		nodeService.deleteNode(role.getNode());
	}

	/* (non-Javadoc)
	 * @see com.alvexcore.repo.orgchart.OrgchartServiceX#getRole(java.lang.String)
	 */
	@Override
	public RoleDefinition getRole(String name) {
		return getRoleDefinitionByRef(getFirstChild(getRolesNode(),
				ContentModel.ASSOC_CHILDREN, getRoleAssocQName(name)));
	}

	/* (non-Javadoc)
	 * @see com.alvexcore.repo.orgchart.OrgchartServiceX#getRoleById(java.lang.String)
	 */
	@Override
	public RoleDefinition getRoleById(String id) {
		return getRoleDefinitionByRef(new NodeRef(
				StoreRef.STORE_REF_WORKSPACE_SPACESSTORE, id));
	}

	/* (non-Javadoc)
	 * @see com.alvexcore.repo.orgchart.OrgchartServiceX#getRoleDefinitions()
	 */
	@Override
	public List<RoleDefinition> getRoleDefinitions() {
		List<RoleDefinition> result = new ArrayList<RoleDefinition>();
		for (ChildAssociationRef assoc : nodeService.getChildAssocs(getRolesNode(),
				ContentModel.ASSOC_CHILDREN, RegexQNamePattern.MATCH_ALL))
			result.add(getRoleDefinitionByRef(assoc.getChildRef()));
		return result;
	}

	/* (non-Javadoc)
	 * @see com.alvexcore.repo.orgchart.OrgchartServiceX#addRole(com.alvexcore.repo.orgchart.OrgchartUnit, com.alvexcore.repo.orgchart.RoleDefinition)
	 */
	@Override
	public RoleInstance addRole(OrgchartUnit unit, RoleDefinition role) {
		NodeRef node = nodeService.createNode(unit.getNode(),
				AlvexContentModel.ASSOC_ROLE,
				getRoleAssocQName(role.getName()),
				AlvexContentModel.TYPE_ROLE_INST).getChildRef();
		nodeService.createAssociation(node, role.getNode(),
				AlvexContentModel.ASSOC_ROLE_DEF);
		return new RoleInstance(node, role.getNode());
	}

	/* (non-Javadoc)
	 * @see com.alvexcore.repo.orgchart.OrgchartServiceX#getRoleForUnit(com.alvexcore.repo.orgchart.OrgchartUnit, com.alvexcore.repo.orgchart.RoleDefinition)
	 */
	@Override
	public RoleInstance getRoleForUnit(OrgchartUnit unit, RoleDefinition role) {
		NodeRef node = getFirstChild(unit.getNode(),
				AlvexContentModel.ASSOC_ROLE, getRoleAssocQName(role.getName()));
		return node == null ? null : new RoleInstance(node, role.getNode());
	}

	/* (non-Javadoc)
	 * @see com.alvexcore.repo.orgchart.OrgchartServiceX#getRoleForUnitRecursively(com.alvexcore.repo.orgchart.OrgchartUnit, com.alvexcore.repo.orgchart.RoleDefinition)
	 */
	@Override
	public RoleInstance getRoleForUnitRecursively(OrgchartUnit unit,
			RoleDefinition role) {
		if (unit == null)
			return null;
		RoleInstance roleInstance = getRoleForUnit(unit, role);
		return roleInstance == null ? getRoleForUnitRecursively(
				getParentUnit(unit), role) : roleInstance;

	}

	/* (non-Javadoc)
	 * @see com.alvexcore.repo.orgchart.OrgchartServiceX#isRoleAddedToUnit(com.alvexcore.repo.orgchart.OrgchartUnit, com.alvexcore.repo.orgchart.RoleDefinition)
	 */
	@Override
	public boolean isRoleAddedToUnit(OrgchartUnit unit, RoleDefinition role) {
		return getRoleForUnit(unit, role) != null;
	}

	/* (non-Javadoc)
	 * @see com.alvexcore.repo.orgchart.OrgchartServiceX#removeRole(com.alvexcore.repo.orgchart.OrgchartUnit, com.alvexcore.repo.orgchart.RoleDefinition)
	 */
	@Override
	public void removeRole(OrgchartUnit unit, RoleDefinition role) {
		RoleInstance roleInstance = getRoleForUnit(unit, role);
		for (OrgchartPerson person : getRoleAssignees(roleInstance))
			revokeRole(roleInstance, person);
		nodeService.deleteNode(roleInstance.getNode());
	}

	/* (non-Javadoc)
	 * @see com.alvexcore.repo.orgchart.OrgchartServiceX#assignRole(com.alvexcore.repo.orgchart.RoleInstance, com.alvexcore.repo.orgchart.OrgchartPerson)
	 */
	@Override
	public void assignRole(RoleInstance role, OrgchartPerson person) {
		if( !unitOperationsAllowed( getUnitByRef( nodeService.getPrimaryParent(
					role.getNode()).getParentRef() ) ) )
			throw new AlfrescoRuntimeException("Org chart modification is not allowed");
		nodeService.createAssociation(role.getNode(), person.getNode(),
				AlvexContentModel.ASSOC_ROLE_MEMBER);
		final String groupName = (String) nodeService.getProperty(
				role.getDefinition(), AlvexContentModel.PROP_ROLE_GROUP_NAME);
		final String personName = person.getName();
		AuthenticationUtil.runAsSystem(new RunAsWork<Void>() {
			public Void doWork() throws Exception {
				if (!authorityService.getAuthoritiesForUser(personName)
						.contains(groupName))
					authorityService.addAuthority(groupName, personName);
				return null;
			}
		});
	}

	/* (non-Javadoc)
	 * @see com.alvexcore.repo.orgchart.OrgchartServiceX#revokeRole(com.alvexcore.repo.orgchart.RoleInstance, com.alvexcore.repo.orgchart.OrgchartPerson)
	 */
	@Override
	public void revokeRole(RoleInstance role, OrgchartPerson person) {
		if( !unitOperationsAllowed( getUnitByRef( nodeService.getPrimaryParent(
					role.getNode()).getParentRef() ) ) )
			throw new AlfrescoRuntimeException("Org chart modification is not allowed");
		nodeService.removeAssociation(role.getNode(), person.getNode(),
				AlvexContentModel.ASSOC_ROLE_MEMBER);
		final String groupName = (String) nodeService.getProperty(
				role.getDefinition(), AlvexContentModel.PROP_ROLE_GROUP_NAME);
		final String personName = person.getName();
		AuthenticationUtil.runAsSystem(new RunAsWork<Void>() {
			public Void doWork() throws Exception {
				authorityService.removeAuthority(groupName, personName);
				return null;
			}
		});
	}

	/* (non-Javadoc)
	 * @see com.alvexcore.repo.orgchart.OrgchartServiceX#isRoleAssigned(com.alvexcore.repo.orgchart.RoleInstance, com.alvexcore.repo.orgchart.OrgchartPerson)
	 */
	@Override
	public boolean isRoleAssigned(RoleInstance role, OrgchartPerson person) {
		for (AssociationRef assoc : nodeService.getTargetAssocs(role.getNode(),
				AlvexContentModel.ASSOC_ROLE_MEMBER))
			if (assoc.getTargetRef().equals(person.getNode()))
				return true;
		return false;
	}

	/* (non-Javadoc)
	 * @see com.alvexcore.repo.orgchart.OrgchartServiceX#getRoleAssignees(com.alvexcore.repo.orgchart.RoleInstance)
	 */
	@Override
	public List<OrgchartPerson> getRoleAssignees(RoleInstance role) {
		List<OrgchartPerson> result = new ArrayList<OrgchartPerson>();
		for (AssociationRef assoc : nodeService.getTargetAssocs(role.getNode(),
				AlvexContentModel.ASSOC_ROLE_MEMBER))
			result.add(getPersonByRef(assoc.getTargetRef()));
		return result;
	}

	/* (non-Javadoc)
	 * @see com.alvexcore.repo.orgchart.OrgchartServiceX#getUnitRoles(com.alvexcore.repo.orgchart.OrgchartUnit)
	 */
	@Override
	public List<RoleInstance> getUnitRoles(OrgchartUnit unit) {
		List<RoleInstance> result = new ArrayList<RoleInstance>();
		for (ChildAssociationRef assoc : nodeService.getChildAssocs(
				unit.getNode(), AlvexContentModel.ASSOC_ROLE,
				RegexQNamePattern.MATCH_ALL))
			result.add(getRoleInstanceByRef(assoc.getChildRef()));
		return result;
	}

	/* (non-Javadoc)
	 * @see com.alvexcore.repo.orgchart.OrgchartServiceX#getUnitsWithRoleAdded(com.alvexcore.repo.orgchart.RoleDefinition)
	 */
	@Override
	public List<OrgchartUnit> getUnitsWithRoleAdded(RoleDefinition role) {
		List<OrgchartUnit> result = new ArrayList<OrgchartUnit>();
		for (AssociationRef assoc : nodeService.getSourceAssocs(role.getNode(),
				AlvexContentModel.ASSOC_ROLE_DEF))
			result.add(getUnitByRef(nodeService.getPrimaryParent(
					assoc.getSourceRef()).getParentRef()));
		return result;
	}

	/* (non-Javadoc)
	 * @see com.alvexcore.repo.orgchart.OrgchartServiceX#getRolesForPerson(com.alvexcore.repo.orgchart.OrgchartUnit, com.alvexcore.repo.orgchart.OrgchartPerson)
	 */
	@Override
	public List<RoleInstance> getRolesForPerson(OrgchartUnit unit,
			OrgchartPerson person) {
		List<RoleInstance> result = new ArrayList<RoleInstance>();
		for (RoleInstance role : getUnitRoles(unit))
			if (isRoleAssigned(role, person))
				result.add(role);
		return result;
	}

	/* (non-Javadoc)
	 * @see com.alvexcore.repo.orgchart.OrgchartServiceX#getRolesForPerson(com.alvexcore.repo.orgchart.OrgchartPerson)
	 */
	@Override
	public List<RoleInstance> getRolesForPerson(OrgchartPerson person) {
		List<RoleInstance> result = new ArrayList<RoleInstance>();
		for (OrgchartUnit unit : getUnitsForPerson(person))
			result.addAll(getRolesForPerson(unit, person));
		return result;
	}

	/* (non-Javadoc)
	 * @see com.alvexcore.repo.orgchart.OrgchartServiceX#getRoleInstanceById(java.lang.String)
	 */
	@Override
	public RoleInstance getRoleInstanceById(String id) {
		return getRoleInstanceByRef(new NodeRef(
				StoreRef.STORE_REF_WORKSPACE_SPACESSTORE, id));
	}

	/*
	 * Orgchart branches related operations
	 */
	/* (non-Javadoc)
	 * @see com.alvexcore.repo.orgchart.OrgchartServiceX#getBranch(java.lang.String)
	 */
	@Override
	public OrgchartUnit getBranch(String name) {
		return getSubunit(getBranchesNode(), name);
	}

	/* (non-Javadoc)
	 * @see com.alvexcore.repo.orgchart.OrgchartServiceX#branchExists(java.lang.String)
	 */
	@Override
	public boolean branchExists(String name) {
		return subunitExists(getBranchesNode(), name);
	}

	/* (non-Javadoc)
	 * @see com.alvexcore.repo.orgchart.OrgchartServiceX#createBranch(java.lang.String, java.lang.String)
	 */
	@Override
	public OrgchartUnit createBranch(String name, String displayName) {
		if (branchExists(name))
			throw new AlfrescoRuntimeException("Branch already exists");
		return createUnit(getBranchesNode(), name, displayName, "orgchart." + name, 0);
	}

	/* (non-Javadoc)
	 * @see com.alvexcore.repo.orgchart.OrgchartServiceX#dropBranch(java.lang.String)
	 */
	@Override
	public void dropBranch(String name) {
		dropUnit(getBranch(name));
	}

	/* (non-Javadoc)
	 * @see com.alvexcore.repo.orgchart.OrgchartServiceX#getBranches()
	 */
	@Override
	public List<OrgchartUnit> getBranches() {
		return getSubunits(getBranchesNode());
	}

	/*
	 * Orgchart unit related operations
	 */

	/* (non-Javadoc)
	 * @see com.alvexcore.repo.orgchart.OrgchartServiceX#createUnit(com.alvexcore.repo.orgchart.OrgchartUnit, java.lang.String, java.lang.String, int)
	 */
	@Override
	public OrgchartUnit createUnit(OrgchartUnit parent, String name,
			String displayName, int weight) {
		return createUnit(parent.getNode(), name, displayName, weight);
	}

	/* (non-Javadoc)
	 * @see com.alvexcore.repo.orgchart.OrgchartServiceX#syncUnit(com.alvexcore.repo.orgchart.OrgchartUnit, java.lang.String)
	 */
	@Override
	public OrgchartUnit syncUnit(OrgchartUnit parent, String groupShortName) {
		return syncUnit(parent.getNode(), groupShortName);
	}

	/* (non-Javadoc)
	 * @see com.alvexcore.repo.orgchart.OrgchartServiceX#dropUnit(com.alvexcore.repo.orgchart.OrgchartUnit)
	 */
	@Override
	public void dropUnit(OrgchartUnit unit) {
		if( !unitOperationsAllowed( unit ) ) 
			throw new AlfrescoRuntimeException("Org chart modification is not allowed");
		for( OrgchartUnit subUnit : getSubunits(unit) )
			dropUnit( subUnit );
		final String groupName = unit.getGroupName();
		AuthenticationUtil.runAsSystem(new RunAsWork<Void>() {
			public Void doWork() throws Exception {
				if( authorityService.authorityExists(groupName) )
					authorityService.deleteAuthority(groupName);
				return null;
			}
		});
		for (RoleInstance role : getUnitRoles(unit))
			removeRole(unit, getDefinitionForRole(role));
		nodeService.deleteNode(unit.getNode());
	}

	/* (non-Javadoc)
	 * @see com.alvexcore.repo.orgchart.OrgchartServiceX#modifyUnit(com.alvexcore.repo.orgchart.OrgchartUnit, java.lang.String, java.lang.Integer)
	 */
	@Override
	public OrgchartUnit modifyUnit(OrgchartUnit unit, String displayName,
			Integer weight) {
		if( !unitOperationsAllowed( unit ) ) 
			throw new AlfrescoRuntimeException("Org chart modification is not allowed");
		if (displayName != null) {
			nodeService.setProperty(unit.getNode(),
					AlvexContentModel.PROP_UNIT_DISPLAY_NAME, displayName);
			final String groupName = unit.getGroupName();
			final String groupDisplayName = displayName;
			AuthenticationUtil.runAsSystem(new RunAsWork<Void>() {
				public Void doWork() throws Exception {
					if( authorityService.authorityExists(groupName) )
						authorityService.setAuthorityDisplayName(groupName, groupDisplayName);
					return null;
				}
			});
		}
		if (weight != null)
			nodeService.setProperty(unit.getNode(),
					AlvexContentModel.PROP_UNIT_WEIGHT, (int) weight);
		return getUnitByRef(unit.getNode());
	}

	/* (non-Javadoc)
	 * @see com.alvexcore.repo.orgchart.OrgchartServiceX#getSubunit(com.alvexcore.repo.orgchart.OrgchartUnit, java.lang.String)
	 */
	@Override
	public OrgchartUnit getSubunit(OrgchartUnit parent, String name) {
		return getSubunit(parent.getNode(), name);
	}

	/* (non-Javadoc)
	 * @see com.alvexcore.repo.orgchart.OrgchartServiceX#subunitExists(com.alvexcore.repo.orgchart.OrgchartUnit, java.lang.String)
	 */
	@Override
	public boolean subunitExists(OrgchartUnit parent, String name) {
		return subunitExists(parent.getNode(), name);
	}

	/* (non-Javadoc)
	 * @see com.alvexcore.repo.orgchart.OrgchartServiceX#getUnitById(java.lang.String)
	 */
	@Override
	public OrgchartUnit getUnitById(String id) {
		return getUnitByRef(new NodeRef(
				StoreRef.STORE_REF_WORKSPACE_SPACESSTORE, id));

	}

	/* (non-Javadoc)
	 * @see com.alvexcore.repo.orgchart.OrgchartServiceX#getSubunits(com.alvexcore.repo.orgchart.OrgchartUnit)
	 */
	@Override
	public List<OrgchartUnit> getSubunits(OrgchartUnit unit) {
		return getSubunits(unit.getNode());
	}

	/* (non-Javadoc)
	 * @see com.alvexcore.repo.orgchart.OrgchartServiceX#getParentUnit(com.alvexcore.repo.orgchart.OrgchartUnit)
	 */
	@Override
	public OrgchartUnit getParentUnit(OrgchartUnit unit) {
		NodeRef node = nodeService.getPrimaryParent(unit.getNode())
				.getParentRef();
		return node.equals(getBranchesNode()) ? null : getUnitByRef(node);
	}

	/* (non-Javadoc)
	 * @see com.alvexcore.repo.orgchart.OrgchartServiceX#resolveUnit(java.lang.String)
	 */
	@Override
	public OrgchartUnit resolveUnit(String path) {
		String[] units = path.split(UNITS_PATH_SEPARATOR);
		if (units.length == 0)
			return null;
		OrgchartUnit unit = getBranch(units[0]);
		if (unit == null)
			return null;
		for (int i = 1; i < units.length; i++) {
			unit = getSubunit(unit, units[i]);
			if (unit == null)
				return null;
		}
		return unit;
	}

	/*
	 * Orgchart membership related operations
	 */

	/* (non-Javadoc)
	 * @see com.alvexcore.repo.orgchart.OrgchartServiceX#getPerson(java.lang.String)
	 */
	@Override
	public OrgchartPerson getPerson(String name) {
		return getPersonByRef(authorityService
				.getAuthorityNodeRef(authorityService.getName(
						AuthorityType.USER, name)));
	}

	/* (non-Javadoc)
	 * @see com.alvexcore.repo.orgchart.OrgchartServiceX#addMember(com.alvexcore.repo.orgchart.OrgchartUnit, com.alvexcore.repo.orgchart.OrgchartPerson)
	 */
	@Override
	public void addMember(OrgchartUnit unit, OrgchartPerson person) {
		if( !unitOperationsAllowed( unit ) ) 
			throw new AlfrescoRuntimeException("Org chart modification is not allowed");
		nodeService.createAssociation(unit.getNode(), person.getNode(),
				AlvexContentModel.ASSOC_MEMBER);
		final String personName = person.getName();
		final String groupName = unit.getGroupName();
		AuthenticationUtil.runAsSystem(new RunAsWork<Void>() {
			public Void doWork() throws Exception {
				if( ! authorityService.getAuthoritiesForUser(personName).contains(groupName) )
					authorityService.addAuthority(groupName, personName);
				return null;
			}
		});
	}

	/* (non-Javadoc)
	 * @see com.alvexcore.repo.orgchart.OrgchartServiceX#removeMember(com.alvexcore.repo.orgchart.OrgchartUnit, com.alvexcore.repo.orgchart.OrgchartPerson)
	 */
	@Override
	public void removeMember(OrgchartUnit unit, OrgchartPerson person) {
		if( !unitOperationsAllowed( unit ) ) 
			throw new AlfrescoRuntimeException("Org chart modification is not allowed");
		nodeService.removeAssociation(unit.getNode(), person.getNode(),
				AlvexContentModel.ASSOC_MEMBER);
		final String personName = person.getName();
		final String groupName = unit.getGroupName();
		AuthenticationUtil.runAsSystem(new RunAsWork<Void>() {
			public Void doWork() throws Exception {
				authorityService.removeAuthority(groupName, personName);
				return null;
			}
		});
	}

	/* (non-Javadoc)
	 * @see com.alvexcore.repo.orgchart.OrgchartServiceX#isMember(com.alvexcore.repo.orgchart.OrgchartUnit, com.alvexcore.repo.orgchart.OrgchartPerson)
	 */
	@Override
	public boolean isMember(OrgchartUnit unit, OrgchartPerson person) {
		for (AssociationRef assoc : nodeService.getTargetAssocs(unit.getNode(),
				AlvexContentModel.ASSOC_MEMBER))
			if (assoc.getTargetRef().equals(person.getNode()))
				return true;
		return false;
	}

	/* (non-Javadoc)
	 * @see com.alvexcore.repo.orgchart.OrgchartServiceX#getUnitMembers(com.alvexcore.repo.orgchart.OrgchartUnit)
	 */
	@Override
	public List<OrgchartPerson> getUnitMembers(OrgchartUnit unit) {
		List<OrgchartPerson> result = new ArrayList<OrgchartPerson>();
		for (AssociationRef assoc : nodeService.getTargetAssocs(unit.getNode(),
				AlvexContentModel.ASSOC_MEMBER))
			result.add(getPersonByRef(assoc.getTargetRef()));
		return result;
	}

	/* (non-Javadoc)
	 * @see com.alvexcore.repo.orgchart.OrgchartServiceX#getUnitsForPerson(com.alvexcore.repo.orgchart.OrgchartPerson)
	 */
	@Override
	public List<OrgchartUnit> getUnitsForPerson(OrgchartPerson person) {
		List<OrgchartUnit> result = new ArrayList<OrgchartUnit>();
		for (AssociationRef assoc : nodeService.getSourceAssocs(
				person.getNode(), AlvexContentModel.ASSOC_MEMBER))
			result.add(getUnitByRef(assoc.getSourceRef()));
		return result;
	}

	/*
	 * Orgchart supervisor/admin related operations
	 */

	/* (non-Javadoc)
	 * @see com.alvexcore.repo.orgchart.OrgchartServiceX#addSupervisor(com.alvexcore.repo.orgchart.OrgchartUnit, com.alvexcore.repo.orgchart.OrgchartPerson)
	 */
	@Override
	public void addSupervisor(OrgchartUnit unit, OrgchartPerson person) {
		nodeService.createAssociation(unit.getNode(), person.getNode(),
				AlvexContentModel.ASSOC_SUPERVISOR);
	}

	/* (non-Javadoc)
	 * @see com.alvexcore.repo.orgchart.OrgchartServiceX#removeSupervisor(com.alvexcore.repo.orgchart.OrgchartUnit, com.alvexcore.repo.orgchart.OrgchartPerson)
	 */
	@Override
	public void removeSupervisor(OrgchartUnit unit, OrgchartPerson person) {
		nodeService.removeAssociation(unit.getNode(), person.getNode(),
				AlvexContentModel.ASSOC_SUPERVISOR);
	}

	/* (non-Javadoc)
	 * @see com.alvexcore.repo.orgchart.OrgchartServiceX#isSupervisor(com.alvexcore.repo.orgchart.OrgchartUnit, com.alvexcore.repo.orgchart.OrgchartPerson)
	 */
	@Override
	public boolean isSupervisor(OrgchartUnit unit, OrgchartPerson person) {
		for (AssociationRef assoc : nodeService.getTargetAssocs(unit.getNode(),
				AlvexContentModel.ASSOC_SUPERVISOR))
			if (assoc.getTargetRef().equals(person.getNode()))
				return true;
		return false;
	}

	/* (non-Javadoc)
	 * @see com.alvexcore.repo.orgchart.OrgchartServiceX#getSupervisors(com.alvexcore.repo.orgchart.OrgchartUnit)
	 */
	@Override
	public List<OrgchartPerson> getSupervisors(OrgchartUnit unit) {
		List<OrgchartPerson> result = new ArrayList<OrgchartPerson>();
		for (AssociationRef assoc : nodeService.getTargetAssocs(unit.getNode(),
				AlvexContentModel.ASSOC_SUPERVISOR))
			result.add(getPersonByRef(assoc.getTargetRef()));
		return result;
	}

	/* (non-Javadoc)
	 * @see com.alvexcore.repo.orgchart.OrgchartServiceX#getSupervisioningUnitsForPerson(com.alvexcore.repo.orgchart.OrgchartPerson)
	 */
	@Override
	public List<OrgchartUnit> getSupervisioningUnitsForPerson(
			OrgchartPerson person) {
		List<OrgchartUnit> result = new ArrayList<OrgchartUnit>();
		for (AssociationRef assoc : nodeService.getSourceAssocs(
				person.getNode(), AlvexContentModel.ASSOC_SUPERVISOR))
			result.add(getUnitByRef(assoc.getSourceRef()));
		return result;
	}

	/* (non-Javadoc)
	 * @see com.alvexcore.repo.orgchart.OrgchartServiceX#addAdmin(com.alvexcore.repo.orgchart.OrgchartUnit, com.alvexcore.repo.orgchart.OrgchartPerson)
	 */
	@Override
	public void addAdmin(OrgchartUnit unit, OrgchartPerson person) {
		nodeService.createAssociation(unit.getNode(), person.getNode(),
				AlvexContentModel.ASSOC_ADMIN);
		permissionService.setPermission(unit.getNode(), person.getName(),
				PermissionService.COORDINATOR, true);
	}

	/* (non-Javadoc)
	 * @see com.alvexcore.repo.orgchart.OrgchartServiceX#removeAdmin(com.alvexcore.repo.orgchart.OrgchartUnit, com.alvexcore.repo.orgchart.OrgchartPerson)
	 */
	@Override
	public void removeAdmin(OrgchartUnit unit, OrgchartPerson person) {
		nodeService.removeAssociation(unit.getNode(), person.getNode(),
				AlvexContentModel.ASSOC_ADMIN);
		permissionService.clearPermission(unit.getNode(), person.getName());
	}

	/* (non-Javadoc)
	 * @see com.alvexcore.repo.orgchart.OrgchartServiceX#isAdmin(com.alvexcore.repo.orgchart.OrgchartUnit, com.alvexcore.repo.orgchart.OrgchartPerson)
	 */
	@Override
	public boolean isAdmin(OrgchartUnit unit, OrgchartPerson person) {
		for (AssociationRef assoc : nodeService.getTargetAssocs(unit.getNode(),
				AlvexContentModel.ASSOC_ADMIN))
			if (assoc.getTargetRef().equals(person.getNode()))
				return true;
		return false;
	}

	/* (non-Javadoc)
	 * @see com.alvexcore.repo.orgchart.OrgchartServiceX#getAdminsForUnit(com.alvexcore.repo.orgchart.OrgchartUnit)
	 */
	@Override
	public List<OrgchartPerson> getAdminsForUnit(OrgchartUnit unit) {
		List<OrgchartPerson> result = new ArrayList<OrgchartPerson>();
		for (AssociationRef assoc : nodeService.getTargetAssocs(unit.getNode(),
				AlvexContentModel.ASSOC_ADMIN))
			result.add(getPersonByRef(assoc.getTargetRef()));
		return result;
	}

	/* (non-Javadoc)
	 * @see com.alvexcore.repo.orgchart.OrgchartServiceX#getAdminingUnitsForPerson(com.alvexcore.repo.orgchart.OrgchartPerson)
	 */
	@Override
	public List<OrgchartUnit> getAdminingUnitsForPerson(OrgchartPerson person) {
		List<OrgchartUnit> result = new ArrayList<OrgchartUnit>();
		for (AssociationRef assoc : nodeService.getSourceAssocs(
				person.getNode(), AlvexContentModel.ASSOC_ADMIN))
			result.add(getUnitByRef(assoc.getSourceRef()));
		return result;
	}

	/*
	 * Orgchart delegations related operations
	 */

	/* (non-Javadoc)
	 * @see com.alvexcore.repo.orgchart.OrgchartServiceX#setOutOfOffice(com.alvexcore.repo.orgchart.OrgchartPerson, boolean)
	 */
	@Override
	public void setOutOfOffice(OrgchartPerson person, boolean value) throws Exception {
		throw new AlfrescoRuntimeException("Not implemented in CE");
	}

	/* (non-Javadoc)
	 * @see com.alvexcore.repo.orgchart.OrgchartServiceX#isOutOfOffice(com.alvexcore.repo.orgchart.OrgchartPerson)
	 */
	@Override
	public boolean isOutOfOffice(OrgchartPerson person) {
		throw new AlfrescoRuntimeException("Not implemented in CE");
	}

	/* (non-Javadoc)
	 * @see com.alvexcore.repo.orgchart.OrgchartServiceX#setDelegation(com.alvexcore.repo.orgchart.RoleInstance, com.alvexcore.repo.orgchart.OrgchartPerson, com.alvexcore.repo.orgchart.OrgchartPerson)
	 */
	@Override
	public OrgchartDelegation setDelegation(RoleInstance role,
			OrgchartPerson source, OrgchartPerson target) {
		throw new AlfrescoRuntimeException("Not implemented in CE");
	}

	/* (non-Javadoc)
	 * @see com.alvexcore.repo.orgchart.OrgchartServiceX#setDefaultDelegation(com.alvexcore.repo.orgchart.OrgchartPerson, com.alvexcore.repo.orgchart.OrgchartPerson)
	 */
	@Override
	public OrgchartDelegation setDefaultDelegation(OrgchartPerson source,
			OrgchartPerson target) {
		throw new AlfrescoRuntimeException("Not implemented in CE");
	}

	/* (non-Javadoc)
	 * @see com.alvexcore.repo.orgchart.OrgchartServiceX#removeDelegation(com.alvexcore.repo.orgchart.OrgchartDelegation)
	 */
	@Override
	public void removeDelegation(OrgchartDelegation delegation) {
		throw new AlfrescoRuntimeException("Not implemented in CE");
	}

	/* (non-Javadoc)
	 * @see com.alvexcore.repo.orgchart.OrgchartServiceX#getSourceDelegationsForPerson(com.alvexcore.repo.orgchart.OrgchartPerson)
	 */
	@Override
	public List<OrgchartDelegation> getSourceDelegationsForPerson(
			OrgchartPerson person) {
		throw new AlfrescoRuntimeException("Not implemented in CE");
	}

	/* (non-Javadoc)
	 * @see com.alvexcore.repo.orgchart.OrgchartServiceX#getTargetDelegationsForPerson(com.alvexcore.repo.orgchart.OrgchartPerson)
	 */
	@Override
	public List<OrgchartDelegation> getTargetDelegationsForPerson(
			OrgchartPerson person) {
		throw new AlfrescoRuntimeException("Not implemented in CE");
	}

	/* (non-Javadoc)
	 * @see com.alvexcore.repo.orgchart.OrgchartServiceX#getDelegationsForRole(com.alvexcore.repo.orgchart.RoleInstance)
	 */
	@Override
	public List<OrgchartDelegation> getDelegationsForRole(RoleInstance role) {
		throw new AlfrescoRuntimeException("Not implemented in CE");
	}

	/* (non-Javadoc)
	 * @see com.alvexcore.repo.orgchart.OrgchartServiceX#getDelegationsForUnit(com.alvexcore.repo.orgchart.OrgchartUnit)
	 */
	@Override
	public List<OrgchartDelegation> getDelegationsForUnit(OrgchartUnit unit) {
		throw new AlfrescoRuntimeException("Not implemented in CE");
	}

	/* (non-Javadoc)
	 * @see com.alvexcore.repo.orgchart.OrgchartServiceX#getDefaultDelegationForPerson(com.alvexcore.repo.orgchart.OrgchartPerson)
	 */
	@Override
	public OrgchartDelegation getDefaultDelegationForPerson(
			OrgchartPerson person) {
		throw new AlfrescoRuntimeException("Not implemented in CE");
	}

	/* (non-Javadoc)
	 * @see com.alvexcore.repo.orgchart.OrgchartServiceX#getDelegation(com.alvexcore.repo.orgchart.RoleInstance, com.alvexcore.repo.orgchart.OrgchartPerson)
	 */
	@Override
	public OrgchartDelegation getDelegation(RoleInstance role,
			OrgchartPerson source) {
		throw new AlfrescoRuntimeException("Not implemented in CE");
	}

	@Override
	@Required
	public void setExtension(RepositoryExtension extension) {
		this.extension = extension;		
	}

	protected NodeRef getDataNode() {
		return extension.getDataPath();
	}

	protected NodeRef getRolesNode() {
		return extension.getNodeFromCache(ID_ROLES_NODE);
	}

	protected void setRolesNode(NodeRef rolesNode) {
		if (rolesNode != null)
			extension.addNodeToCache(ID_ROLES_NODE, rolesNode);
		else
			extension.removeNodeFromCache(ID_ROLES_NODE);
	}

	protected NodeRef getBranchesNode() {
		return extension.getNodeFromCache(ID_BRANCHES_NODE);
	}

	protected void setBranchesNode(NodeRef branchesNode) {
		if (branchesNode != null)
			extension.addNodeToCache(ID_BRANCHES_NODE, branchesNode);
		else
			extension.removeNodeFromCache(ID_BRANCHES_NODE);
	}

	/*
	 * (non-Javadoc)
	 * 
	 * @see
	 * com.alvexcore.repo.orgchart.OrgchartServiceX#moveUnit(com.alvexcore.repo
	 * .orgchart.OrgchartUnit, com.alvexcore.repo.orgchart.OrgchartUnit)
	 */
	@Override
	public void moveUnit(OrgchartUnit unit, OrgchartUnit newParent) {
		nodeService.moveNode(unit.getNode(), newParent.getNode(),
				AlvexContentModel.ASSOC_SUBUNIT,
				getSubunutAssocQName(unit.getName()));
	}
}
