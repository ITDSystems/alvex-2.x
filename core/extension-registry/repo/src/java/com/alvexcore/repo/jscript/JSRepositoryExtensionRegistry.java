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

import java.io.Serializable;
import java.util.ArrayList;

import org.alfresco.repo.jscript.BaseScopableProcessorExtension;
import org.alfresco.repo.jscript.ValueConverter;
import org.mozilla.javascript.Scriptable;
import org.springframework.beans.factory.annotation.Required;

import com.alvexcore.license.LicenseInfo;
import com.alvexcore.license.LicenseStatus;
import com.alvexcore.repo.RepositoryExtension;
import com.alvexcore.repo.RepositoryExtensionRegistry;

/**
 * Root scope object implementation for Repository
 * 
 * 
 */

public class JSRepositoryExtensionRegistry extends BaseScopableProcessorExtension {
	private RepositoryExtensionRegistry registry;
	private ValueConverter converter = new ValueConverter();

	@Required
	public void setRepositoryExtensionRegistry(
			RepositoryExtensionRegistry registry) {
		this.registry = registry;
	}

	// wrap methods
	public Scriptable getInstalledExtensions() {
		ArrayList<Serializable> result = new ArrayList<Serializable>();
		for (RepositoryExtension ext: registry.getInstalledExtensions())
			result.add(new JSRepositoryExtension(registry.getServiceRegistry(), getScope(), ext));
		return (Scriptable)converter.convertValueForScript(registry.getServiceRegistry(), getScope(), null, result);
	}

	public String getSystemId() {
		return registry.getSystemId();
	}

	public int getServerCores() {
		return registry.getServerCores();
	}

	public long getRegisteredUsers() {
		return registry.getRegisteredUsers();
	}

	public LicenseInfo getLicense() {
		return registry.getLicenseInfo();
	}
	
	public LicenseStatus checkLicense() {
		return registry.getLicenseStatus();
	}
	
	public String getReleaseVersion() {
		return registry.getVersion();
	}
	
	public String getReleaseEdition() {
		return registry.getEdition();
	}
	
	public String getReleaseCodename() {
		return registry.getCodename();
	}
}
