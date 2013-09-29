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
 * TaskDates component.
 *
 * @namespace Alvex
 * @class Alvex.TaskDates
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
    * TaskDates constructor.
    *
    * @param {String} htmlId The HTML id of the parent element
    * @return {Alvex.TaskDates} The new TaskDates instance
    * @constructor
    */
   Alvex.TaskDates = function TaskDates_constructor(htmlId)
   {
      Alvex.TaskDates.superclass.constructor.call(this, htmlId, ["button"]);

      // Re-register with our own name
      this.name = "Alvex.TaskDates";

      // Instance variables
      this.options = YAHOO.lang.merge(this.options, Alvex.TaskDates.superclass.options);
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
   YAHOO.extend(Alvex.TaskDates, Alfresco.component.ShareFormManager, 
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

      /**
       * Event handler called when the "taskDetailedData" event is received
       *
       * @method: onTaskDetailedData
       */
      onTaskDetailedData: function TEH_onTaskDetailedData(layer, args)
      {
         var task = args[1];
		 if( !task.id )
			 return;
		 this.showDates(task);
	  },

	  onWorkflowDetailedData: function(layer, args)
	  {
		  var workflow = args[1];
		  if( !workflow.id )
			 return;
		  this.showDates(workflow.tasks[0]);
	  },
	  
	  showDates: function(task)
	  {
         // Display task information
         Selector.query("span", this.id + "-due", true).innerHTML 
							= this.getDateString(task.properties["bpm_dueDate"]);
		 Selector.query("span", this.id + "-completed", true).innerHTML 
							= this.getDateString(task.properties["bpm_completionDate"]);
		 Selector.query("span", this.id + "-workflow-started", true).innerHTML 
							= this.getDateString(task.workflowInstance["startDate"]);
		 Selector.query("span", this.id + "-task-started", true).innerHTML 
							= this.getDateString(task.properties["bpm_startDate"]);
      },
			  
		getDateString: function(prop)
		{
			return $html ( prop !== null ?
							Alfresco.util.formatDate(prop, "mediumDate") : this.msg("label.noDate") );
		}

   });
})();
