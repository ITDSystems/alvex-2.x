/*
 * Copyright © 2014 ITD Systems
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

package com.alvexcore.repo.registries;

public class CommitNumberResult {

	private boolean success;
	private String reason;
	private String id;
	private String nodeRef;
			
	public CommitNumberResult(boolean success, String reason, String id, String nodeRef) {
		this.success = success;
		this.reason = reason;
		this.id = id;
		this.nodeRef = nodeRef;
	}

	public boolean getSuccess()
	{
		return success;
	}
	
	public String getReason()
	{
		return reason;
	}
	
	public String getId()
	{
		return id;
	}
	
	public String getNodeRef()
	{
		return nodeRef;
	}
}