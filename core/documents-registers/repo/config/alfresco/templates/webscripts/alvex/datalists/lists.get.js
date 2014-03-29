<import resource="classpath:/alfresco/templates/webscripts/org/alfresco/slingshot/datalists/parse-args.lib.js">

/**
 * Copyright (C) 2005-2010 Alfresco Software Limited.
 * Copyright (C) 2014 ITD Systems, LLC.
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
 * Main entry point: Return list of Data Lists
 *
 * @method getDataLists
 */
function getDataLists()
{
   // Use helper function to get the arguments
   var parsedArgs = ParseArgs.getParsedArgs();
   if (parsedArgs === null)
   {
      return;
   }
   
   var dls = parsedArgs.rootNode.childAssocs["cm:contains"] || [];
   var lists = [];
   for each(var dl in dls)
   {
      var type = dl.properties["dl:dataListItemType"];
      lists.push( {
         dl: dl,
         typeTitle: alvexDictionaryService.getCompleteTypeDescription(type)["title"]
      });
   }
   
   return (
   {
      container: parsedArgs.rootNode,
      lists: lists
   });
}

model.datalists = getDataLists();