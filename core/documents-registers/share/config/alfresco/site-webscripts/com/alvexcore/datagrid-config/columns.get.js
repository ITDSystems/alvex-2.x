/**
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

/**
 * Retrieves the value of the given named argument from the URL arguments
 *
 * @method getArgument
 * @param argName The name of the argument to locate
 * @param defValue The default value to use if the argument could not be found
 * @return The value or null if not found
 */
function getArgument(argName, defValue)
{
   var result = args[argName];
   
   // if we don't have a result and a default has been defined, return that instead
   if (result === null && typeof defValue !== "undefined")
   {
      result = defValue;
   }
   
   return result;
}

function getFormsConfig(itemId, formId)
{
   var nodeConfig = config.scoped[itemId];

   if (nodeConfig !== null)
      return nodeConfig.forms;

   return null;
}


/**
 * Finds the configuration for the given item id, if
 * there isn't any configuration for the item null is
 * returned.
 *
 * @method getFormConfig
 * @param itemId The id of the item to retrieve for config for
 * @param formId The id of the specific form to lookup or null
 *               to get the default form
 * @return Object representing the configuration or null
 */
function getFormConfig(itemId, formId)
{
   var formConfig = null;
   
   // query for configuration for item
   var nodeConfig = config.scoped[itemId];
   
   if (nodeConfig !== null)
   {
      // get the forms configuration
      var formsConfig = nodeConfig.forms;

      if (formsConfig !== null)
      {
         if (formId !== null && formId.length > 0)
         {
            // look up the specific form
            formConfig = formsConfig.getForm(formId);
         }
         
         // drop back to default form if formId config missing
         if (formConfig === null)
         {
            // look up the default form
            formConfig = formsConfig.defaultForm;
         }
      }
   }
   
   return formConfig;
}

/**
 * Returns the list of fields configured to be visible for the 
 * given mode. If this method returns null or an empty list the
 * component should attempt to display ALL known data for the item, 
 * unless there are fields configured to be hidden.
 *
 * @method getVisibleFields
 * @param mode The mode the form is rendering, 'view', 'edit' or 'create'
 * @param formConfig The form configuration, maybe null
 * @return Array of field names or null
 */
function getVisibleFields(mode, formConfig)
{
   var visibleFields = null;
   
   if (formConfig !== null)
   {
      // get visible fields for the current mode
      switch (mode)
      {
         case "view":
            visibleFields = formConfig.visibleViewFieldNames;
            break;
         case "edit":
            visibleFields = formConfig.visibleEditFieldNames;
            break;
         case "create":
            visibleFields = formConfig.visibleCreateFieldNames;
            break;
         default:
            visibleFields = formConfig.visibleViewFieldNames;
            break;
      }
   }
   
   if (logger.isLoggingEnabled())
   {
      var listOfVisibleFields = visibleFields;
      if (visibleFields !== null)
      {
         listOfVisibleFields = "[" + visibleFields.join(",") + "]";
      }
      logger.log("Fields configured to be visible for " + mode + " mode = " + listOfVisibleFields);
   }
         
   return visibleFields;
}

/**
 * Creates an Object to represent the body of the POST request
 * to send to the form service.
 *
 * @method createPostBody
 * @param itemKind The kind of item
 * @param itemId The id of the item
 * @param visibleFields List of fields to get data for
 * @param formConfig The form configuration object
 * @return Object representing the POST body
 */
function createPostBody(itemKind, itemId, visibleFields, formConfig)
{
   var postBody = {};
   
   postBody.itemKind = itemKind;
   postBody.itemId = itemId.replace(":/", "");
   
   if (visibleFields !== null)
   {
      // create list of fields to show and a list of
      // those fields to 'force'
      var postBodyFields = [];
      var postBodyForcedFields = [];
      var fieldId = null;
      for (var f = 0; f < visibleFields.length; f++)
      {
         fieldId = visibleFields[f];
         postBodyFields.push(fieldId);
         if (formConfig.isFieldForced(fieldId))
         {
            postBodyForcedFields.push(fieldId);
         }
      }
      
      postBody.fields = postBodyFields;
      if (postBodyForcedFields.length > 0)
      {
         postBody.force = postBodyForcedFields;
      }
   }
   
   if (logger.isLoggingEnabled())
   {
      logger.log("postBody = " + jsonUtils.toJSONString(postBody));
   }
      
   return postBody;
}

/**
 * Main entrypoint for component webscript logic
 *
 * @method main
 */
function main()
{
   var itemType = getArgument("itemType"),
      columns = [];
   
   if (itemType !== null && itemType.length > 0)
   {
      // get the configs for the forms of interest
      var viewFormConfig = getFormConfig(itemType, "view");
      var datagridFormConfig = getFormConfig(itemType, "datagrid");
      
      // get all possible visible fields (from view form)
      var allPossibleFields = getVisibleFields("view", viewFormConfig);
      // get default visible fields for datagrid
      var datagridDefaultFields = getVisibleFields("view", datagridFormConfig);
      
      // build the JSON object to send to the server
      var postBody = createPostBody("type", itemType, allPossibleFields, viewFormConfig);
         
      // make remote call to service
      var connector = remote.connect("alfresco");
      var json = connector.post("/api/formdefinitions", jsonUtils.toJSONString(postBody), "application/json");
      
      if (logger.isLoggingEnabled())
      {
         logger.log("json = " + json);
      }
      
      if (json.status == 401)
      {
         status.setCode(json.status, "Not authenticated");
         return;
      }
      else
      {
         // we requested model for all possible fields, but will use Share config from datagrid only
         var formModel = eval('(' + json + ')');
         var formFields = datagridFormConfig.getFields();
         
         // if we got a successful response attempt to render the form
         if (json.status == 200)
         {
            columns = formModel.data.definition.fields;
            for each( var item in columns )
            {
               // check if this item is in default datagrid config or not
               for each( var datagridField in datagridDefaultFields )
                  if( datagridField == item.name )
                     item.showByDefault = true;
               // if there is a datagrid config for the field
               if( formFields[item.name] )
               {
                  var templ = formFields[item.name].getControl().getTemplate();
                  var attrs = formFields[item.name].getAttributes();
                  item.isSortKey = (attrs["isSortKey"] !== null ? true : false);
                  item.sortOrder = attrs["sortOrder"];
                  item.isItemName = (attrs["isSortKey"] !== null ? true : false);
               }
               item.renderer = (templ ? templ : "");
            } 
         }
         else
         {
            model.error = formModel.message;
         }
      }
   }

   // sort results - datagrid default fields go first
   var sortedColumns = [];
   for each( var datagridField in datagridDefaultFields )
      for each( var item in columns )
         if( item.name == datagridField )
         {
            sortedColumns.push(item);
            columns.splice(columns.indexOf(item), 1);
            break;
         }
   sortedColumns.push.apply(sortedColumns, columns);
   
   // pass form ui model to FTL
   model.columns = sortedColumns;
}

main();
