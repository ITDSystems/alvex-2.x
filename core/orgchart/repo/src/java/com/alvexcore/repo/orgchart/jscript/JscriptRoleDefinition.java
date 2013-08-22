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

import org.alfresco.service.cmr.repository.NodeRef;
import org.mozilla.javascript.Scriptable;

import com.alvexcore.repo.orgchart.OrgchartService;
import com.alvexcore.repo.orgchart.RoleDefinition;

public class JscriptRoleDefinition implements Serializable {

	private static final long serialVersionUID = -8474270574948878114L;
	private OrgchartService orgchartService;
	private RoleDefinition role;
	private final Scriptable scope;

	public JscriptRoleDefinition(OrgchartService orgchartService,
			RoleDefinition role, final Scriptable scope) {
		this.orgchartService = orgchartService;
		this.role = role;
		this.scope = scope;
	}

	public String getName() {
		return role.getName();
	}

	public int getWeight() {
		return role.getWeight();
	}

	public String getGroupName() {
		return role.getGroupName();
	}

	public String getDisplayName() {
		return role.getDisplayName();
	}

	public String getId() {
		return role.getId();
	}

	public JscriptRoleDefinition update(String displayName, Integer weight) {
		return new JscriptRoleDefinition(
				orgchartService,
				orgchartService.modifyRole(role.getName(), weight, displayName),
				scope);
	}

	public NodeRef getNode() {
		return role.getNode();
	}

	public RoleDefinition getDefinition() {
		return role;
	}

}
