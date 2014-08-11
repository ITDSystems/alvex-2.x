/*
 * Copyright (C) 2005-2010 Alfresco Software Limited.
 * Copyright (C) 2014 ITD Systems LLC.
 *
 * This file is part of Alvex
 *
 * Alvex is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Alvex is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Alvex. If not, see <http://www.gnu.org/licenses/>.
 */

package com.alvexcore.repo;

import org.alfresco.repo.policy.Behaviour;
import org.alfresco.repo.policy.JavaBehaviour;
import org.alfresco.repo.policy.PolicyComponent;
import org.alfresco.repo.policy.Behaviour.NotificationFrequency;
import org.alfresco.repo.version.VersionServicePolicies.AfterCreateVersionPolicy;
import org.alfresco.service.cmr.repository.NodeRef;
import org.alfresco.service.cmr.version.Version;
import org.alfresco.service.cmr.version.VersionHistory;
import org.alfresco.service.cmr.version.VersionService;
import org.alfresco.service.namespace.NamespaceService;
import org.alfresco.service.namespace.QName;
import org.apache.log4j.Logger;


/**
 * 
 * @author Jared Ottley (jared.ottley@alfresco.com)
 * @author Konst Sergeev (k.sergeev@alvexcore.com)
 * 
 * Original project - https://github.com/jottley/alfresco-maxversion-policy
 * 
 */

public class AlvexMaxVersionPolicy
	implements AfterCreateVersionPolicy
{
	private Logger logger = Logger.getLogger(AlvexMaxVersionPolicy.class);

	private PolicyComponent policyComponent;
	private VersionService versionService;

	// max number of versions per version node
	private int maxVersions;

	private Behaviour afterCreateVersion;

	public void setPolicyComponent(PolicyComponent policyComponent)
	{
		this.policyComponent = policyComponent;
	}

	public void setVersionService(VersionService versionService)
	{
		this.versionService = versionService;
	}

	public void setMaxVersions(int maxVersions)
	{
		this.maxVersions = maxVersions;
	}

	public void init()
	{
		logger.debug("MaxVersions is set to: " + maxVersions);
		this.afterCreateVersion = new JavaBehaviour(this, "afterCreateVersion", NotificationFrequency.TRANSACTION_COMMIT);
		this.policyComponent.bindClassBehaviour(QName.createQName(NamespaceService.ALFRESCO_URI, "afterCreateVersion"), AlvexMaxVersionPolicy.class, this.afterCreateVersion);
	}

	@Override
	public void afterCreateVersion(NodeRef versionableNode, Version version)
	{
		VersionHistory versionHistory = versionService.getVersionHistory(versionableNode);

		if (maxVersions == 0 )
		{
			logger.debug("alvexMaxVersionPolicy is disabled");
			return;
		}
		
		if (versionHistory == null)
		{
			logger.debug("versionHistory does not exist");
		}
		
		logger.debug("Current number of versions: " + versionHistory.getAllVersions().size());

		// If the current number of versions in the VersionHistory is greater
		// than the maxVersions limit, remove the least recent versions
		while (versionHistory.getAllVersions().size() > maxVersions)
		{
			logger.debug("Removing Version: " + versionHistory.getRootVersion().getVersionLabel());
			versionService.deleteVersion(versionableNode, versionHistory.getRootVersion());
			versionHistory = versionService.getVersionHistory(versionableNode);
		}
	}
}