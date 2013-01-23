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
import java.util.HashSet;

import org.alfresco.model.ContentModel;
import org.alfresco.repo.jscript.ScriptNode;
import org.alfresco.repo.jscript.ValueConverter;
import org.alfresco.service.ServiceRegistry;
import org.alfresco.service.cmr.repository.NodeRef;
import org.mozilla.javascript.Scriptable;

import com.alvexcore.repo.orgchart.OrgchartDelegation;
import com.alvexcore.repo.orgchart.OrgchartPerson;
import com.alvexcore.repo.orgchart.OrgchartService;
import com.alvexcore.repo.orgchart.RoleInstance;

public class JscriptRoleInstance implements Serializable {

	private static final long serialVersionUID = 1299322217618513957L;

	private ServiceRegistry serviceRegistry;
	private OrgchartService orgchartService;
	private RoleInstance role;
	private ValueConverter converter = new ValueConverter();
	private final Scriptable scope;

	public JscriptRoleInstance(OrgchartService orgchartService,
			ServiceRegistry serviceRegistry, Scriptable scope, RoleInstance role) {
		this.orgchartService = orgchartService;
		this.serviceRegistry = serviceRegistry;
		this.role = role;
		this.scope = scope;
	}

	public JscriptRoleDefinition getDefinition() {
		return new JscriptRoleDefinition(orgchartService,
				orgchartService.getDefinitionForRole(role), scope);
	}

	public Scriptable getAssignees() {
		ArrayList<Serializable> result = new ArrayList<Serializable>();
		for (OrgchartPerson person : orgchartService.getRoleAssignees(role))
			result.add(new JscriptOrgchartPerson(orgchartService,
					serviceRegistry, scope, person));
		return (Scriptable) converter.convertValueForScript(serviceRegistry,
				scope, null, result);
	}

	public void addMember(ScriptNode person) {
		// FIXME this depends on Alfresco content model, think
		// about API to retrieve person by reference
		orgchartService.assignRole(
				role,
				new OrgchartPerson(person.getNodeRef(),
						(String) serviceRegistry.getNodeService()
								.getProperty(person.getNodeRef(),
										ContentModel.PROP_USERNAME)));
	}

	public void deleteMember(ScriptNode person) {
		// FIXME this depends on Alfresco content model, think
		// about API to retrieve person by reference
		orgchartService.revokeRole(
				role,
				new OrgchartPerson(person.getNodeRef(),
						(String) serviceRegistry.getNodeService()
								.getProperty(person.getNodeRef(),
										ContentModel.PROP_USERNAME)));
	}

	public Scriptable getDelegations() {
		HashSet<Serializable> result = new HashSet<Serializable>();
		for (OrgchartDelegation delegation : orgchartService
				.getDelegationsForRole(role))
			result.add(new JscriptOrgchartDelegation(orgchartService,
					serviceRegistry, scope, delegation));
		return (Scriptable) converter.convertValueForScript(serviceRegistry,
				scope, null, result);
	}

	public JscriptOrgchartDelegation setDelegation(ScriptNode source,
			ScriptNode target) {
		OrgchartPerson sourcePerson = new OrgchartPerson(source.getNodeRef(),
				(String) serviceRegistry.getNodeService().getProperty(
						source.getNodeRef(), ContentModel.PROP_USERNAME));
		OrgchartPerson targetPerson = new OrgchartPerson(target.getNodeRef(),
				(String) serviceRegistry.getNodeService().getProperty(
						target.getNodeRef(), ContentModel.PROP_USERNAME));
		return new JscriptOrgchartDelegation(orgchartService, serviceRegistry,
				scope, orgchartService.setDelegation(role, sourcePerson,
						targetPerson));
	}

	public NodeRef getNode() {
		return role.getNode();
	}
}
