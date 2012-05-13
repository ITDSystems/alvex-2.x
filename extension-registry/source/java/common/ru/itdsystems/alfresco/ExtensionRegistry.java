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

package ru.itdsystems.alfresco;

//import java.net.NetworkInterface;
import java.util.ArrayList;
import java.util.Enumeration;
import java.util.Formatter;
import java.util.List;

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
	public void registerExtension(Extension extension) {
		// search if this extension is already registered
		boolean flag = true;
		for (Extension ext : extensions)
			if (ext.getId().equals(extension.getId())) {
				flag = false;
				break;
			}
		// register if it's not registered yet
		if (flag)
			extensions.add(extension);
	}

	// returns a list of installed extensions
	public List<Extension> getInstalledExtensions() {
		return new ArrayList<Extension>(extensions);
	}
/*
	protected String getIfaces()
	{
		Enumeration<NetworkInterface> ifaces = null;
		try {
			ifaces = NetworkInterface.getNetworkInterfaces();
		} catch (Exception e) {
		}
		StringBuilder sb = new StringBuilder();
		Formatter formatter = new Formatter(sb);
		if (ifaces != null) {
			while (ifaces.hasMoreElements()) {
				NetworkInterface iface = ifaces.nextElement();
				try {
					byte[] mac = iface.getHardwareAddress();
					if (mac != null) {
						formatter.format("%s:", iface.getName());
						for (byte b : mac)
							formatter.format("%02x", b);
						formatter.format(";");
					}
				} catch (Exception e) {
				}
			}
		}
		return sb.toString();	
	}
*/	
	// returns system id
	abstract public String getSystemId();

	@Override
	public void afterPropertiesSet() throws Exception {
		// TODO
		// checkLicense();
	}
}
