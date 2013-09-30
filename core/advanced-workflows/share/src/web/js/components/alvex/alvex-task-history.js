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
 * TaskHistory component.
 *
 * @namespace Alvex
 * @class Alvex.TaskHistory
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
    * TaskHistory constructor.
    *
    * @param {String} htmlId The HTML id of the parent element
    * @return {Alvex.TaskHistory} The new TaskHistory instance
    * @constructor
    */
   Alvex.TaskHistory = function TaskHistory_constructor(htmlId)
   {
      Alvex.TaskHistory.superclass.constructor.call(this, htmlId, ["button"]);

      // Re-register with our own name
      this.name = "Alvex.TaskHistory";

      // Instance variables
      this.options = YAHOO.lang.merge(this.options, Alvex.TaskHistory.superclass.options);
      Alfresco.util.ComponentManager.reregister(this);
      this.isRunning = false;
      this.taskId = null;

      /* Decoupled event listeners */
      YAHOO.Bubbling.on("workflowDetailedData", this.onWorkflowDetailedData, this);

      return this;
   };

   /**
    * Extend from Alfresco.component.ShareFormManager
    */
   YAHOO.extend(Alvex.TaskHistory, Alfresco.component.ShareFormManager, 
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
      onWorkflowDetailedData: function TEH_onTaskDetailedData(layer, args)
      {
         this.workflow = args[1];
		 this.historyTasks = [];
		 this.currentTasks = [];
		 if( ! this.workflow.id )
			return;
		 this.showWorkflowHistory();
      },
			  
      showWorkflowHistory: function()
      {
            // Split the task list in current and history tasks and save the most recent one
            var tasks = this.workflow.tasks;
            for (var i = 0, il = tasks.length; i < il; i++)
            {
               if (tasks[i].state === "COMPLETED")
               {
                  this.historyTasks.push(tasks[i]);
               }
               else
               {
                  this.currentTasks.push(tasks[i]);
               }
            }

            var sortByDate = function(dateStr1, dateStr2)
            {
               var date1 = Alfresco.util.fromISO8601(dateStr1),
                  date2 = Alfresco.util.fromISO8601(dateStr2);
               if (date1 && date2)
               {
                  return date1 < date2 ? 1 : -1;
               }
               else
               {
                  return !date1 ? 1 : -1;
               }
            };

            // Sort current tasks by due date
            this.currentTasks.sort(function(task1, task2)
            {
               return sortByDate(task1.properties.bpm_dueDate, task2.properties.bpm_dueDate);
            });

            // Sort history tasks by completion date
            this.historyTasks.sort(function(task1, task2)
            {
               return sortByDate(task1.properties.bpm_completionDate, task2.properties.bpm_completionDate);
            });

			// Create header and data table elements
			var currentTasksEl = Dom.get(this.id + "-workflow-currentTasks");

			// DataTable column definitions for current tasks
			var currentTasksColumnDefinitions =
			[
			   { key: "name", label: this.msg("column.type"), formatter: this.bind(this.renderCellType) },
			   { key: "owner", label: this.msg("column.assignedTo"), formatter: this.bind(this.renderCellOwner) },
			   { key: "id", label: this.msg("column.dueDate"), formatter: this.bind(this.renderCellDueDate) },
			   { key: "state", label: this.msg("column.status"), formatter: this.bind(this.renderCellStatus) }
			];

			// Create current tasks data table filled with current tasks
			var currentTasksDS = new YAHOO.util.DataSource(this.currentTasks,
			{
			   responseType: YAHOO.util.DataSource.TYPE_JSARRAY
			});
			this.widgets.currentTasksDataTable = new YAHOO.widget.DataTable(currentTasksEl, currentTasksColumnDefinitions, currentTasksDS,
			{
			   MSG_EMPTY: this.msg("label.noTasks")
			});

			// DataTable column definitions workflow history
			var historyColumnDefinitions =
			[
			   { key: "name", label: this.msg("column.type"), formatter: this.bind(this.renderCellType) },
			   { key: "owner", label: this.msg("column.completedBy"), formatter: this.bind(this.renderCellCompletedBy) },
			   { key: "id", label: this.msg("column.dateCompleted"), formatter: this.bind(this.renderCellDateCompleted) },
			   { key: "state", label: this.msg("column.outcome"), formatter: this.bind(this.renderCellOutcome) }
			];

			// Create header and data table elements
			var historyTasksEl = Dom.get(this.id + "-workflow-historyTasks");

			// Create workflow history data table filled with history tasks
			var workflowHistoryDS = new YAHOO.util.DataSource(this.historyTasks,
			{
			   responseType: YAHOO.util.DataSource.TYPE_JSARRAY
			});
			this.widgets.historyTasksDataTable = new YAHOO.widget.DataTable(historyTasksEl, historyColumnDefinitions, workflowHistoryDS,
			{
			   MSG_EMPTY: this.msg("label.noTasks")
			});

      },

      /**
       * Render task type as link
       *
       * @method renderCellType
       * @param elCell {object}
       * @param oRecord {object}
       * @param oColumn {object}
       * @param oData {object|string}
       */
      renderCellType: function WorkflowForm_renderCellType(elCell, oRecord, oColumn, oData)
      {
         var task = oRecord.getData();
         elCell.innerHTML = '<a href="' + this._getTaskUrl("task-details", oRecord.getData("id")) + '" title="' + this.msg("link.title.task-details") + '">' + $html(oRecord.getData("title")) + '</a>';
      },

      /**
       * Render task owner as link
       *
       * @method renderCellOwner
       * @param elCell {object}
       * @param oRecord {object}
       * @param oColumn {object}
       * @param oData {object|string}
       */
      renderCellOwner: function WorkflowForm_renderCellOwner(elCell, oRecord, oColumn, oData)
      {
         var owner = oRecord.getData("owner");
         if (owner != null && owner.userName)
         {
            var displayName = $html(this.msg("field.owner", owner.firstName, owner.lastName));
            elCell.innerHTML = Alfresco.util.userProfileLink(owner.userName, owner.firstName && owner.lastName ? displayName : null, null, !owner.firstName);
         }
         else {
            elCell.innerHTML = this.msg("label.none");
         }
      },
      
      /**
       * Render task completer (= owner) as link when the task actually has been Completed (eg. not the case when
       * parallel tasks aren't actually completed due to loop-stop was condition met). 
       *
       * @method renderCellOwner
       * @param elCell {object}
       * @param oRecord {object}
       * @param oColumn {object}
       * @param oData {object|string}
       */
      renderCellCompletedBy: function WorkflowForm_renderCellCompletedBy(elCell, oRecord, oColumn, oData)
      {
    	  var status = oRecord.getData("properties").bpm_status;
    	 
    	  // Value based on list 'bpm:allowedStatus' in bpmModel.xml 
    	  if(status != null && status != "Completed") 
    	  {
    		  elCell.innerHTML = this.msg("label.none");
    	  }
    	  else
    	  {
    		  this.renderCellOwner(elCell, oRecord, oColumn, oData);
    	  }
      },

      /**
       * Render task completed date
       *
       * @method TL_renderCellSelected
       * @param elCell {object}
       * @param oRecord {object}
       * @param oColumn {object}
       * @param oData {object|string}
       */
      renderCellDateCompleted: function WorkflowForm_renderCellDateCompleted(elCell, oRecord, oColumn, oData)
      {
         var completionDate = Alfresco.util.fromISO8601(oRecord.getData("properties").bpm_completionDate);
         elCell.innerHTML = Alfresco.util.formatDate(completionDate, "longDate") + ' ' + Alfresco.util.formatDate(completionDate, "shortTime");
      },

      /**
       * Render task due date
       *
       * @method renderCellDueDate
       * @param elCell {object}
       * @param oRecord {object}
       * @param oColumn {object}
       * @param oData {object|string}
       */
      renderCellDueDate: function WorkflowForm_renderCellDueDate(elCell, oRecord, oColumn, oData)
      {
         var dueISODate = oRecord.getData("properties").bpm_dueDate;
         if (dueISODate !== null)
         {
            var dueDate = Alfresco.util.fromISO8601(dueISODate);
            elCell.innerHTML = Alfresco.util.formatDate(dueDate, "longDate");
         }
         else
         {
            elCell.innerHTML = this.msg("label.none");
         }
      },

      /**
       * Render task status
       *
       * @method TL_renderCellSelected
       * @param elCell {object}
       * @param oRecord {object}
       * @param oColumn {object}
       * @param oData {object|string}
       */
      renderCellStatus: function WorkflowForm_renderCellStatus(elCell, oRecord, oColumn, oData)
      {
         var status = oRecord.getData("properties").bpm_status;
         if (oRecord.getData("propertyLabels") && Alfresco.util.isValueSet(oRecord.getData("propertyLabels").bpm_status, false))
         {
            status = oRecord.getData("propertyLabels").bpm_status;
         }
         
         elCell.innerHTML = $html(status);
      },

      /**
       * Render task outcome
       *
       * @method renderCellOutcome
       * @param elCell {object}
       * @param oRecord {object}
       * @param oColumn {object}
       * @param oData {object|string}
       */
      renderCellOutcome: function WorkflowForm_renderCellOutcome(elCell, oRecord, oColumn, oData)
      {
         elCell.innerHTML = $html(oRecord.getData("outcome"));
      },
			  
      /**
       * Returns a task url
       *
       * @method _getTaskUrl
       * @private
       */
      _getTaskUrl: function WF___getReferrer(page, taskId)
      {
         var url = page + "?taskId=" +encodeURIComponent(taskId);
         if (this.options.referrer)
         {
            url += "&referrer=" + encodeURIComponent(this.options.referrer);
         }
         else if (this.options.nodeRef)
         {
            url += "&nodeRef=" + encodeURIComponent(this.options.nodeRef);
         }
         return $siteURL(url);
      }

   });
})();
