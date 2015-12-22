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
import org.alfresco.repo.jscript.ScriptNode;
import org.alfresco.repo.jscript.ValueConverter;
import org.alfresco.service.ServiceRegistry;
import org.alfresco.service.cmr.repository.NodeRef;
import org.mozilla.javascript.Scriptable;

import com.alvexcore.repo.orgchart.OrgchartDelegation;
import com.alvexcore.repo.orgchart.OrgchartPerson;
import com.alvexcore.repo.orgchart.OrgchartService;
import com.alvexcore.repo.orgchart.OrgchartUnit;
import com.alvexcore.repo.orgchart.RoleInstance;

public class JscriptOrgchartUnit implements Serializable {
	private static final long serialVersionUID = 5576181318531699960L;
	private OrgchartService orgchartService;
	private ServiceRegistry serviceRegistry;
	private OrgchartUnit orgchartUnit;
	private final Scriptable scope;
	private ValueConverter converter = new ValueConverter();

	public JscriptOrgchartUnit(OrgchartService orgchartService,
			ServiceRegistry serviceRegistry, final Scriptable scope,
			OrgchartUnit orgchartUnit) {
		this.orgchartService = orgchartService;
		this.orgchartUnit = orgchartUnit;
		this.serviceRegistry = serviceRegistry;
		this.scope = scope;
	}

	public String getGroupRef() {
		return orgchartUnit.getGroupRef().toString();
	}

	public String getGroupName() {
		return orgchartUnit.getGroupName();
	}

	public String getName() {
		return orgchartUnit.getName();
	}

	public String getDisplayName() {
		return orgchartUnit.getDisplayName();
	}

	public String getId() {
		return orgchartUnit.getId();
	}

	public int getWeight() {
		return orgchartUnit.getWeight();
	}

	public OrgchartUnit getUnit() {
		return orgchartUnit;
	}

	public NodeRef getNode() {
		return orgchartUnit.getNode();
	}

	public JscriptOrgchartUnit getParent() {
		return new JscriptOrgchartUnit(orgchartService, serviceRegistry, scope,
				orgchartService.getParentUnit(orgchartUnit));
	}

	public Scriptable getChildren() {
		ArrayList<Serializable> result = new ArrayList<Serializable>();
		for (OrgchartUnit unit : orgchartService.getSubunits(orgchartUnit))
			result.add(new JscriptOrgchartUnit(orgchartService,
					serviceRegistry, scope, unit));
		return (Scriptable) converter.convertValueForScript(serviceRegistry,
				scope, null, result);
	}

	public Scriptable getMembers() {
		ArrayList<Serializable> result = new ArrayList<Serializable>();
		for (OrgchartPerson person : orgchartService
				.getUnitMembers(orgchartUnit))
			result.add(new JscriptOrgchartPerson(orgchartService,
					serviceRegistry, scope, person));
		return (Scriptable) converter.convertValueForScript(serviceRegistry,
				scope, null, result);
	}

	public Scriptable getAdmins() {
		ArrayList<Serializable> result = new ArrayList<Serializable>();
		for (OrgchartPerson person : orgchartService
				.getAdminsForUnit(orgchartUnit))
			result.add(new JscriptOrgchartPerson(orgchartService,
					serviceRegistry, scope, person));
		return (Scriptable) converter.convertValueForScript(serviceRegistry,
				scope, null, result);
	}

	public Scriptable getSupervisors() {
		ArrayList<Serializable> result = new ArrayList<Serializable>();
		for (OrgchartPerson person : orgchartService
				.getSupervisors(orgchartUnit))
			result.add(new JscriptOrgchartPerson(orgchartService,
					serviceRegistry, scope, person));
		return (Scriptable) converter.convertValueForScript(serviceRegistry,
				scope, null, result);
	}

	public Scriptable getRoles() {
		ArrayList<Serializable> result = new ArrayList<Serializable>();
		for (RoleInstance role : orgchartService.getUnitRoles(orgchartUnit))
			result.add(new JscriptRoleInstance(orgchartService,
					serviceRegistry, scope, role));
		return (Scriptable) converter.convertValueForScript(serviceRegistry,
				scope, null, result);
	}

	public JscriptOrgchartUnit createUnit(String name, String displayName,
			int weight) {
		return new JscriptOrgchartUnit(orgchartService, serviceRegistry, scope,
				orgchartService.createUnit(orgchartUnit, name, displayName,
						weight));
	}

	public JscriptOrgchartUnit syncUnit(String groupShortName) {
		return new JscriptOrgchartUnit(orgchartService, serviceRegistry, scope,
				orgchartService.syncUnit(orgchartUnit, groupShortName));
	}

	public JscriptOrgchartUnit update(String displayName, int weight) {
		return new JscriptOrgchartUnit(orgchartService, serviceRegistry, scope,
				orgchartService.modifyUnit(orgchartUnit, displayName, weight));
	}
	
	public void move(JscriptOrgchartUnit newParent) {
		orgchartService.moveUnit(orgchartUnit, newParent.getUnit());
	}

