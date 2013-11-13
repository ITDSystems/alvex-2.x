/**
 * Copyright (C) 2005-2010 Alfresco Software Limited.
 * Copyright © 2012-2013 ITD Systems
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
 * TaskDetailsHeader component.
 *
 * @namespace Alvex
 * @class Alvex.TaskDetailsHeader
 */
(function()
{
   /**
    * YUI Library aliases
    */
   var Dom = YAHOO.util.Dom,
      Selector = YAHOO.util.Selector;

   /**
    * Alfresco Slingshot aliases
    */
    var $html = Alfresco.util.encodeHTML,
      $combine = Alfresco.util.combinePaths;

   /**
    * TaskDetailsHeader constructor.
    *
    * @param {String} htmlId The HTML id of the parent element
    * @return {Alvex.TaskDetailsHeader} The new TaskDetailsHeader instance
    * @constructor
    */
   Alvex.TaskDetailsHeader = function TDH_constructor(htmlId)
   {
      Alvex.TaskDetailsHeader.superclass.constructor.call(this, "Alvex.TaskDetailsHeader", htmlId, ["button"]);

      /* Decoupled event listeners */
      YAHOO.Bubbling.on("taskDetailedData", this.onTaskDetailsData, this);

      return this;
   };

   /**
    * Extend from Alfresco.component.Base
    */
   YAHOO.extend(Alvex.TaskDetailsHeader, Alfresco.component.Base);

   /**
    * Augment prototype with RelatedWorkflowsTreeView from Alvex
    */
   // YAHOO.lang.augmentProto(Alvex.TaskDetailsHeader, Alvex.RelatedWorkflowsTreeView);

   YAHOO.lang.augmentObject(Alvex.TaskDetailsHeader.prototype,
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
          * Adds referrer to the url if present
          *
          * @property referrer
          * @type String
          */
         referrer: null,

         /**
          * Adds nodeRef to the url if present
          *
          * @property nodeRef
          * @type String
          */
         nodeRef: null
      },

      /**
       * Event handler called when the "taskDetailedData" event is received
       *
       * @method: onTaskDetailsData
       */
      onTaskDetailsData: function TDH_onTaskDetailsData(layer, args)
      {
         // Hide buttons on the bottom of the form
         Dom.addClass(Selector.query(".task-details-actions", this.id.replace('header','actions'), true), "hidden");

         // Set workflow details url and display link
         var task = args[1],
            taskId = task.id,
            message = task.properties["bpm_description"],
            workflowId = task.workflowInstance.id,
            workflowDetailsUrl = "workflow-details?workflowId=" + workflowId + "&taskId=" + taskId,
            taskEditUrl = "task-edit?taskId=" + taskId;
         this.taskId = taskId;
         this.workflowId = workflowId;
         if (this.options.referrer)
         {
            workflowDetailsUrl += "&referrer=" + encodeURIComponent(this.options.referrer);
            taskEditUrl += "&referrer=" + encodeURIComponent(this.options.referrer);
         }
         else if (this.options.nodeRef)
         {
            workflowDetailsUrl += "&nodeRef=" + encodeURIComponent(this.options.nodeRef);
         }
         Selector.query("a", this.id + '-workflow', true).setAttribute("href", Alfresco.util.siteURL(workflowDetailsUrl));
         Dom.removeClass(Selector.query(".links", this.id, true), "hidden");
         Selector.query("h1 span", this.id, true).innerHTML = $html(task.workflowInstance.message);
         Selector.query("h3 span", this.id, true).innerHTML = $html(task.title);

//         Alfresco.util.Ajax.jsonGet(
//         {
//            url: $combine(Alfresco.constants.PROXY_URI, "api/alvex/related-workflows/", workflowId, "/parent-task"),
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

         // Edit button
         if( ( task.owner && task.owner.userName == Alfresco.constants.USERNAME ) 
               || ( task.workflowInstance.initiator && task.workflowInstance.initiator.userName == Alfresco.constants.USERNAME )
               || ( Alfresco.constants.USERNAME == 'admin' ) )
         {
            this.widgets.editButton = Alfresco.util.createYUIButton(this, "edit", null, {"type": "link", "href": Alfresco.util.siteURL(taskEditUrl) });
            Dom.removeClass(Selector.query(".actions .edit", this.id), "hidden");
         }

         // Tree of related workflows
         if ( Dom.get( this.id + '-tree-view' ) )
         {
            this.widgets.treeView = Alfresco.util.createYUIButton(this, "tree-view", this.onTreeViewClick);
            Dom.removeClass(Selector.query(".actions .tree-view", this.id), "hidden");
         }

      }

   });
})();
