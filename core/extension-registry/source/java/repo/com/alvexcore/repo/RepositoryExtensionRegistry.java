/*
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

import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.io.Serializable;
import java.security.Key;
import java.security.PublicKey;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import javax.xml.parsers.DocumentBuilderFactory;

import org.alfresco.error.AlfrescoRuntimeException;
import org.alfresco.model.ContentModel;
import org.alfresco.repo.model.Repository;
import org.alfresco.repo.security.authentication.AuthenticationUtil;
import org.alfresco.repo.security.authentication.AuthenticationUtil.RunAsWork;
import org.alfresco.service.ServiceRegistry;
import org.alfresco.service.cmr.repository.ChildAssociationRef;
import org.alfresco.service.cmr.repository.NodeRef;
import org.alfresco.service.cmr.repository.NodeService;
import org.alfresco.service.cmr.repository.StoreRef;
import org.alfresco.service.namespace.QName;
import org.springframework.beans.factory.annotation.Required;
import org.springframework.context.ApplicationEvent;
import org.springframework.context.event.ContextRefreshedEvent;
import org.springframework.extensions.surf.util.AbstractLifecycleBean;
import org.springframework.util.PropertyPlaceholderHelper;
import org.w3c.dom.Document;
import org.w3c.dom.NodeList;

import com.alvexcore.license.LicenseInfo;

/*
 * Repository extension registry implementation
 * 
 */

public class RepositoryExtensionRegistry extends AbstractLifecycleBean {

	private final static int EDITION_ENTERPRISE = 1;

	final static QName[] ALVEX_PATH = { AlvexContentModel.ASSOC_NAME_SYSTEM,
			AlvexContentModel.ASSOC_NAME_ALVEX };

	private Repository repository = null;
	private ServiceRegistry serviceRegistry = null;

	// list of extensions
	protected List<RepositoryExtension> extensions = new ArrayList<RepositoryExtension>();

	public Repository getRepository() {
		return repository;
	}

	public ServiceRegistry getServiceRegistry() {
		return serviceRegistry;
	}

	@Required
	public void setRepository(Repository repository) {
		this.repository = repository;
	}

	@Required
	public void setServiceRegistry(ServiceRegistry serviceRegistry) {
		this.serviceRegistry = serviceRegistry;
	}

	public void init() throws Exception {
		// load license information
		AuthenticationUtil.runAsSystem(new RunAsWork<Void>() {
			@Override
			public Void doWork() throws Exception {
				initContainer();
				return null;
			}
		});
	}

	private void initContainer() throws Exception {
		NodeRef node = createPath(ALVEX_PATH, null, null);
		NodeService nodeService = serviceRegistry.getNodeService();
		if (!nodeService.hasAspect(node, ContentModel.ASPECT_AUDITABLE)) {
			Map<QName, Serializable> props = new HashMap<QName, Serializable>();
			props.put(ContentModel.PROP_MODIFIED, Calendar.getInstance()
					.getTime());
			props.put(ContentModel.PROP_MODIFIER,
					AuthenticationUtil.SYSTEM_USER_NAME);
			props.put(ContentModel.PROP_CREATED, Calendar.getInstance()
					.getTime());
			props.put(ContentModel.PROP_CREATOR,
					AuthenticationUtil.SYSTEM_USER_NAME);
			nodeService.addAspect(node, ContentModel.ASPECT_AUDITABLE, props);
		} else {
			nodeService.setProperty(node, ContentModel.PROP_MODIFIED, Calendar
					.getInstance().getTime());
			nodeService.setProperty(node, ContentModel.PROP_MODIFIER,
					AuthenticationUtil.SYSTEM_USER_NAME);
		}
	}

	// creates containers specified by assocs
	public NodeRef createPath(QName[] path, QName[] assocs, QName[] types)
			throws Exception {
		if (path == null || path.length == 0)
			throw new Exception("Path cannot be null or empty");
		if (assocs != null && path.length != assocs.length)
			throw new Exception("Size of path and assocs must be equal");
		if (types != null && path.length != types.length)
			throw new Exception("Size of path and types must be equal");
		NodeService nodeService = serviceRegistry.getNodeService();
		NodeRef node = nodeService
				.getRootNode(StoreRef.STORE_REF_WORKSPACE_SPACESSTORE);
		for (int i = 0; i < path.length; i++) {
			QName assocQName = path[i];
			QName childAssoc = assocs == null ? ContentModel.ASSOC_CHILDREN
					: assocs[i];
			QName childType = types == null ? ContentModel.TYPE_CONTAINER
					: types[i];
			List<ChildAssociationRef> childAssocs = nodeService.getChildAssocs(
					node, childAssoc, assocQName);
			if (childAssocs.size() == 0) {
				// create new node
				node = nodeService.createNode(node, childAssoc, assocQName,
						childType).getChildRef();
			} else if (childAssocs.size() == 1)
				// get ref of existent node
				node = childAssocs.get(0).getChildRef();
		}
		return node;
	}

	public String getSystemId() {
		return "NOT-IMPLEMENTED-YET";
		//		return repository.getCompanyHome().getId()
		//				+ "-"
		//				+ serviceRegistry
		//						.getNodeService()
		//						.getProperty(repository.getCompanyHome(),
		//								ContentModel.PROP_CREATED).toString();
	}

	public LicenseInfo getLicenseInfo() {
		return new LicenseInfo("CE", new String(), new String(), 0, 0, new Date(), new Date(), true, false);
	}

	private boolean initialiazed = false;

	// registers new extension
	public void registerExtension(RepositoryExtension extension)
			throws Exception {
		for (RepositoryExtension ext : extensions)
			if (ext.getId().equals(extension.getId()))
				throw new Exception("Extension " + ext.getId()
						+ " is registered already");
		// register if it's not registered yet
		extensions.add(extension);
	}

	// returns a list of installed extensions
	public List<RepositoryExtension> getInstalledExtensions() {
		return extensions;
	}

	@Override
	protected void onBootstrap(ApplicationEvent event) {
		// TODO nothing to do here

	}

	@Override
	protected void onShutdown(ApplicationEvent event) {
		// TODO nothing to do here

	}

	@Override
	public void onApplicationEvent(ApplicationEvent event) {
		super.onApplicationEvent(event);
		if (event instanceof ContextRefreshedEvent && !initialiazed) {
			try {
				init();
				for (RepositoryExtension ext : extensions)
					ext.init();
				initialiazed = true;
			} catch (Exception e) {
				throw new AlfrescoRuntimeException(
						"Alvex initialization failed", e);
			}
		}
	}

}
