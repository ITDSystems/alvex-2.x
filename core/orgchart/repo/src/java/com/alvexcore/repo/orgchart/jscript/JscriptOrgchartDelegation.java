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

import org.alfresco.service.ServiceRegistry;
import org.mozilla.javascript.Scriptable;

import com.alvexcore.repo.orgchart.OrgchartDelegation;
import com.alvexcore.repo.orgchart.OrgchartService;

public class JscriptOrgchartDelegation implements Serializable {

	private static final long serialVersionUID = 4239238747349666924L;
	private OrgchartDelegation delegation;
	private OrgchartService orgchartService;
	private ServiceRegistry serviceRegistry;
	final private Scriptable scope;

	public JscriptOrgchartDelegation(OrgchartService orgchartService,
			ServiceRegistry serviceRegistry, final Scriptable scope,
			OrgchartDelegation delegation) {
		this.delegation = delegation;
		this.orgchartService = orgchartService;
		this.serviceRegistry = serviceRegistry;
		this.scope = scope;
	}

	public void remove() {
		orgchartService.removeDelegation(delegation);
	}

	public JscriptOrgchartPerson getSource() {
		return new JscriptOrgchartPerson(orgchartService, serviceRegistry,
				scope, delegation.getSource());
	}

	public JscriptOrgchartPerson getTarget() {
		return new JscriptOrgchartPerson(orgchartService, serviceRegistry,
				scope, delegation.getTarget());
	}

	public JscriptRoleInstance getRole() {
		return delegation.getRole() == null ? null : new JscriptRoleInstance(
				orgchartService, serviceRegistry, scope, delegation.getRole());
	}

}
