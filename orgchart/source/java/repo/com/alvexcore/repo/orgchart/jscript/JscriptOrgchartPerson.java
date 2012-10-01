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
import java.util.HashSet;

import org.alfresco.model.ContentModel;
import org.alfresco.repo.jscript.ValueConverter;
import org.alfresco.service.ServiceRegistry;
import org.alfresco.service.cmr.repository.NodeRef;
import org.mozilla.javascript.Scriptable;

import com.alvexcore.repo.orgchart.OrgchartPerson;
import com.alvexcore.repo.orgchart.OrgchartService;
import com.alvexcore.repo.orgchart.OrgchartUnit;

public class JscriptOrgchartPerson implements Serializable {

	private static final long serialVersionUID = -317803369618808341L;
	private OrgchartService orgchartService;
	private ServiceRegistry serviceRegistry;
	private OrgchartPerson person;
	final private Scriptable scope;
	private ValueConverter converter = new ValueConverter();

	public JscriptOrgchartPerson(OrgchartService orgchartService,
			ServiceRegistry serviceRegistry, final Scriptable scope,
			OrgchartPerson person) {
		this.orgchartService = orgchartService;
		this.serviceRegistry = serviceRegistry;
		this.person = person;
		this.scope = scope;
	}

	public String getUserName() {
		return person.getName();
	}

	public NodeRef getNode() {
		return person.getNode();
	}

	public String getFirstName() {
		return (String) serviceRegistry.getNodeService().getProperty(getNode(),
				ContentModel.PROP_FIRSTNAME);
	}

	public String getLastName() {
		return (String) serviceRegistry.getNodeService().getProperty(getNode(),
				ContentModel.PROP_LASTNAME);
	}

	public Scriptable getManagees() throws Exception {
		HashSet<Serializable> result = new HashSet<Serializable>();
		for (OrgchartUnit unit : orgchartService
				.getSupervisioningUnitsForPerson(person))
			for (OrgchartPerson person : orgchartService.listMembers(unit))
				result.add(new JscriptOrgchartPerson(orgchartService,
						serviceRegistry, scope, person));
		return (Scriptable) converter.convertValueForScript(serviceRegistry,
				scope, null, result);
	}

}
