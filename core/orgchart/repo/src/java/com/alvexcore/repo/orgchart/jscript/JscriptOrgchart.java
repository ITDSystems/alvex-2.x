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
package com.alvexcore.repo.orgchart.jscript;

import java.io.Serializable;
import java.util.ArrayList;

import org.alfresco.model.ContentModel;
import org.alfresco.repo.jscript.BaseScopableProcessorExtension;
import org.alfresco.repo.jscript.ScriptNode;
import org.alfresco.repo.jscript.ValueConverter;
import org.alfresco.service.ServiceRegistry;
import org.mozilla.javascript.Scriptable;
import org.springframework.beans.factory.annotation.Required;

import com.alvexcore.repo.orgchart.OrgchartDelegation;
import com.alvexcore.repo.orgchart.OrgchartPerson;
import com.alvexcore.repo.orgchart.OrgchartService;
import com.alvexcore.repo.orgchart.OrgchartUnit;
import com.alvexcore.repo.orgchart.RoleDefinition;
import com.alvexcore.repo.orgchart.RoleInstance;

public class JscriptOrgchart extends BaseScopableProcessorExtension {
	private OrgchartService orgchartService;
	private ServiceRegistry serviceRegistry;
	private ValueConverter converter = new ValueConverter();

	/**
	 * Sets orgchart service
	 * @param orgchartService
	 */
	@Required
	public void setOrgchartService(OrgchartService orgchartService) {
		this.orgchartService = orgchartService;
		this.serviceRegistry = orgchartService.getServiceRegistry();
	}

	/**
	 * Gets list of branches
	 * @return List of orgchart branches
	 */
	public Scriptable getBranches() {
		ArrayList<Serializable> result = new ArrayList<Serializable>();
		for (OrgchartUnit unit : orgchartService.getBranches())
			result.add(new JscriptOrgchartUnit(orgchartService,
					serviceRegistry, getScope(), unit));
		return (Scriptable) converter.convertValueForScript(serviceRegistry,
				getScope(), null, result);
	}

	/**
	 * Gets list of roles
	 * @return List of orgchart roles
	 */
	public Scriptable getRoles() {
		ArrayList<Serializable> result = new ArrayList<Serializable>();
		for (RoleDefinition role : orgchartService.getRoleDefinitions())
			result.add(new JscriptRoleDefinition(orgchartService, role,
					getScope()));
		return (Scriptable) converter.convertValueForScript(serviceRegistry,
				getScope(), null, result);
	}

	/**
	 * Gets role definition by name
	 * @return List of orgchart roles
	 */
	public JscriptRoleDefinition getRole(String name) {
		return new JscriptRoleDefinition(orgchartService,
				orgchartService.getRole(name), getScope());
	}

	/**
	 * Gets role definition by id
	 * @return Role definition
	 */
	public JscriptRoleDefinition getRoleById(String id) {
		return new JscriptRoleDefinition(orgchartService,
				orgchartService.getRoleById(id), getScope());
	}

	/**
	 * Creates new orgchart role
	 * @param name Role name
	 * @param displayName Role display name
	 * @param weight Role weight
	 * @return Role definition
	 */
	public JscriptRoleDefinition createRole(String name, String displayName,
			int weight) {
		return new JscriptRoleDefinition(orgchartService,
				orgchartService.createRole(name, weight, displayName),
				getScope());
	}

	/**
	 * Gets orgchart unit by id
	 * @param id Orgchart unit id
	 * @return Orgchart unit
	 */
	public JscriptOrgchartUnit getUnit(String id) {
		return new JscriptOrgchartUnit(orgchartService, serviceRegistry,
				getScope(), orgchartService.getUnitById(id));
	}

	/**
	 * Creates orgchart branch
	 * @param name Orgchart branch name
	 * @return Orgchart branch
	 * @throws Exception
	 */
	public JscriptOrgchartUnit createBranch(String name, String displayName) {
		return new JscriptOrgchartUnit(orgchartService, serviceRegistry,
				getScope(), orgchartService.createBranch(name, displayName));
	}

