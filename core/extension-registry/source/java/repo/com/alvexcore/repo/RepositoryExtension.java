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
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Properties;

import org.alfresco.model.ContentModel;
import org.alfresco.service.ServiceRegistry;
import org.alfresco.service.cmr.repository.ChildAssociationRef;
import org.alfresco.service.cmr.repository.NodeRef;
import org.alfresco.service.cmr.repository.NodeService;
import org.alfresco.service.cmr.repository.StoreRef;
import org.alfresco.service.namespace.QName;
import org.apache.commons.io.IOUtils;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.beans.factory.annotation.Required;

public abstract class RepositoryExtension implements InitializingBean {

	private static final String ID_DATA_PATH = "dataPath";
	protected QName[] CONFIG_PATH = new QName[4];
	protected QName[] CONFIG_TYPES = new QName[4];
	protected QName[] DATA_PATH = new QName[4];
	protected QName[] DATA_TYPES = new QName[4];

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
	
	private Map<String, NodeRef> nodeCache = new HashMap<String, NodeRef>();

	// constructor
	public RepositoryExtension() throws Exception {
		try {
			md5 = MessageDigest.getInstance("MD5");
		} catch (Exception e) {
			throw new Exception(
					"There is no MD5 algorithm support, but we really need it.",
					e);
		}
		
		CONFIG_PATH[0] = AlvexContentModel.ASSOC_NAME_SYSTEM;
		CONFIG_PATH[1] = AlvexContentModel.ASSOC_NAME_ALVEX;
		CONFIG_PATH[2] = AlvexContentModel.ASSOC_NAME_CONFIG;
		
		DATA_PATH[0] = AlvexContentModel.ASSOC_NAME_SYSTEM;
		DATA_PATH[1] = AlvexContentModel.ASSOC_NAME_ALVEX;
		DATA_PATH[2] = AlvexContentModel.ASSOC_NAME_DATA;
		
		CONFIG_TYPES[0] = ContentModel.TYPE_CONTAINER;
		CONFIG_TYPES[1] = ContentModel.TYPE_CONTAINER;
		CONFIG_TYPES[2] = ContentModel.TYPE_CONTAINER;
		CONFIG_TYPES[3] = AlvexContentModel.TYPE_EXTENSION_CONFIG;
		
		DATA_TYPES[0] = ContentModel.TYPE_CONTAINER;
		DATA_TYPES[1] = ContentModel.TYPE_CONTAINER;
		DATA_TYPES[2] = ContentModel.TYPE_CONTAINER;
		DATA_TYPES[3] = ContentModel.TYPE_CONTAINER;
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
		InputStream is = this.getClass().getClassLoader()
				.getResourceAsStream(file);
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

	public void init(boolean failIfInitialized) throws Exception {
		DATA_PATH[3] = CONFIG_PATH[3] = QName.createQName(AlvexContentModel.ALVEX_MODEL_URI, id);
		
		if (isInitialized() && failIfInitialized)
			throw new Exception("Extension has been initialized already");

		InputStream is = this.getClass().getClassLoader()
				.getResourceAsStream(extInfoPath);
		if (is != null) {
			Properties props = new Properties();
			props.load(is);
			version = (props.getProperty(PROP_VERSION) != null) ? props
					.getProperty(PROP_VERSION) : DEV_VERSION;
			edition = (props.getProperty(PROP_EDITION) != null) ? props
					.getProperty(PROP_EDITION) : DEV_EDITION;
			// check if installation was upgraded
		} else {
			version = DEV_VERSION;
			edition = DEV_EDITION;
		}
		// create data folder if needed
		NodeRef dataPath = extensionRegistry.resolvePath(DATA_PATH, null);
		if (dataPath == null)
			dataPath = extensionRegistry.createPath(DATA_PATH, null, DATA_TYPES);
		addNodeToCache(ID_DATA_PATH, dataPath);
		updateExtensionInfo();
	}

	public void drop(boolean all) throws Exception {
		NodeRef ref = extensionRegistry.resolvePath(DATA_PATH, null);
		if (ref != null)
			serviceRegistry.getNodeService().deleteNode(ref);
		if (all) {
			ref = extensionRegistry.resolvePath(CONFIG_PATH, null);
			if (ref != null)
				serviceRegistry.getNodeService().deleteNode(ref);
		}
		removeNodeFromCache(ID_DATA_PATH);
	}

	public boolean isInitialized() {
		return extensionRegistry.resolvePath(DATA_PATH, null) != null
				&& extensionRegistry.resolvePath(CONFIG_PATH, null) != null;
	}

	// updates extension info in repository and runs upgradeConfiguration() if
	// necessary
	protected void updateExtensionInfo() throws Exception {
		NodeRef node = extensionRegistry.createPath(CONFIG_PATH, null, CONFIG_TYPES);
		NodeService nodeService = serviceRegistry.getNodeService();

		String edition = (String) nodeService.getProperty(node,
				AlvexContentModel.PROP_EXTENSION_EDITION);
		String version = (String) nodeService.getProperty(node,
				AlvexContentModel.PROP_EXTENSION_VERSION);
		upgradeConfiguration(version, edition);
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
	
	public NodeRef getDataPath() {
		return getNodeFromCache(ID_DATA_PATH);
	}
	
	public void addNodeToCache(String id, NodeRef nodeRef) {
		nodeCache.put(id, nodeRef);
	}
	
	public NodeRef getNodeFromCache(String id) {
		return nodeCache.get(id);
	}

	public void removeNodeFromCache(String id) {
		nodeCache.remove(id);
	}
}
