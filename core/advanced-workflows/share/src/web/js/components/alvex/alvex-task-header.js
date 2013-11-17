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
 * TaskHeader component.
 *
 * @namespace Alvex
 * @class Alvex.TaskHeader
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
       $hasEventInterest = Alfresco.util.hasEventInterest,
       $siteURL = Alfresco.util.siteURL,
       $combine = Alfresco.util.combinePaths;

   /**
    * TaskHeader constructor.
    *
    * @param {String} htmlId The HTML id of the parent element
    * @return {Alvex.TaskHeader} The new TaskHeader instance
    * @constructor
    */
   Alvex.TaskHeader = function TaskHeader_constructor(htmlId)
   {
      Alvex.TaskHeader.superclass.constructor.call(this, htmlId, ["button"]);

      // Re-register with our own name
      this.name = "Alvex.TaskHeader";

      // Instance variables
      this.options = YAHOO.lang.merge(this.options, Alvex.TaskHeader.superclass.options);
      Alfresco.util.ComponentManager.reregister(this);
      this.isRunning = false;
      this.taskId = null;

      /* Decoupled event listeners */
      YAHOO.Bubbling.on("taskDetailedData", this.onTaskDetailedData, this);
	  YAHOO.Bubbling.on("workflowDetailedData", this.onWorkflowDetailedData, this);

      return this;
   };

   /**
    * Extend from Alfresco.component.ShareFormManager
    */
   YAHOO.extend(Alvex.TaskHeader, Alfresco.component.ShareFormManager, 
   {

      /**
       * Keeps track if this component is running an action or not
       *
       * @property isRunning
       * @type Boolean
       */
      isRunning: false,

      /**
       * The task instance id
       *
       * @property taskId
       * @type String
       */
      taskId: null,

      /**
       * Fired by YUI when parent element is available for scripting.
       * Template initialisation, including instantiation of YUI widgets and event listener binding.
       *
       * @method onReady
       */
      onReady: function TEH_onReady()
      {

      },      
			  
	  onWorkflowDetailedData: function(layer, args)
	  {
		 var workflow = args[1];
		 if( ! workflow.id )
			 return;

         // Display task information
         Selector.query("h1 span", this.id + "-title", true).innerHTML = $html(workflow.message);
         Selector.query("h3 span", this.id + "-subtitle", true).innerHTML = $html(workflow.description);
		 
         Selector.query("h3 span", this.id + "-prio", true).innerHTML = $html(workflow.tasks[0].propertyLabels.bpm_priority);
         Selector.query("h3 span", this.id + "-status", true).innerHTML = ( workflow.isActive ? this.msg("label.inProgress") : this.msg("label.completed") );
	  },

      /**
       * Event handler called when the "taskDetailedData" event is received
       *
       * @method: onTaskDetailedData
       */
      onTaskDetailedData: function TEH_onTaskDetailedData(layer, args)
      {
         // Hide button on the bottom of the form
		 // FIXME - it's not nice to have this code here
		 var id = this.id.replace('task-header','task-form') + '-form-buttons';
		 var formButEl = Dom.get( id );
         Dom.addClass(formButEl, "hidden");

         var task = args[1];
		 if( ! task.id )
			 return;

         // Save task id so we can use it when invoking actions later
         this.taskId = task.id;

         // Display task information
         Selector.query("h1 span", this.id + "-title", true).innerHTML = $html(task.workflowInstance.message);
         Selector.query("h3 span", this.id + "-subtitle", true).innerHTML = $html(task.title);
		 
         Selector.query("h3 span", this.id + "-prio", true).innerHTML = $html(task.propertyLabels.bpm_priority);
         Selector.query("h3 span", this.id + "-status", true).innerHTML = $html(task.propertyLabels.bpm_status);

         if (task.isClaimable)
         {
            Dom.removeClass(Selector.query(".unassigned-message", this.id), "hidden");
         }

         // If it's not my task - that's it 
         if( task.owner.userName !== Alfresco.constants.USERNAME )
            return;

         // If it's my - update it

         // Mark task as started
         var dataObj = {};
         dataObj["prop_bpm_status"] = "In Progress";

         var actionUrl = Alvex.util.getFormElement(this.id.replace('header','form') + '-form').action; 

         Alvex.util.processAjaxQueue({
            queue: [
               {
                  url: actionUrl,
                  method: Alfresco.util.Ajax.POST,
                  dataObj: dataObj,
                  requestContentType: Alfresco.util.Ajax.JSON
               }
            ]
         });
      }

   });
})();
