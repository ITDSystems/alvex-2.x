/*
 * Copyright © 2014 ITD Systems
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

package org.alfresco.repo.forms.script;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

import org.alfresco.repo.forms.Form;
import org.alfresco.repo.forms.FormData;
import org.alfresco.repo.forms.FormService;
import org.alfresco.repo.forms.Item;

import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;

public class MasterDataAwareScriptFormService extends ScriptFormService {
	
	    private static Log logger = LogFactory.getLog(ScriptFormService.class);

    /** The form service */
    private FormService formService;
	
	    /**
     * Set the form service
     * 
     * @param formService
     *            the form service
     */
    public void setFormService(FormService formService)
    {
        this.formService = formService;
    }


	public ScriptForm getForm(String itemKind, String itemId,
                String[] fields, String[] forcedFields)
    {
		return getForm(itemKind, itemId, fields, forcedFields, null);
	}
	
	public ScriptForm getForm(String itemKind, String itemId,
                String[] fields, String[] forcedFields, String destination)
    {
        // create List<String> representations of field params if necessary
        List<String> fieldsList = null;
        List<String> forcedFieldsList = null;

        if (fields != null)
        {
            fieldsList = Arrays.asList(fields);
        }

        if (forcedFields != null)
        {
            forcedFieldsList = Arrays.asList(forcedFields);
        }
		
		Map<String, Object> context = new HashMap<String, Object>();
		if(destination != null)
			context.put("destination", destination);

        Form result = formService.getForm(new Item(itemKind, itemId), fieldsList, forcedFieldsList, context);
        return result == null ? null : new ScriptForm(result);
    }

    /**
     * Persists the given data object for the item provided
     * 
     * @param itemKind The kind of item to retrieve a form for
     * @param itemId The identifier of the item to retrieve a form for
     * @param postData The post data, this can be a Map of name value
     *                 pairs, a webscript FormData object or a JSONObject
     * @return The persisted object
     */
    public Object saveForm(String itemKind, String itemId, Object postData)
    {
        // A note on data conversion as passed in to this method:
        // Each of the 3 submission methods (multipart/formdata, JSON Post and
        // application/x-www-form-urlencoded) pass an instance of FormData into this
        // method.
        FormData dataForFormService = null;
        if (postData instanceof FormData)
        {
            dataForFormService = (FormData)postData;
            // A note on data conversion as passed out of this method:
            // The Repo will handle conversion of String-based data into the types
            // required by the model.
        }
        else
        {
            if (logger.isDebugEnabled())
            {
                logger.debug("ScriptFormService.saveForm: postData not instanceof FormData.");
            }
            return null;
        }

        return formService.saveForm(new Item(itemKind, itemId), dataForFormService);
    }

}
