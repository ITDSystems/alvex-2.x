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

import org.alfresco.repo.jscript.BaseScopableProcessorExtension;
import org.alfresco.repo.jscript.ValueConverter;
import org.alfresco.service.ServiceRegistry;
import org.mozilla.javascript.Scriptable;
import org.springframework.beans.factory.annotation.Required;

import com.alvexcore.repo.orgchart.OrgchartService;
import com.alvexcore.repo.orgchart.OrgchartUnit;
import com.alvexcore.repo.orgchart.RoleDefinition;

public class JscriptOrgchart extends BaseScopableProcessorExtension {
	private OrgchartService orgchartService;
	private ServiceRegistry serviceRegistry;
	private ValueConverter converter = new ValueConverter();

	/**
	 * Sets orgchart service
	 * 
	 * @param orgchartService
	 *            Orgchart service instance
	 */
	@Required
	public void setOrgchartService(OrgchartService orgchartService) {
		this.orgchartService = orgchartService;
	}

	/**
	 * Sets service registru
	 * 
	 * @param serviceRegistry
	 *            Service registry instance
	 */
	public void setServiceRegistry(ServiceRegistry serviceRegistry) {
		this.serviceRegistry = serviceRegistry;
	}

	/**
	 * Gets list of branches
	 * 
	 * @return List of orgchart branches
	 * @throws Exception
	 */
	public Scriptable getBranches() throws Exception {
		ArrayList<Serializable> result = new ArrayList<Serializable>();
		for (OrgchartUnit unit : orgchartService.listBranches())
			result.add(new JscriptOrgchartUnit(orgchartService,
					serviceRegistry, getScope(), unit));
		return (Scriptable) converter.convertValueForScript(serviceRegistry,
				getScope(), null, result);
	}

	/**
	 * Gets list of roles
	 * 
	 * @return List of orgchart roles
	 * @throws Exception
	 */
	public Scriptable getRoles() throws Exception {
		ArrayList<Serializable> result = new ArrayList<Serializable>();
		for (RoleDefinition role : orgchartService.listRoles())
			result.add(new JscriptRoleDefinition(orgchartService, role,
					getScope()));
		return (Scriptable) converter.convertValueForScript(serviceRegistry,
				getScope(), null, result);
	}

	/**
	 * Gets role definition by name
	 * 
	 * @return List of orgchart roles
	 * @throws Exception
	 */
	public JscriptRoleDefinition getRole(String name) throws Exception {
		return new JscriptRoleDefinition(orgchartService,
				orgchartService.getRole(name),
				getScope());
	}

	/**
	 * Gets role definition by id
	 * 
	 * @return Role definition
	 * @throws Exception
	 */
	public JscriptRoleDefinition getRoleById(String id) throws Exception {
		return new JscriptRoleDefinition(orgchartService,
				orgchartService.getRoleById(id),
				getScope());
	}
	
	/**
	 * Creates new orgchart role
	 * @param name Role name
	 * @param displayName Role display name
	 * @param weight Role weight
	 * @return Role definition
	 * @throws Exception
	 */
	public JscriptRoleDefinition createRole(String name, String displayName,
			int weight) throws Exception {
		return new JscriptRoleDefinition(orgchartService,
				orgchartService.createRole(name, weight, displayName),
				getScope());
	}

	/**
	 * Gets orgchart unit by id
	 * 
	 * @param id
	 *            Orgchart unit id
	 * @return Orgchart unit
	 * @throws Exception
	 */
	public JscriptOrgchartUnit getUnit(String id) throws Exception {
		return new JscriptOrgchartUnit(orgchartService, serviceRegistry,
				getScope(), orgchartService.getUnitById(id));
	}

	/**
	 * Creates orgchart branch
	 * 
	 * @param name
	 *            Orgchart branch name
	 * @return Orgchart branch
	 * @throws Exception
	 */
	public JscriptOrgchartUnit createBranch(String name, String displayName)
			throws Exception {
		return new JscriptOrgchartUnit(orgchartService, serviceRegistry,
				getScope(), orgchartService.createBranch(name, displayName));
	}

	/**
	 * Returns orgchart branch by name
	 * @param name Branch name
	 * @return Orgchart unit for branch
	 * @throws Exception
	 */
	public JscriptOrgchartUnit getBranch(String name) throws Exception {
		return new JscriptOrgchartUnit(orgchartService, serviceRegistry,
				getScope(), orgchartService.getBranch(name));
	}

	/**
	 * Drops orgchart branch
	 * @param name Orgchart branch name
	 * @throws Exception
	 */
	public void dropBranch(String name) throws Exception {
		orgchartService.dropBranch(name);
	}

	/**
	 * Drops orgchart role
	 * @param name Orgchart role name
	 * @throws Exception
	 */
	public void dropRole(String name) throws Exception {
		orgchartService.dropRole(name);
	}

	/**
	 * Inits orgchart
	 * 
	 * @throws Exception
	 */
	public void init() throws Exception {
		orgchartService.init();
	}

	/**
	 * Checks if orgchart exists
	 * 
	 * @throws Exception
	 */
	public boolean exists() throws Exception {
		return orgchartService.exists();
	}
	
	/**
	 * Drops orgchart
	 * 
	 * @throws Exception
	 */
	public void drop() throws Exception {
		orgchartService.drop();
	}

	public void dropUnit(String id) throws Exception {
		orgchartService.dropUnit(orgchartService.getUnitById(id));
	}

	/**
	 * Returns orgchart person
	 * @param name Person name
	 * @return Orgchart person
	 * @throws Exception
	 */
	public JscriptOrgchartPerson getPerson(String name) throws Exception {
		return new JscriptOrgchartPerson(orgchartService, serviceRegistry,
				getScope(), orgchartService.getPerson(name));
	}
}