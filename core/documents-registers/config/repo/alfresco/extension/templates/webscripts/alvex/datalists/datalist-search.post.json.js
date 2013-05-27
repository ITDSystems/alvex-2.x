<import resource="classpath:/alfresco/templates/webscripts/org/alfresco/slingshot/datalists/evaluator.lib.js">
<import resource="classpath:/alfresco/templates/webscripts/org/alfresco/slingshot/datalists/parse-args.lib.js">

var Filters =
{
   /**
    * Types that we want to suppress from the resultset
    */
   IGNORED_TYPES:
   [
      "cm:systemfolder",
      "fm:forums",
      "fm:forum",
      "fm:topic",
      "fm:post"
   ],

   readFilter: function f()
   {
      // Filter
      var filter = null;
      if (typeof json !== "undefined" && json.has("filter"))
      {
         var filterJSON = json.get("filter");
         if (filterJSON != null)
         {
            filter = jsonUtils.toObject(filterJSON);
         }
         else
         {
            filter =
            {
               filterId: "all"
            }
         }
      }
      return filter;
   },

   searchParams: function f(nodes, filter)
   {
      var filtered = [];

      for each (node in nodes)
      {
         var totalMatch = true;
         for( var prop in filter.searchFields.props )
         {
            var filterMatch = true;
            var pattern = filter.searchFields.props[prop];
            prop = prop.replace("_",":");
            if( pattern != "" && pattern[0] != '[' )
            {
               filterMatch = false;
               var value = node.properties[prop];
               if( value.toLowerCase != undefined )
                  if( value.toLowerCase().match(pattern.toLowerCase()) )
                     filterMatch = true;
               else
                  if( value == pattern )
                     filterMatch = true;
            }
            totalMatch = (totalMatch && filterMatch);
         }
         if( totalMatch )
            filtered.push(node);
      }

      return filtered;
   },

   searchAssocs: function f(nodes, filter)
   {
      var filtered = [];

      for each (node in nodes)
      {
         var totalMatch = true;
         for( var assoc in filter.searchFields.assocs )
         {
            var filterMatch = true;
            var pattern = filter.searchFields.assocs[assoc];
            assoc = assoc.replace("_",":");
            if( pattern != "" )
            {
               filterMatch = false;
               for each( item in node.assocs[assoc] )
               {
                  var displayValue = '';
                  if( item.type == "{http://www.alfresco.org/model/content/1.0}person" )
                     displayValue = item.properties.firstName + ' ' + item.properties.lastName;
                  else
                     displayValue = item.properties.name;
                  if( displayValue.toLowerCase().match(pattern.toLowerCase()) )
                     filterMatch = true;
               }
            }
            totalMatch = (totalMatch && filterMatch);
         }
         if( totalMatch )
            filtered.push(node);
      }

      return filtered;
   },

   /**
    * Create filter parameters based on input parameters
    *
    * @method getFilterParams
    * @param filter {string} Required filter
    * @param parsedArgs {object} Parsed arguments object literal
    * @return {object} Object literal containing parameters to be used in Lucene search
    */
   getFilterParams: function Filter_getFilterParams(filter, parsedArgs)
   {
      var filterParams =
      {
         query: "+PARENT:\"" + parsedArgs.nodeRef + "\" ",
         limitResults: null,
         sort: [
         {
            column: "@cm:name",
            ascending: true
         }],
         language: "lucene",
         templates: null
      };

      // Max returned results specified?
      var argMax = args.max;
      if ((argMax !== null) && !isNaN(argMax))
      {
         filterParams.limitResults = argMax;
      }

      // Create query based on passed-in arguments
      var filterData = String(filter.filterData || ""),
         filterQuery = filterParams.query;

      // Common types and aspects to filter from the UI
      var filterQueryDefaults = ' -TYPE:"' + Filters.IGNORED_TYPES.join('" -TYPE:"') + '"';

      switch (String(filter.filterId))
      {
         case "recentlyAdded":
         case "recentlyModified":
         case "recentlyCreatedByMe":
         case "recentlyModifiedByMe":
            var onlySelf = (filter.filterId.indexOf("ByMe")) > 0 ? true : false,
               dateField = (filter.filterId.indexOf("Modified") > 0) ? "modified" : "created",
               ownerField = (dateField == "created") ? "creator" : "modifier";

            // Default to 7 days - can be overridden using "days" argument
            var dayCount = 7,
               argDays = args.days;
            if ((argDays !== null) && !isNaN(argDays))
            {
               dayCount = argDays;
            }

            // Default limit to 50 documents - can be overridden using "max" argument
            if (filterParams.limitResults === null)
            {
               filterParams.limitResults = 50;
            }

            var date = new Date();
            var toQuery = date.getFullYear() + "\\-" + (date.getMonth() + 1) + "\\-" + date.getDate();
            date.setDate(date.getDate() - dayCount);
            var fromQuery = date.getFullYear() + "\\-" + (date.getMonth() + 1) + "\\-" + date.getDate();

            filterQuery = "+PARENT:\"" + parsedArgs.nodeRef;
            if (parsedArgs.nodeRef == "alfresco://sites/home")
            {
               // Special case for "Sites home" pseudo-nodeRef
               filterQuery += "/*/cm:dataLists";
            }
            filterQuery += "\"";
            filterQuery += " +@cm\\:" + dateField + ":[" + fromQuery + "T00\\:00\\:00.000 TO " + toQuery + "T23\\:59\\:59.999]";
            if (onlySelf)
            {
               filterQuery += " +@cm\\:" + ownerField + ":\"" + person.properties.userName + '"';
            }
            filterQuery += " -TYPE:\"folder\"";

            filterParams.sort = [
            {
               column: "@cm:" + dateField,
               ascending: false
            }];
            filterParams.query = filterQuery + filterQueryDefaults;
            break;

         case "createdByMe":
            // Default limit to 50 documents - can be overridden using "max" argument
            if (filterParams.limitResults === null)
            {
               filterParams.limitResults = 50;
            }

            filterQuery = "+PARENT:\"" + parsedArgs.nodeRef;
            if (parsedArgs.nodeRef == "alfresco://sites/home")
            {
               // Special case for "Sites home" pseudo-nodeRef
               filterQuery += "/*/cm:dataLists";
            }
            filterQuery += "\"";
            filterQuery += " +@cm\\:creator:\"" + person.properties.userName + '"';
            filterQuery += " -TYPE:\"folder\"";
            filterParams.query = filterQuery + filterQueryDefaults;
            break;

         case "node":
            filterParams.query = "+ID:\"" + parsedArgs.nodeRef + "\"";
            break;

         case "tag":
            // Remove any trailing "/" character
            if (filterData.charAt(filterData.length - 1) == "/")
            {
               filterData = filterData.slice(0, -1);
            }
            filterParams.query += "+PATH:\"/cm:taggable/cm:" + search.ISO9075Encode(filterData) + "/member\"";
            break;

         case "search":
            for( var prop in filter.searchFields.props )
               if( filter.searchFields.props[prop] != "" && filter.searchFields.props[prop][0] == '[' )
               {
                  filterParams.query += "+@" + prop.replace("_", "\\:") + ":";
                  filterParams.query += filter.searchFields.props[prop];
                  filterParams.query += " ";
               }
            break;

         //case "search":
         //   for( var prop in filter.searchFields.props )
         //      if( filter.searchFields.props[prop] != "" )
         //      {
         //         filterParams.query += "+@" + prop.replace("_", "\\:") + ":";
         //         var c = filter.searchFields.props[prop][0];
         //         if( (c !== '^') && (c !== '*') && (c !== '[') )
         //            filterParams.query += "*";
         //         filterParams.query += filter.searchFields.props[prop];
         //         c = filter.searchFields.props[prop][ filter.searchFields.props[prop].length - 1 ];
         //         if( (c !== '$') && (c !== '*') && (c !== ']') )
         //            filterParams.query += "*";
         //         filterParams.query += " ";
         //      }
         //   break;

         default:
            filterParams.query = filterQuery + filterQueryDefaults;
            break;
      }

      return filterParams;
   }
};

