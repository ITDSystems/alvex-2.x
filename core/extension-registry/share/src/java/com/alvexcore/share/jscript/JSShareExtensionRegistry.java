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

import java.security.PublicKey;
import java.security.Signature;
import java.util.HashMap;
import java.util.Map;

import org.apache.commons.codec.binary.Base64;
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
	
	public String getEdition() {
		return registry.getEdition();
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
			String repoId, Scriptable repoHashes, String repoVersion,
			String licenseId) throws Exception {
		return registry.checkForUpdates(extensionId, shareId,
				convertToMap(shareHashes), shareVersion, repoId,
				convertToMap(repoHashes), repoVersion, licenseId);
	}

	@SuppressWarnings("serial")
	public String removeSignature(String data) {
		if (data == null)
			return null;
		int idx = data.indexOf("\n");
		if (idx <= 20)
			return null;
		String s = data.substring(0, idx);
		if (!s.startsWith("SIGNATURE:"))
			return null;
		s = s.substring(10);
		Signature sig;
		try {
			sig = Signature.getInstance("SHA1withRSA");
			sig.initVerify(new PublicKey() {

				@Override
				public String getAlgorithm() {
					return "RSA";
				}

				@Override
				public String getFormat() {
					return "X.509";
				}

				@Override
				public byte[] getEncoded() {
					return new byte[] { 48, -126, 1, 34, 48, 13, 6, 9, 42,
							-122, 72, -122, -9, 13, 1, 1, 1, 5, 0, 3, -126, 1,
							15, 0, 48, -126, 1, 10, 2, -126, 1, 1, 0, -115,
							117, -12, -114, -121, -128, 76, 99, -114, -37, 107,
							-44, 108, 36, 38, 99, 13, -93, -73, -62, 44, 10,
							120, -22, -31, -25, -109, 45, 24, -47, 59, -87,
							-39, -29, -35, -96, 13, -117, 31, -98, 107, 80,
							-104, -72, 5, -32, 79, -115, 59, -87, 109, -121,
							104, 36, -14, 123, -113, 87, -50, 40, -52, -59,
							-52, -7, -13, -34, 17, -29, -39, 63, -62, -44, 51,
							68, -98, -115, -13, 10, -7, -101, 81, -72, 81, 91,
							-94, 91, -94, 6, 65, 84, 35, -121, 14, -103, 38, 6,
							59, 115, -110, 4, -63, -89, -22, 27, 126, -96, -32,
							97, 105, -108, 14, -23, -62, -89, -41, 30, -126,
							-114, 121, 17, 125, 18, 124, -114, 0, -13, 85, -11,
							92, 87, -16, 3, 30, 23, -126, -33, 122, 126, -72,
							-95, 29, 73, -24, -34, -27, -41, 109, -77, -108,
							-34, 91, -36, -3, 112, 13, 30, 111, 9, -105, 7, 8,
							-70, 95, -128, -82, -13, -4, 127, -58, 68, -114,
							89, 69, 101, -106, -123, -36, -90, -110, -44, 45,
							25, 107, 52, 6, 69, -35, 89, 7, -59, 96, 4, 97, 29,
							24, -50, -59, -40, 104, 70, 68, -28, 77, 94, -57,
							-38, 91, -99, 37, -89, 105, -126, 52, 80, 111, 107,
							-69, 22, 39, -70, -5, 87, -33, -77, -79, -64, 76,
							-12, -58, -37, 56, 102, 17, 59, 11, -73, -68, -96,
							-108, -47, 13, -113, -77, 60, 88, -128, 19, -42,
							12, 49, 89, 7, -11, -11, -87, 37, 2, 3, 1, 0, 1 };
				}
			});
			String d = data.substring(idx+1);
			sig.update(d.getBytes());
			if (sig.verify(Base64.decodeBase64(s)))
				return d;
			else
				return null;
		} catch (Exception e) {
			return null;
		}
	}

}