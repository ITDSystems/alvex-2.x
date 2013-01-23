package com.alvexcore.repo.orgchart;

import java.util.List;

import org.alfresco.service.ServiceRegistry;
import org.alfresco.service.cmr.repository.NodeService;
import org.alfresco.service.cmr.security.AuthorityService;
import org.alfresco.service.cmr.security.PermissionService;

public interface OrgchartService {

	public static final String UNITS_PATH_SEPARATOR = "->";
	public static final String ORGCHART_SERVICE = "AlvexOrgchartService";
	public static final String GROUP_ORGCHART = "orgchart";

	/**
	 * Returns service registry
	 * @return ServiceRegistry instance
	 */
	public abstract ServiceRegistry getServiceRegistry();

	/**
	 * Returns node service
	 * @return NodeService instance
	 */
	public abstract NodeService getNodeService();

	/**
	 * Returns authority service
	 * @return AuthorityService instance
	 */
	public abstract AuthorityService getAuthorityService();
	
	/**
	 * Returns permission service
	 * @return PermissionService instance
	 */
	public abstract PermissionService getPermissionService();
	
	/**
	 * Sets up orgchart service
	 * @throws Exception
	 */
	public abstract void setUp() throws Exception;

	/**
	 * Checks if orgchart exists.
	 * @return True if orgchart initialized and false otherwise
	 */
	public abstract boolean exists();

	/**
	 * Initializes orgchart.
	 */
	public abstract void init();

	/**
	 * Drops orgchart completely
	 */
	public abstract void drop();

	/**
	 * Checks if specified role exists in orgchart
	 * @param name Name of the role
	 * @return True if role exists and null otherwise
	 */
	public abstract boolean roleExists(String name);

	/**
	 * Creates new orgchart role
	 * @param name Role name
	 * @param weight Role weight
	 * @param groupShortName Group short name
	 * @param groupDisplayName Group display name
	 * @throws Exception
	 */
	public abstract RoleDefinition createRole(String name, int weight,
			String displayName);

	/**
	 * Updates role definition
	 * @param name Role name
	 * @param weight New role weight or null
	 * @param displayName New role display name or null
	 * @return Update role definition
	 */

	public abstract RoleDefinition modifyRole(String name, Integer weight,
			String displayName);

	/**
	 * Returns role definition for role instance
	 * @param role Role instance
	 * @return Role definition or null
	 */
	public abstract RoleDefinition getDefinitionForRole(RoleInstance role);

	/**
	 * Drops orgchart role
	 * @param name Name of the role to delete
	 */
	public abstract void dropRole(String name);

	/**
	 * Get role definition by name
	 * @param name Role name
	 * @return Role definition or null
	 */
	public abstract RoleDefinition getRole(String name);

	/**
	 * Gets role definition by id
	 * @param id Role definition id
	 * @return Role definition
	 */
	public abstract RoleDefinition getRoleById(String id);

	/**
	 * Returns all defined orgchart roles
	 * @return Role definitions
	 */
	public abstract List<RoleDefinition> getRoleDefinitions();

	/**
	 * Adds role to orgchart unit
	 * @param unit Orgchart unit
	 * @param role Role definition
	 */
	public abstract RoleInstance addRole(OrgchartUnit unit, RoleDefinition role);

	/**
	 * Get role instance by orgchart unit and role definition
	 * @param unit Orgchart unit
	 * @param role Role definition
	 * @return Role instance or null
	 */
	public abstract RoleInstance getRoleForUnit(OrgchartUnit unit,
			RoleDefinition role);

	/**
	 * Recursively Get role instance by orgchart unit and role definition
	 * @param unit Orgchart unit
	 * @param role Role definition
	 * @return Role instance or null
	 */
	public abstract RoleInstance getRoleForUnitRecursively(OrgchartUnit unit,
			RoleDefinition role);

	/**
	 * Checks if specified role added to unit
	 * @param unit Orgchart unit
	 * @param role Role definition
	 * @return True of role assigned to unit and false otherwise
	 */
	public abstract boolean isRoleAddedToUnit(OrgchartUnit unit,
			RoleDefinition role);

	/**
	 * Removes role from unit
	 * @param unit Orgchart unit
	 * @param role Role definition
	 */
	public abstract void removeRole(OrgchartUnit unit, RoleDefinition role);

	/**
	 * Assign role to a user
	 * @param role Role instance
	 * @param person Person
	 */
	public abstract void assignRole(RoleInstance role, OrgchartPerson person);

	/**
	 * Revokes role from person
	 * @param role Role instance
	 * @param person Person
	 */
	public abstract void revokeRole(RoleInstance role, OrgchartPerson person);

	/**
	 * Checks if role assigned to user
	 * @param role Role instance
	 * @param person Person
	 * @return True if role assigned and false otherwise
	 */
	public abstract boolean isRoleAssigned(RoleInstance role,
			OrgchartPerson person);

	/**
	 * Returns all person that role assigned to
	 * @param role Role instance
	 * @return List of assignees
	 */
	public abstract List<OrgchartPerson> getRoleAssignees(RoleInstance role);

