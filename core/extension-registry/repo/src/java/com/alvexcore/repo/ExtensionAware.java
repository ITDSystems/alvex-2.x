/**
 * Copyright © 2013 ITD Systems
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
package com.alvexcore.repo;

import org.springframework.beans.factory.annotation.Required;

public interface ExtensionAware {
	// We remove required annotation for the moment.
	// We do it to solve circular deps problems (ALV-749 and similar).
	// See OrgchartExtension and OrgchartService for example of the problem:
	// - extension aware service needs extension to set up (typically to create nodes in repo)
	// - repo ops may be called only after bootstrap (RepositoryExtensionRegistry takes care of it)
	// - so, extension needs a ref to service to call it during init()
	// - however, service needs a ref to extension too to call it during setUp()
	// Making this setExtension() not required allows simple unified solution - 
	//    extension just should call setExtension(this) during init()
	// @Required
	public void setExtension(RepositoryExtension extension);
}
