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

import org.springframework.extensions.surf.support.ThreadLocalRequestContext;
import org.springframework.extensions.surf.RequestContext;
import org.springframework.extensions.surf.ServletUtil;
import org.springframework.extensions.webscripts.connector.Connector;
import org.springframework.extensions.webscripts.Status;
import org.springframework.extensions.webscripts.connector.Response;

public class WorkflowsAvailableForRegistryItemEvaluator extends BaseEvaluator
{
	private static final String JSON_PROP_EDITION = "edition";
	private static final String EDITION_CE = "Community";
	private static final String EDITION_EE = "Enterprise";
	
	@Override
	public boolean evaluate(JSONObject jsonObject)
	{
		try
		{
			// Get connector
			RequestContext rc = ThreadLocalRequestContext.getRequestContext();
			String userId = rc.getUserId();
 			Connector conn = rc.getServiceRegistry().getConnectorService().getConnector(
											"alfresco", userId, ServletUtil.getSession());
			
			String result = EDITION_CE;
			String url = "/api/alvex/license";
 			Response response = conn.call(url);
 			if (Status.STATUS_OK == response.getStatus().getCode())
			{
				org.json.JSONObject scriptResponse = new org.json.JSONObject(response.getResponse());
				result = (String) scriptResponse.get(JSON_PROP_EDITION);
			}
			
			return EDITION_EE.equals(result);
		}
		catch (Exception e)
		{
			throw new AlfrescoRuntimeException("Can not run evaluator: " + e.getMessage());
		}
	}
}
