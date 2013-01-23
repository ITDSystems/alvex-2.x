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

import org.alfresco.service.cmr.repository.NodeRef;

public class RoleDefinition {
	private String name;
	private int weight;
	private String groupName;
	private NodeRef node;
	private String displayName;
	private String id;

	public String getName() {
		return name;
	}

	public String getDisplayName() {
		return displayName;
	}

	public int getWeight() {
		return weight;
	}

	public String getId() {
		return id;
	}

	public String getGroupName() {
		return groupName;
	}

	public NodeRef getNode() {
		return node;
	}

	public RoleDefinition(NodeRef node, int weight, String name,
			String displayName, String groupName) {
		this.node = node;
		this.weight = weight;
		this.name = name;
		this.displayName = displayName;
		this.groupName = groupName;
		this.id = node.getId();
	}
}
