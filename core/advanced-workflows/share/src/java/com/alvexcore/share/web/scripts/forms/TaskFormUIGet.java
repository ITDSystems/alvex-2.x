/**
 * Copyright © 2013 ITD Systems
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

package com.alvexcore.share.web.scripts.forms;

import org.alfresco.web.scripts.forms.FormUIGet;
import org.alfresco.web.config.forms.FormConfigElement;
import org.alfresco.web.config.forms.Mode;

import org.springframework.extensions.webscripts.WebScriptRequest;
import org.springframework.extensions.webscripts.Status;
import org.springframework.extensions.webscripts.Cache;
import org.springframework.extensions.webscripts.connector.Response;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

/**
 * @author Roy Wetherall
 */
public class TaskFormUIGet extends FormUIGet
{
	private boolean viewOnly = false;
	
	@Override
    protected Map<String, Object> executeImpl(WebScriptRequest req, Status status, Cache cache)
    {
        Map<String, Object> model = null;
		viewOnly = false;
        
        String itemKind = getParameter(req, FormUIGet.PARAM_ITEM_KIND);
        String itemId = getParameter(req, FormUIGet.PARAM_ITEM_ID);
		String taskId = getParameter(req, "taskId");
		String workflowId = getParameter(req, "workflowId");
		
		if( taskId != null && taskId.length() > 0 )
			itemId = taskId;
		if( workflowId != null && workflowId.length() > 0 )
		{
			itemId = workflowId.replace("$","$start");
			viewOnly = true;
		}
         
        if (itemKind != null && itemId != null && itemKind.length() > 0 && itemId.length() > 0)
        {
            model = generateModel(itemKind, itemId, req, status, cache);
        }
        else
        {
            // an item kind and id have not been provided so return a model
            // with a 'form' entry but set to null, this prevents FreeMarker
            // adding a default 'form' taglib object to the model.
            model = new HashMap<String, Object>(1);
            model.put(FormUIGet.MODEL_FORM, null);
        }
        
        return model;
    }
	
	@Override
	protected Map<String, Object> generateModel(String itemKind, String itemId, 
                WebScriptRequest request, Status status, Cache cache)
    {
        Map<String, Object> model = null;
        
        // get mode and optional formId
        String modeParam = getParameter(request, FormUIGet.MODEL_MODE, FormUIGet.DEFAULT_MODE);
		if( viewOnly )
			modeParam = "view";
        String formId = getParameter(request, FormUIGet.PARAM_FORM_ID);
        Mode mode = Mode.modeFromString(modeParam);
        
        // get the form configuration and list of fields that are visible (if any)
        FormConfigElement formConfig = getFormConfig(itemId, formId);
        List<String> visibleFields = getVisibleFields(mode, formConfig);
        
        // get the form definition from the form service
        Response formSvcResponse = retrieveFormDefinition(itemKind, itemId, visibleFields, formConfig);
        if (formSvcResponse.getStatus().getCode() == Status.STATUS_OK)
        {
            model = generateFormModel(request, mode, formSvcResponse, formConfig);
        }
        else if (formSvcResponse.getStatus().getCode() == Status.STATUS_UNAUTHORIZED)
        {
            // set status to 401 and return null model
            status.setCode(Status.STATUS_UNAUTHORIZED);
            status.setRedirect(true);
        }
		// We skip this section since it does not compile on 4.2.c
        //else
        //{
		//	
        //    String errorKey = getParameter(request, FormUIGet.PARAM_ERROR_KEY);
        //    model = generateErrorModel(formSvcResponse, errorKey);
        //}
        
        return model;
    }
}