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

package com.alvexcore;

//import java.net.NetworkInterface;
import java.io.File;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.InitializingBean;

/**
 * Extension registry implementation
 * 
 * @author Alexey Ermakov
 * 
 */
public abstract class ExtensionRegistry implements InitializingBean {

	// list of extensions
	protected List<Extension> extensions = new ArrayList<Extension>();

	// registers new extension
	public void registerExtension(Extension extension) throws Exception {
		for (Extension ext : extensions)
			if (ext.getId().equals(extension.getId()))
				throw new Exception("Extension " + ext.getId()
						+ " is registered already");
		// register if it's not registered yet
		extensions.add(extension);
	}

	// returns a list of installed extensions
	public List<Extension> getInstalledExtensions() {
		return new ArrayList<Extension>(extensions);
	}

	// returns system id
	abstract public String getSystemId();

	@Override
	public void afterPropertiesSet() throws Exception {
//		String fileName = this.getClass().getProtectionDomain().getCodeSource().getLocation().getFile();
//		if (!fileName.endsWith(".jar"))
//			return;
//		String folderName = fileName.substring(0, fileName.lastIndexOf(File.separator));
//		File folder = new File(folderName);
//		Map<String, String> exts = new HashMap<String, String>();
//		for (File file : folder.listFiles())
//		{
//			fileName = file.getName();
//			if (fileName.contains("alvex-") && fileName.endsWith(".jar")) {
//				int slashIdx = fileName.lastIndexOf('/');
//				int hyphenIdx = fileName.lastIndexOf('-');
//				String extId = fileName.substring(slashIdx + 1, hyphenIdx);
//				if (exts.containsKey(extId))
//					throw new Exception(
//							"It seems files "
//									+ fileName
//									+ " and "
//									+ exts.get(extId)
//									+ " deploy the same Alvex extension. Only one instance of extension can be deployed. Please, check your Alvex installation.");
//				else
//					exts.put(extId, fileName);
//			}
//		}
//
	}
}