	/**
	 * Lists all orgchart unit roles
	 * @param unit Orgchart unit
	 * @return List of orgchart unit roles
	 */
	public abstract List<RoleInstance> getUnitRoles(OrgchartUnit unit);

	/**
	 * Lists all orgchart units with role assigned to
	 * @param role Role definition
	 * @return List of orgchart units
	 */
	public abstract List<OrgchartUnit> getUnitsWithRoleAdded(RoleDefinition role);

	/**
	 * Get all person roles in orgchart unit
	 * @param unit Orgchart unit
	 * @param person Person
	 * @return List of role instances
	 */
	public abstract List<RoleInstance> getRolesForPerson(OrgchartUnit unit,
			OrgchartPerson person);

	/**
	 * Get all person roles
	 * @param person Person
	 * @return List of role instances
	 */
	public abstract List<RoleInstance> getRolesForPerson(OrgchartPerson person);

	/**
	 * Returns role instance by id
	 * @param id Id of role instance
	 * @return Role instance
	 */
	public abstract RoleInstance getRoleInstanceById(String id);

	/*
	 * Orgchart branches related operations
	 */
	/**
	 * Returns branch by name
	 * @param name Name of the branch
	 * @return Orgchart unit corresponding to the branch
	 */
	public abstract OrgchartUnit getBranch(String name);

	/**
	 * Checks if orgchart branch exists or not
	 * @param name Branch name
	 * @return True if branch exists and false otherwise
	 */
	public abstract boolean branchExists(String name);

	/**
	 * Creates new orgchart branch
	 * @param name Branch name
	 * @param group Name of the group for branch
	 * @return Orgchart unit for new branch
	 * @throws Exception
	 */
	public abstract OrgchartUnit createBranch(String name, String displayName);

	/**
	 * Drops orgchart branch
	 * @param name Name of the branch
	 */
	public abstract void dropBranch(String name);

	/**
	 * Lists orgchart branches
	 * @return List of orgchart branches
	 */
	public abstract List<OrgchartUnit> getBranches();

	/**
	 * Creates new orgchart unit
	 * @param parent Parent orgchart unit
	 * @param name Name of the unit to create
	 * @param weight Unit weight
	 * @return New unit
	 */
	public abstract OrgchartUnit createUnit(OrgchartUnit parent, String name,
			String displayName, int weight);

	/**
	 * Drops orgchart unit
	 * @param unit Orgcahrt unit to delete
	 */
	public abstract void dropUnit(OrgchartUnit unit);

	/**
	 * Updates orgchart unit
	 * @param unit Orgchart unit
	 * @param displayName New display name or null
	 * @param weight New weight or null
	 * @return Orgchart unit
	 */
	public abstract OrgchartUnit modifyUnit(OrgchartUnit unit,
			String displayName, Integer weight);

	/**
	 * Returns subunit by name
	 * @param parent Parent irgchart unit
	 * @param name Name of the subunit to retrieve
	 * @return Orgchart unit
	 */
	public abstract OrgchartUnit getSubunit(OrgchartUnit parent, String name);

	/**
	 * Checks if orgchart subunit exists
	 * @param parent Parent orgchart unit
	 * @param name Name of the subunit
	 * @return True if unit exists and false otherwise
	 */
	public abstract boolean subunitExists(OrgchartUnit parent, String name);

	/**
	 * Gets unit by id
	 * @param id Orgchart unit id
	 * @return Orgchart unit
	 */
	public abstract OrgchartUnit getUnitById(String id);

	/**
	 * Lists orgchart unit subunits
	 * @param unit Orgchart unit
	 * @return List of subunits
	 */
	public abstract List<OrgchartUnit> getSubunits(OrgchartUnit unit);

	/**
	 * Get parent orgchart unit 
	 * @param unit Orgchart unit
	 * @return Parent orgchart unit or null if there's no parent
	 */
	public abstract OrgchartUnit getParentUnit(OrgchartUnit unit);

	/**
	 * Resolves unit by symbolic path
	 * @param path Path to unit
	 * @return Orgchart unit or null
	 */
	public abstract OrgchartUnit resolveUnit(String path);

	/**
	 * Gets orgchart person by name
	 * @param name Person name
	 * @return Orgchart person
	 */
	public abstract OrgchartPerson getPerson(String name);

	/**
	 * Adds person to unit as member
	 * @param unit Orgchart unit
	 * @param person Orgchart person
	 */
	public abstract void addMemeber(OrgchartUnit unit, OrgchartPerson person);

	/**
	 * Removes person from unit
	 * @param unit Orgchart unit
	 * @param person Person
	 */
	public abstract void removeMember(OrgchartUnit unit, OrgchartPerson person);

	/**
	 * Checks if person is a member of unit
	 * @param unit Orgchart unit
	 * @param person Person
	 * @return True if person is a member of unit and false otherwise
	 */
	public abstract boolean isMember(OrgchartUnit unit, OrgchartPerson person);

	/**
	 * Lists members of orgchart unit
	 * @param unit Orgchart unit
	 * @return List of orgchart persons
	 */
	public abstract List<OrgchartPerson> getUnitMembers(OrgchartUnit unit);

