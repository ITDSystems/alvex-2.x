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
package com.alvexcore.repo.jscript;

import org.alfresco.repo.processor.BaseProcessorExtension;
import org.springframework.beans.factory.annotation.Required;

import com.alvexcore.license.LicenseInfo;
import com.alvexcore.repo.RepositoryExtensionRegistry;

/**
 * Root scope object implementation for Repository
 * 
 * 
 */

public class JSRepositoryExtensionRegistry extends BaseProcessorExtension {
	private RepositoryExtensionRegistry registry;

	@Required
	public void setRepositoryExtensionRegistry(
			RepositoryExtensionRegistry registry) {
		this.registry = registry;
	}

	// wrap methods
	public Object[] getInstalledExtensions() {
		return registry.getInstalledExtensions().toArray();
	}

	public String getSystemId() {
		return registry.getSystemId();
	}

	public LicenseInfo getLicense() {
		return registry.getLicenseInfo();
	}
}
