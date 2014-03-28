/*
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
package com.alvexcore.share.evaluators;

import org.alfresco.error.AlfrescoRuntimeException;
import org.alfresco.web.evaluator.BaseEvaluator;
import org.json.simple.JSONObject;

import com.alvexcore.share.ShareExtensionRegistry;

public class WorkflowsAvailableForRegistryItemEvaluator extends BaseEvaluator
{
	protected ShareExtensionRegistry extensionRegistry;
	
	public void setAlvexExtensionRegistry(ShareExtensionRegistry extensionRegistry) {
		this.extensionRegistry = extensionRegistry;
	}
	
	@Override
	public boolean evaluate(JSONObject jsonObject)
	{
		try
		{
			String edition = extensionRegistry.getEdition();
			return ShareExtensionRegistry.EDITION_EE.equals(edition);
		}
		catch (Exception e)
		{
			throw new AlfrescoRuntimeException("Can not run evaluator: " + e.getMessage());
		}
	}
}