	/**
	 * Get all units where person has membership
	 * @param person Person
	 * @return List of orgchart units
	 */
	public abstract List<OrgchartUnit> getUnitsForPerson(OrgchartPerson person);

	/**
	 * Adds person to unit as supervisor
	 * @param unit Orgchart unit
	 * @param person Orgchart person
	 */
	public abstract void addSupervisor(OrgchartUnit unit, OrgchartPerson person);

	/**
	 * Removes supervisor from unit
	 * @param unit Orgchart unit
	 * @param person Person
	 */
	public abstract void removeSupervisor(OrgchartUnit unit,
			OrgchartPerson person);

	/**
	 * Checks if person is a supervisor of unit
	 * @param unit Orgchart unit
	 * @param person Person
	 * @return True if person is a supervisor of unit and false otherwise
	 */
	public abstract boolean isSupervisor(OrgchartUnit unit,
			OrgchartPerson person);

	/**
	 * Lists supervisors of orgchart unit
	 * @param unit Orgchart unit
	 * @return List of orgchart persons
	 */
	public abstract List<OrgchartPerson> getSupervisors(OrgchartUnit unit);

	/**
	 * Get all units where person is supervisor
	 * @param person Person
	 * @return List of orgchart units
	 */
	public abstract List<OrgchartUnit> getSupervisioningUnitsForPerson(
			OrgchartPerson person);

	/**
	 * Adds person to unit as admin
	 * @param unit Orgchart unit
	 * @param person Orgchart person
	 */
	public abstract void addAdmin(OrgchartUnit unit, OrgchartPerson person);

	/**
	 * Removes admin from unit
	 * @param unit Orgchart unit
	 * @param person Person
	 */
	public abstract void removeAdmin(OrgchartUnit unit, OrgchartPerson person);

	/**
	 * Checks if person is an admin of unit
	 * @param unit Orgchart unit
	 * @param person Person
	 * @return True if person is an admin of unit and false otherwise
	 */
	public abstract boolean isAdmin(OrgchartUnit unit, OrgchartPerson person);

	/**
	 * Lists admins of orgchart unit
	 * @param unit Orgchart unit
	 * @return List of orgchart persons
	 */
	public abstract List<OrgchartPerson> getAdminsForUnit(OrgchartUnit unit);

	/**
	 * Get all units where person is supervisor
	 * @param person Person
	 * @return List of orgchart units
	 */
	public abstract List<OrgchartUnit> getAdminingUnitsForPerson(
			OrgchartPerson person);

	/**
	 * Sets out-of-office flag for person
	 * @param person Person
	 * @param value Flag value
	 */
	public abstract void setOutOfOffice(OrgchartPerson person, boolean value);

	/**
	 * Gets out-of-office flag for person
	 * @param person Person
	 * @return Out-of-office flag value(
	 */
	public abstract boolean isOutOfOffice(OrgchartPerson person);

	/**
	 * Sets orgchart delegation
	 * @param role Role to delegate
	 * @param source Person to delegate role from
	 * @param target Person to delegate role to
	 * @return Orgchart delegation
	 */
	public abstract OrgchartDelegation setDelegation(RoleInstance role,
			OrgchartPerson source, OrgchartPerson target);

	/**
	 * Sets default orgchart delegation
	 * @param source Person to delegate role from
	 * @param target Person to delegate role to
	 * @return Orgchart delegation
	 */
	public abstract OrgchartDelegation setDefaultDelegation(
			OrgchartPerson source, OrgchartPerson target);

	/**
	 * Removes delegation
	 * @param delegation Delegation to remove
	 */
	public abstract void removeDelegation(OrgchartDelegation delegation);

	/**
	 * Lists all source delegations for person
	 * @param person Person to get delegations for
	 * @return List of orgchart delegations
	 */
	public abstract List<OrgchartDelegation> getSourceDelegationsForPerson(
			OrgchartPerson person);

	/**
	 * Lists all target delegations for person
	 * @param person Person to get delegations for
	 * @return List of orgchart delegations
	 */
	public abstract List<OrgchartDelegation> getTargetDelegationsForPerson(
			OrgchartPerson person);

	/**
	 * Lists all delegations for role instance
	 * @param role Role to get delegations for
	 * @return List of orgchart delegations
	 */
	public abstract List<OrgchartDelegation> getDelegationsForRole(
			RoleInstance role);

	/**
	 * Lists all delegations for unit
	 * @param unit Unit to get delegations for
	 * @return List of orgchart delegations
	 */
	public abstract List<OrgchartDelegation> getDelegationsForUnit(
			OrgchartUnit unit);

	/**
	 * Get default delegation for person
	 * @param unit Unit to get delegations for
	 * @return List of orgchart delegations
	 */
	public abstract OrgchartDelegation getDefaultDelegationForPerson(
			OrgchartPerson person);

	/**
	 * Returns orgchart delegation specified by role and source 
	 * @param role Role to find delegation for
	 * @param source Source person to find delegation for
	 * @return Orgchart delegation
	 */
	public abstract OrgchartDelegation getDelegation(RoleInstance role,
			OrgchartPerson source);

}