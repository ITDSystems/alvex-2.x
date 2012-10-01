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

import org.alfresco.model.ContentModel;
import org.alfresco.repo.security.authentication.AuthenticationUtil;
import org.alfresco.repo.security.authentication.AuthenticationUtil.RunAsWork;
import org.alfresco.service.namespace.QName;
import org.springframework.beans.factory.annotation.Required;

import com.alvexcore.repo.orgchart.OrgchartService;

/**
 * Orgchart extension implementation
 */

public class OrgchartExtension extends RepositoryExtension {
	public final static QName[] ORGCHART_STORAGE_PATH = {
			AlvexContentModel.ASSOC_NAME_SYSTEM,
			AlvexContentModel.ASSOC_NAME_ALVEX,
			AlvexContentModel.ASSOC_NAME_DATA,
			QName.createQName(AlvexContentModel.ALVEX_MODEL_URI, "orgchart") };

	public final static QName[] ORGCHART_STORAGE_TYPES = {
			ContentModel.TYPE_CONTAINER, ContentModel.TYPE_CONTAINER,
			ContentModel.TYPE_CONTAINER, ContentModel.TYPE_CONTAINER };

	// constructor
	public OrgchartExtension() throws Exception {
		id = "orgchart";
		fileListPath = "alvex-orgchart-file-list.txt";
		extInfoPath = "alvex-orgchart.properties";
	}

	private OrgchartService orgchartService;

	@Required
	public void setOrgchartService(OrgchartService orgchartService) {
		this.orgchartService = orgchartService;
	}

	// initialize extension
	@Override
	public void afterPropertiesSet() throws Exception {
		// call method of superclass
		super.afterPropertiesSet();
		// initialize workflow discussions storage
		AuthenticationUtil.runAsSystem(new RunAsWork<Void>() {

			public Void doWork() throws Exception {
				initializeStorage();
				orgchartService.setUp();
				return null;
			}
		});
	}

	private void initializeStorage() throws Exception {
		createPath(ORGCHART_STORAGE_PATH, null, ORGCHART_STORAGE_TYPES);
	}

	@Override
	void upgradeConfiguration(String oldVersion, String oldEdition) {
		//

	}
}
