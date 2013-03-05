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
package com.alvexcore.share.jscript;

import com.alvexcore.share.ExtensionUpdateInfo;
import com.alvexcore.share.ShareExtensionRegistry;

import java.util.HashMap;
import java.util.Map;
import org.mozilla.javascript.Scriptable;
import org.springframework.beans.factory.annotation.Required;
import org.springframework.extensions.webscripts.processor.BaseProcessorExtension;

/**
 * Root scope object implementation for Share
 * 
 * 
 */
public class JSShareExtensionRegistry extends BaseProcessorExtension {
	private ShareExtensionRegistry registry;

	@Required
	public void setShareExtensionRegistry(ShareExtensionRegistry registry) {
		this.registry = registry;
	}

	// wrap methods
	public Object[] getInstalledExtensions() {
		return registry.getInstalledExtensions().toArray();
	}

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
			String shareId, Scriptable shareHashes, String shareVersion,
			String repoId, Scriptable repoHashes, String repoVersion, String licenseId)
			throws Exception {
		return registry.checkForUpdates(extensionId, shareId,
				convertToMap(shareHashes), shareVersion, repoId,
				convertToMap(repoHashes), repoVersion, licenseId);
	}

}