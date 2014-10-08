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
import java.util.ArrayList;
import java.util.Map;
import java.util.HashMap;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.io.ByteArrayInputStream;
import java.io.IOException;

import javax.servlet.http.HttpSession;
import org.json.JSONException;
import org.json.JSONObject;
import org.springframework.extensions.surf.FrameworkUtil;
import org.springframework.extensions.surf.RequestContext;
import org.springframework.extensions.surf.ServletUtil;
import org.springframework.extensions.surf.exception.ConnectorServiceException;
import org.springframework.extensions.surf.support.ThreadLocalRequestContext;
import org.springframework.extensions.surf.util.I18NUtil;
import org.springframework.extensions.surf.util.StringBuilderWriter;
import org.springframework.extensions.webscripts.json.JSONWriter;
import org.springframework.extensions.webscripts.connector.Connector;
import org.springframework.extensions.webscripts.connector.ConnectorContext;
import org.springframework.extensions.webscripts.connector.ConnectorService;
import org.springframework.extensions.webscripts.connector.HttpMethod;

/**
 * @author Roy Wetherall
 */
public class TaskFormUIGet extends FormUIGet
{
    String repoFormMode = null;
    
    @Override
    protected Map<String, Object> executeImpl(WebScriptRequest req, Status status, Cache cache)
    {
        Map<String, Object> model = null;
        
        String itemKind = getParameter(req, FormUIGet.PARAM_ITEM_KIND);
        String itemId = getParameter(req, FormUIGet.PARAM_ITEM_ID);

        // Custom part - handle tasks / workflows together with permissions on them
        String taskId = getParameter(req, "taskId");
        String workflowId = getParameter(req, "workflowId");
        if( taskId != null && taskId.length() > 0 )
        {
            itemId = taskId;
            try {
                ConnectorService connService = FrameworkUtil.getConnectorService();
                RequestContext requestContext = ThreadLocalRequestContext.getRequestContext();
                String currentUserId = requestContext.getUserId();
                HttpSession currentSession = ServletUtil.getSession(true);
                Connector connector = connService.getConnector(FormUIGet.ENDPOINT_ID, currentUserId, currentSession);
                Map<String, String> headers = new HashMap<String, String>(1, 1.0f);
                headers.put("Accept-Language", I18NUtil.getLocale().toString().replace('_', '-'));
                ConnectorContext context = new ConnectorContext(HttpMethod.GET, null, headers);
                context.setContentType("application/json");
                
                Response response = connector.call("/api/alvex/task-instances/" + taskId, context);
                JSONObject json = new JSONObject(response.getResponse());
                boolean isEditable = json.getJSONObject("data").getBoolean("isEditable");
                repoFormMode = (isEditable ? "edit" : "view");
                
            } catch (ConnectorServiceException ex) {
                // Do nothing, failback to default mode
            } catch (JSONException ex) {
                // Do nothing, failback to default mode
            }
        }
        if( workflowId != null && workflowId.length() > 0 )
        {
            itemId = workflowId.replace("$","$start");
            repoFormMode = "view";
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
        String formId = getParameter(request, FormUIGet.PARAM_FORM_ID);
        if (repoFormMode != null)
            modeParam = repoFormMode;
        Mode mode = Mode.modeFromString(modeParam);
        
        // get the form configuration and list of fields that are visible (if any)
        FormConfigElement formConfig = getFormConfig(itemId, formId);
        List<String> visibleFields = getVisibleFields(mode, formConfig);
        
        // get the form definition from the form service
        Response formSvcResponse = retrieveFormDefinition(itemKind, itemId, visibleFields, formConfig, request);
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
        else
        {
            model = generateErrorModel(formSvcResponse);
        }
        
        return model;
    }

    /**
     * Retrieves the form definition from the repository FormService for the
     * given item.
     * 
     * @param itemKind The form item kind
     * @param itemId The form item id
     * @param visibleFields The list of field names to return or null
     *        to return all fields
     * @param formConfig The form configuration
     * @return Response object from the remote call
     */
    protected Response retrieveFormDefinition(String itemKind, String itemId,
                List<String> visibleFields, FormConfigElement formConfig, WebScriptRequest request)
    {
        Response response = null;

        try
        {
            // setup the connection
            ConnectorService connService = FrameworkUtil.getConnectorService();
            RequestContext requestContext = ThreadLocalRequestContext.getRequestContext();
            String currentUserId = requestContext.getUserId();
            HttpSession currentSession = ServletUtil.getSession(true);
            Connector connector = connService.getConnector(ENDPOINT_ID, currentUserId, currentSession);
            ConnectorContext context = new ConnectorContext(HttpMethod.POST, null, buildDefaultHeaders());
            context.setContentType("application/json");

            // call the form service
            response = connector.call("/api/formdefinitions", context, generateFormDefPostBody(itemKind,
                        itemId, visibleFields, formConfig, request));

            //if (logger.isDebugEnabled())
            //    logger.debug("Response status: " + response.getStatus().getCode());
        }
        catch (Exception e)
        {
            //if (logger.isErrorEnabled())
            //    logger.error("Failed to get form definition: ", e);
        }

        return response;
    }

    /**
     * Generates the POST body to send to the FormService.
     * 
     * @param itemKind The form item kind
     * @param itemId The form item id
     * @param visibleFields The list of field names to return or null
     *        to return all fields
     * @param formConfig The form configuration
     * @return ByteArrayInputStream representing the POST body
     * @throws IOException
     */
    protected ByteArrayInputStream generateFormDefPostBody(String itemKind, String itemId, 
                List<String> visibleFields, FormConfigElement formConfig, WebScriptRequest request) throws IOException
    {
        StringBuilderWriter buf = new StringBuilderWriter(512);
        JSONWriter writer = new JSONWriter(buf);
        
        writer.startObject();
        writer.writeValue(PARAM_ITEM_KIND, itemKind);
        
        String destination = getParameter(request, MODEL_DESTINATION);
        if (destination != null && destination.length() > 0)
        {
            writer.writeValue(MODEL_DESTINATION, destination);
        }
        
        writer.writeValue(PARAM_ITEM_ID, itemId.replace(":/", ""));

        List<String> forcedFields = null;
        if (visibleFields != null && visibleFields.size() > 0)
        {
            // list the requested fields
            writer.startValue(MODEL_FIELDS);
            writer.startArray();

            forcedFields = new ArrayList<String>(visibleFields.size());
            for (String fieldId : visibleFields)
            {
                // write out the fieldId
                writer.writeValue(fieldId);
                
                // determine which fields need to be forced
                if (formConfig.isFieldForced(fieldId))
                {
                    forcedFields.add(fieldId);
                }
            }
            
            // close the fields array
            writer.endArray();
        }
        
        // list the forced fields, if present
        if (forcedFields != null && forcedFields.size() > 0)
        {
            writer.startValue(MODEL_FORCE);
            writer.startArray();
            
            for (String fieldId : forcedFields)
            {
                writer.writeValue(fieldId);
            }
            
            writer.endArray();
        }
        
        // end the JSON object
        writer.endObject();
        
        // return the JSON body as a stream
        return new ByteArrayInputStream(buf.toString().getBytes());
    }

    /**
     * Helper to build a map of the default headers for script requests - we send over
     * the current users locale so it can be respected by any appropriate REST APIs.
     *  
     * @return map of headers
     */
    private static Map<String, String> buildDefaultHeaders()
    {
        Map<String, String> headers = new HashMap<String, String>(1, 1.0f);
        headers.put("Accept-Language", I18NUtil.getLocale().toString().replace('_', '-'));
        return headers;
    }
}