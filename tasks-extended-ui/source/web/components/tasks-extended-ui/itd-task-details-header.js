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
if (typeof ITD == "undefined" || !ITD)
{
	var ITD = {};
}

/**
 * TaskDetailsHeader component.
 *
 * @namespace ITD
 * @class ITD.TaskDetailsHeader
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
    var $html = Alfresco.util.encodeHTML;

   /**
    * TaskDetailsHeader constructor.
    *
    * @param {String} htmlId The HTML id of the parent element
    * @return {ITD.TaskDetailsHeader} The new TaskDetailsHeader instance
    * @constructor
    */
   ITD.TaskDetailsHeader = function TDH_constructor(htmlId)
   {
      ITD.TaskDetailsHeader.superclass.constructor.call(this, "ITD.TaskDetailsHeader", htmlId, ["button"]);

      /* Decoupled event listeners */
      YAHOO.Bubbling.on("taskDetailedData", this.onTaskDetailsData, this);

      return this;
   };

   YAHOO.extend(ITD.TaskDetailsHeader, Alfresco.component.Base,
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
         // Set workflow details url and display link
         var task = args[1],
            taskId = task.id,
            message = task.properties["bpm_description"],
            workflowId = task.workflowInstance.id,
            workflowDetailsUrl = "workflow-details?workflowId=" + workflowId + "&taskId=" + taskId;
         if (this.options.referrer)
         {
            workflowDetailsUrl += "&referrer=" + encodeURIComponent(this.options.referrer);
         }
         else if (this.options.nodeRef)
         {
            workflowDetailsUrl += "&nodeRef=" + encodeURIComponent(this.options.nodeRef);
         }
         Selector.query(".links a", this.id, true).setAttribute("href", Alfresco.util.siteURL(workflowDetailsUrl));
         Dom.removeClass(Selector.query(".links", this.id, true), "hidden");
         Selector.query("h1 span", this.id, true).innerHTML = $html(task.workflowInstance.message);
         Selector.query("h3 span", this.id, true).innerHTML = $html(task.title);
      }
   });
})();