	public void addMember(ScriptNode person) {
		// FIXME this depends on Alfresco content model, think
		// about API to retrieve person by reference
		orgchartService.addMember(
				orgchartUnit,
				new OrgchartPerson(person.getNodeRef(),
						(String) serviceRegistry.getNodeService()
								.getProperty(person.getNodeRef(),
										ContentModel.PROP_USERNAME)));
	}

	public void deleteMember(ScriptNode person) {
		// FIXME this depends on Alfresco content model, think
		// about API to retrieve person by reference
		orgchartService.removeMember(
				orgchartUnit,
				new OrgchartPerson(person.getNodeRef(),
						(String) serviceRegistry.getNodeService()
								.getProperty(person.getNodeRef(),
										ContentModel.PROP_USERNAME)));
	}

	public void addAdmin(ScriptNode person) {
		// FIXME this depends on Alfresco content model, think
		// about API to retrieve person by reference
		orgchartService.addAdmin(
				orgchartUnit,
				new OrgchartPerson(person.getNodeRef(),
						(String) serviceRegistry.getNodeService()
								.getProperty(person.getNodeRef(),
										ContentModel.PROP_USERNAME)));
	}

	public void deleteAdmin(ScriptNode person) {
		// FIXME this depends on Alfresco content model, think
		// about API to retrieve person by reference
		orgchartService.removeAdmin(
				orgchartUnit,
				new OrgchartPerson(person.getNodeRef(),
						(String) serviceRegistry.getNodeService()
								.getProperty(person.getNodeRef(),
										ContentModel.PROP_USERNAME)));
	}

	public void addSupervisor(ScriptNode person) {
		// FIXME this depends on Alfresco content model, think
		// about API to retrieve person by reference
		orgchartService.addSupervisor(
				orgchartUnit,
				new OrgchartPerson(person.getNodeRef(),
						(String) serviceRegistry.getNodeService()
								.getProperty(person.getNodeRef(),
										ContentModel.PROP_USERNAME)));
	}

	public void deleteSupervisor(ScriptNode person) {
		// FIXME this depends on Alfresco content model, think
		// about API to retrieve person by reference
		orgchartService.removeSupervisor(
				orgchartUnit,
				new OrgchartPerson(person.getNodeRef(),
						(String) serviceRegistry.getNodeService()
								.getProperty(person.getNodeRef(),
										ContentModel.PROP_USERNAME)));
	}

	public void addRole(String roleName) {
		orgchartService
				.addRole(orgchartUnit, orgchartService.getRole(roleName));
	}

	public void removeRole(String roleName) {
		orgchartService.removeRole(orgchartUnit,
				orgchartService.getRole(roleName));
	}

	public JscriptRoleInstance getRole(String roleName) {
		return new JscriptRoleInstance(orgchartService, serviceRegistry, scope,
				orgchartService.getRoleForUnit(orgchartUnit,
						orgchartService.getRole(roleName)));
	}

	public Scriptable getDelegations(JscriptRoleDefinition role) {
		RoleInstance roleInstance = orgchartService.getRoleForUnit(
				orgchartUnit, role.getDefinition());
		ArrayList<Serializable> result = new ArrayList<Serializable>();
		for (OrgchartDelegation delegation : orgchartService
				.getDelegationsForRole(roleInstance))
			result.add(new JscriptOrgchartDelegation(orgchartService,
					serviceRegistry, scope, delegation));
		return (Scriptable) converter.convertValueForScript(serviceRegistry,
				scope, null, result);
	}

	public Scriptable getDelegations() {
		ArrayList<Serializable> result = new ArrayList<Serializable>();
		for (RoleInstance roleInstance : orgchartService
				.getUnitRoles(orgchartUnit))
			for (OrgchartDelegation delegation : orgchartService
					.getDelegationsForRole(roleInstance))
				result.add(new JscriptOrgchartDelegation(orgchartService,
						serviceRegistry, scope, delegation));
		return (Scriptable) converter.convertValueForScript(serviceRegistry,
				scope, null, result);
	}

	public JscriptOrgchartDelegation setDelegation(JscriptRoleDefinition role,
			ScriptNode source, ScriptNode target) {
		OrgchartPerson sourcePerson = new OrgchartPerson(source.getNodeRef(),
				(String) serviceRegistry.getNodeService().getProperty(
						source.getNodeRef(), ContentModel.PROP_USERNAME));
		OrgchartPerson targetPerson = new OrgchartPerson(target.getNodeRef(),
				(String) serviceRegistry.getNodeService().getProperty(
						target.getNodeRef(), ContentModel.PROP_USERNAME));
		RoleInstance roleInstance = orgchartService.getRoleForUnit(
				orgchartUnit, role.getDefinition());
		OrgchartDelegation delegation = orgchartService.setDelegation(
				roleInstance, sourcePerson, targetPerson);
		return new JscriptOrgchartDelegation(orgchartService, serviceRegistry,
				scope, delegation);
	}
}