	/**
	 * Returns orgchart branch by name
	 * @param name Branch name
	 * @return Orgchart unit for branch
	 */
	public JscriptOrgchartUnit getBranch(String name) {
		return new JscriptOrgchartUnit(orgchartService, serviceRegistry,
				getScope(), orgchartService.getBranch(name));
	}

	/**
	 * Drops orgchart branch
	 * @param name Orgchart branch name
	 */
	public void dropBranch(String name) {
		orgchartService.dropBranch(name);
	}

	/**
	 * Drops orgchart role
	 * @param name Orgchart role name
	 */
	public void dropRole(String name) {
		orgchartService.dropRole(name);
	}

	/**
	 * Inits orgchart
	 * @throws Exception
	 */
	public void init() {
		orgchartService.init();
	}

	/**
	 * Checks if orgchart exists
	 */
	public boolean exists() {
		return orgchartService.exists();
	}

	/**
	 * Drops orgchart
	 */
	public void drop() {
		orgchartService.drop();
	}

	/**
	 * Drops unit
	 * @param id Id of unit to drop
	 */
	public void dropUnit(String id) {
		orgchartService.dropUnit(orgchartService.getUnitById(id));
	}

	/**
	 * Returns orgchart person
	 * @param name Person name
	 * @return Orgchart person
	 */
	public JscriptOrgchartPerson getPerson(String name) {
		return new JscriptOrgchartPerson(orgchartService, serviceRegistry,
				getScope(), orgchartService.getPerson(name));
	}

	/**
	 * Sets orgchart delegation
	 * @param role Role to set delegation for
	 * @param source Delegation source person
	 * @param target Delegation target person
	 * @return Orgchart delegation
	 */
	public JscriptOrgchartDelegation setDelegation(JscriptRoleInstance role,
			ScriptNode source, ScriptNode target) {
		OrgchartPerson sourcePerson = new OrgchartPerson(source.getNodeRef(),
				(String) serviceRegistry.getNodeService().getProperty(
						source.getNodeRef(), ContentModel.PROP_USERNAME));
		OrgchartPerson targetPerson = new OrgchartPerson(target.getNodeRef(),
				(String) serviceRegistry.getNodeService().getProperty(
						target.getNodeRef(), ContentModel.PROP_USERNAME));
		RoleInstance roleInstance = new RoleInstance(role.getNode(), role
				.getDefinition().getNode());
		OrgchartDelegation delegation = orgchartService.setDelegation(
				roleInstance, sourcePerson, targetPerson);
		return new JscriptOrgchartDelegation(orgchartService, serviceRegistry,
				getScope(), delegation);
	}

	/**
	 * Sets default delegation
	 * @param source Delegation source person
	 * @param target Delegation target person
	 * @return Orgchart delegation
	 */
	public JscriptOrgchartDelegation setDelegation(ScriptNode source,
			ScriptNode target) {
		OrgchartPerson sourcePerson = new OrgchartPerson(source.getNodeRef(),
				(String) serviceRegistry.getNodeService().getProperty(
						source.getNodeRef(), ContentModel.PROP_USERNAME));
		OrgchartPerson targetPerson = new OrgchartPerson(target.getNodeRef(),
				(String) serviceRegistry.getNodeService().getProperty(
						target.getNodeRef(), ContentModel.PROP_USERNAME));
		OrgchartDelegation delegation = orgchartService.setDefaultDelegation(
				sourcePerson, targetPerson);
		return new JscriptOrgchartDelegation(orgchartService, serviceRegistry,
				getScope(), delegation);
	}
	
	/**
	 * Gets list of units with certain role assigned
	 * @param name Name of the role definition
	 * @return List of orgchart units
	 */
	public Scriptable getUnitsWithRoleAdded(String name) {
		ArrayList<Serializable> result = new ArrayList<Serializable>();
		RoleDefinition role = orgchartService.getRole(name);
		for (OrgchartUnit unit : orgchartService.getUnitsWithRoleAdded(role))
			result.add(new JscriptOrgchartUnit(orgchartService,
					serviceRegistry, getScope(), unit));
		return (Scriptable) converter.convertValueForScript(serviceRegistry,
				getScope(), null, result);
	}

}