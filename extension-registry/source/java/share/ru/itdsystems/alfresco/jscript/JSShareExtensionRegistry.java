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
package ru.itdsystems.alfresco.jscript;

import java.util.HashMap;
import java.util.Map;

import org.mozilla.javascript.Scriptable;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.extensions.webscripts.processor.BaseProcessorExtension;

import ru.itdsystems.alfresco.ExtensionUpdateInfo;
import ru.itdsystems.alfresco.ShareExtensionRegistry;

/**
 * Root scope object implementation for Share
 * 
 * @author Alexey Ermakov
 * 
 */
public class JSShareExtensionRegistry extends BaseProcessorExtension implements
		InitializingBean {
	private ShareExtensionRegistry registry;

	@Override
	public void afterPropertiesSet() throws Exception {
		if (registry == null)
			throw new Exception(
					"ShareExtensionRegistry is not set, it's fatal.");
	}

	public void setShareExtensionRegistry(ShareExtensionRegistry registry) {
		this.registry = registry;
	}

	// wrap methods
	public Object[] getInstalledExtensions() {
		return registry.getInstalledExtensions().toArray();
	}

	public String getSystemId() {
		return registry.getSystemId();
	}

	// it's really bad method, but… :)
	public Map<String, String> convertToMap(Scriptable obj) {
		Object[] propIds = obj.getIds();
		Map<String, String> result = new HashMap<String, String>(propIds.length);
		for (int i = 0; i < propIds.length; i++) {
			Object propId = propIds[i];
			if (propId instanceof String) {
				Object val = obj.get((String) propId, obj);
				result.put((String) propId, (String) val);
			}
		}

		return result;
	}

	public ExtensionUpdateInfo checkForUpdates(String extensionId,
			String shareId, Object shareHashes, String shareVersion,
			String repoId, Object repoHashes, String repoVersion)
			throws Exception {
		return registry.checkForUpdates(extensionId, shareId,
				convertToMap((Scriptable) shareHashes), shareVersion, repoId,
				convertToMap((Scriptable) repoHashes), repoVersion);
	}

}
