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

package com.alvexcore.repo;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.security.MessageDigest;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Properties;

import org.alfresco.model.ContentModel;
import org.alfresco.service.ServiceRegistry;
import org.alfresco.service.cmr.repository.ChildAssociationRef;
import org.alfresco.service.cmr.repository.NodeRef;
import org.alfresco.service.cmr.repository.NodeService;
import org.alfresco.service.namespace.QName;
import org.apache.commons.io.IOUtils;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.beans.factory.annotation.Required;

public abstract class RepositoryExtension implements InitializingBean {

	final static QName[] CONFIG_PATH = { AlvexContentModel.ASSOC_NAME_SYSTEM,
			AlvexContentModel.ASSOC_NAME_ALVEX,
			AlvexContentModel.ASSOC_NAME_CONFIG };

	protected ServiceRegistry serviceRegistry;
	protected RepositoryExtensionRegistry extensionRegistry;
	protected String id = null;
	protected String version = null;
	protected String edition = null;
	protected MessageDigest md5;
	protected String fileListPath = null;
	protected String extInfoPath = null;

	final private String PROP_VERSION = "extension.version";
	final private String PROP_EDITION = "extension.edition";

	final private String DEV_VERSION = "dev";
	final private String DEV_EDITION = "dev";

	// constructor
	public RepositoryExtension() throws Exception {
		try {
			md5 = MessageDigest.getInstance("MD5");
		} catch (Exception e) {
			throw new Exception(
					"There is no MD5 algorithm support, but we really need it.",
					e);
		}
	}

	// dependency injection
	@Override
	public void afterPropertiesSet() throws Exception {
		serviceRegistry = extensionRegistry.getServiceRegistry();
		extensionRegistry.registerExtension(this);
	}

	// returns extension id
	public String getId() {
		return id;
	}

	// returns extension version
	public String getVersion() {
		return version;
	}

	// returns extension edition
	public String getEdition() {
		return edition;
	}

	// returns md5 hash for a specified file
	protected String getMD5Hash(String file) throws Exception {
		if (file.isEmpty())
			return "MISSED_FILE_NAME"; // FIXME debug only
		InputStream is = this.getClass().getClassLoader().getResourceAsStream(file);
		if (is == null)
			throw new Exception("Can't find specified resource.");
		byte[] bytesOfMessage = IOUtils.toByteArray(is);
		byte[] digest = md5.digest(bytesOfMessage);
		String result = "";

		for (int i = 0; i < digest.length; i++) {
			result += Integer.toString((digest[i] & 0xff) + 0x100, 16)
					.substring(1);
		}
		is.close();
		return result;
	}

	// returns md5 hashes for all extension files
	public Map<String, String> getMD5Hashes() throws Exception {
		// read list of files
		InputStream is = null;
		try {
			is = this.getClass().getClassLoader()
					.getResourceAsStream(fileListPath);
		} catch (Exception e) {
			throw new Exception("Error occured while opening file list.", e);
		}

		BufferedReader br = new BufferedReader(new InputStreamReader(is));
		String filePath;
		String md5hash;
		Map<String, String> md5hashes = new HashMap<String, String>();
		while ((filePath = br.readLine()) != null) {
			try {
				md5hash = getMD5Hash(filePath);
			} catch (Exception e) {
				md5hash = "ERROR";
			}
			md5hashes.put(filePath, md5hash);

		}
		is.close();

		return md5hashes;
	}

	abstract void upgradeConfiguration(String oldVersion, String oldEdition);

	public void init() throws Exception {
		InputStream is = this.getClass().getClassLoader()
				.getResourceAsStream(extInfoPath);
		Properties props = new Properties();
		props.load(is);
		version = (props.getProperty(PROP_VERSION) != null) ? props.getProperty(PROP_VERSION) : DEV_VERSION;
		edition = (props.getProperty(PROP_EDITION) != null) ? props.getProperty(PROP_EDITION) : DEV_EDITION;
		// check if installation was upgraded
		updateExtensionInfo();
	}

	// updates extension info in repository and runs upgradeConfiguration() if
	// necessary
	protected void updateExtensionInfo() throws Exception {
		NodeRef node = extensionRegistry.createPath(CONFIG_PATH, null, null);
		NodeService nodeService = serviceRegistry.getNodeService();
		QName assocQName = QName.createQName(AlvexContentModel.ALVEX_MODEL_URI,
				id);
		List<ChildAssociationRef> assocs = nodeService.getChildAssocs(node,
				ContentModel.ASSOC_CHILDREN, assocQName);
		if (assocs.size() == 0) {
			// this is the first start, create node
			node = nodeService.createNode(node, ContentModel.ASSOC_CHILDREN,
					assocQName, AlvexContentModel.TYPE_EXTENSION_CONFIG)
					.getChildRef();
		} else {
			node = assocs.get(0).getChildRef();
			String edition = (String) nodeService.getProperty(node,
					AlvexContentModel.PROP_EXTENSION_EDITION);
			String version = (String) nodeService.getProperty(node,
					AlvexContentModel.PROP_EXTENSION_VERSION);
			if (edition == null || version == null)
				throw new Exception(
						"Edition or version found in repository is invalid.");
			upgradeConfiguration(version, edition);
		}
		// store current edition and version
		nodeService.setProperty(node, AlvexContentModel.PROP_EXTENSION_VERSION,
				version);
		nodeService.setProperty(node, AlvexContentModel.PROP_EXTENSION_EDITION,
				edition);
	}

	@Required
	public void setExtensionRegistry(
			RepositoryExtensionRegistry extensionRegistry) {
		this.extensionRegistry = extensionRegistry;
	}
}
