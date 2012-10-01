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

import org.alfresco.repo.security.authentication.AuthenticationUtil;
import org.alfresco.repo.security.authentication.AuthenticationUtil.RunAsWork;
import org.alfresco.service.ServiceRegistry;
import org.alfresco.service.cmr.security.AuthorityService;
import org.alfresco.service.cmr.security.AuthorityType;

/**
 * CustomWorkflows extension implementation
 */

class CreateGroupWork implements RunAsWork<Void> {

	private ServiceRegistry serviceRegistry;

	public CreateGroupWork(ServiceRegistry serviceRegistry) {
		this.serviceRegistry = serviceRegistry;
	}

	@Override
	public Void doWork() throws Exception {
		AuthorityService as = serviceRegistry.getAuthorityService();
		if (!as.authorityExists(as.getName(AuthorityType.GROUP,
				CustomWorkflowsExtension.ROOT_GROUP_NAME)))
			as.createAuthority(AuthorityType.GROUP,
					CustomWorkflowsExtension.ROOT_GROUP_NAME);
		return null;
	}

}

public class CustomWorkflowsExtension extends RepositoryExtension {

	public static final String ROOT_GROUP_NAME = "alvex_workflow_groups";

	// constructor
	public CustomWorkflowsExtension() throws Exception {
		id = "custom-workflows";
		fileListPath = "alvex-custom-workflows-file-list.txt";
		extInfoPath = "alvex-custom-workflows.properties";
	}

	@Override
	public void afterPropertiesSet() throws Exception {
		super.afterPropertiesSet();
		RunAsWork<Void> work = new CreateGroupWork(serviceRegistry);
		AuthenticationUtil.runAsSystem(work);
	}

	@Override
	void upgradeConfiguration(String oldVersion, String oldEdition) {
		//
	}
}