const REQUEST_MAX = 1000;

/**
 * Copyright (C) 2005-2010 Alfresco Software Limited.
 *
 * This file is part of Alfresco
 *
 * Alfresco is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Alfresco is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Alfresco. If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * Main entry point: Return data list with properties being supplied in POSTed arguments
 *
 * @method getData
 */
function getData()
{
   // Use helper function to get the arguments
   var parsedArgs = ParseArgs.getParsedArgs();
   if (parsedArgs === null)
   {
      return;
   }

   var fields = null;
   // Extract fields (if given)
   if (json.has("fields"))
   {
      // Convert the JSONArray object into a native JavaScript array
      fields = [];
      var jsonFields = json.get("fields"),
         numFields = jsonFields.length();
      
      for (count = 0; count < numFields; count++)
      {
         fields.push(jsonFields.get(count).replaceFirst("_", ":"));
      }
   }

   // Try to find a filter query based on the passed-in arguments
   var filter = Filters.readFilter(),
      allNodes = [], node,
      items = [],
      query = '';

   if (filter == null || filter.filterId == "all")
   {
      // Use non-query method
      var parentNode = parsedArgs.listNode;
      if (parentNode != null)
      {
         var pagedResult = parentNode.childFileFolders(true, false, Filters.IGNORED_TYPES, -1, -1, REQUEST_MAX, "cm:name", true, null);
         allNodes = pagedResult.page;
      }
   }
   else
   {
      var filterParams = Filters.getFilterParams(filter, parsedArgs);
      query = filterParams.query;

      // Query the nodes - passing in default sort and result limit parameters
      if (query !== "")
      {
         allNodes = search.query(
         {
            query: query,
            language: filterParams.language,
            page:
            {
               maxItems: (filterParams.limitResults ? parseInt(filterParams.limitResults, 10) : 0)
            },
            sort: filterParams.sort,
            templates: filterParams.templates,
            namespace: (filterParams.namespace ? filterParams.namespace : null)
         });
      }
   }

   if (allNodes.length > 0)
   {
      // TODO - rework this slow filtering somehow
      if( filter.filterId === "search" )
      {
         allNodes = Filters.searchParams( allNodes, filter );
         allNodes = Filters.searchAssocs( allNodes, filter );
      }

      for each (node in allNodes)
      {
         try
         {
             items.push(Evaluator.run(node, fields));
         }
         catch(e) {}
      }
   }

   return (
   {
      fields: fields,
      query: query,
      paging:
      {
         totalRecords: items.length,
         startIndex: 0
      },
      parent:
      {
         node: parsedArgs.listNode,
         userAccess:
         {
            create: parsedArgs.listNode.hasPermission("CreateChildren"),
            edit: parsedArgs.listNode.hasPermission("Write")
         }
      },
      items: items
   });
}

model.data = getData();
