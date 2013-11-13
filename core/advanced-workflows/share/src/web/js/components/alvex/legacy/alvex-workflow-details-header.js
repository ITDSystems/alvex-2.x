/**
 * Copyright (C) 2005-2010 Alfresco Software Limited.
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

// Ensure root object exists
if (typeof Alvex == "undefined" || !Alvex)
{
	var Alvex = {};
}

/**
 * WorkflowDetailsHeader component.
 *
 * @namespace Alvex
 * @class Alvex.WorkflowDetailsHeader
 */
(function()
{
   /**
    * YUI Library aliases
    */
   var Dom = YAHOO.util.Dom,
      Event = YAHOO.util.Event,
      Selector = YAHOO.util.Selector;

   /**
    * Alfresco Slingshot aliases
    */
   var $html = Alfresco.util.encodeHTML,
       $combine = Alfresco.util.combinePaths;

   /**
    * WorkflowDetailsHeader constructor.
    *
    * @param {String} htmlId The HTML id of the parent element
    * @return {Alvex.WorkflowDetailsHeader} The new WorkflowDetailsHeader instance
    * @constructor
    */
   Alvex.WorkflowDetailsHeader = function WorkflowDetailsHeader_constructor(htmlId)
   {
      Alvex.WorkflowDetailsHeader.superclass.constructor.call(this, "Alvex.WorkflowDetailsHeader", htmlId, ["button", "container", "datasource", "datatable"]);

      /* Decoupled event listeners */
      YAHOO.Bubbling.on("workflowDetailedData", this.onWorkflowDetailedData, this);

      return this;
   };

   YAHOO.extend(Alvex.WorkflowDetailsHeader, Alfresco.component.Base,
   {

      /**
       * Object container for initialization options
       *
       * @property options
       * @type object
       */
      options:
      {
         /**
          * The taskId for the task related to the workflow, if any.
          *
          * @property taskId
          * @type String
          * @default null
          */
         taskId: null
      },
      
      /**
       * Event handler called when the "onWorkflowDetailedData" event is received
       *
       * @method: onWorkflowDetailedData
       */
      onWorkflowDetailedData: function TDH_onWorkflowDetailedData(layer, args)
      {
         // Display workflow description
         var workflow = args[1],
            title = null,
            taskId = this.options.taskId || workflow.startTaskInstanceId;

         Selector.query("h1 span", this.id, true).innerHTML = $html(workflow.message);

//         Alfresco.util.Ajax.jsonGet(
//         {
//            url: $combine(Alfresco.constants.PROXY_URI, "api/alvex/related-workflows/", workflow.id, "/parent-task"),
//            successCallback:
//            {
//               fn: function(resp)
//               {
//                  if( resp.json.data.parentTask == '' )
//                     return;
//                  var parentTaskUrl = "task-details?taskId=" + resp.json.data.parentTask;
//                  if (this.options.referrer)
//                  {
//                     parentTaskUrl += "&referrer=" + encodeURIComponent(this.options.referrer);
//                  }
//                  Selector.query("a", this.id + '-parent', true).setAttribute("href", Alfresco.util.siteURL(parentTaskUrl));
//                  Dom.removeClass(Dom.get(this.id + '-parent'), "hidden");
//               },
//               scope: this
//            }
//         });

      }

   });

})();
