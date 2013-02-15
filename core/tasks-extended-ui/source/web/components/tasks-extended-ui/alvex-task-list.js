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

if (typeof Alvex == "undefined" || !Alvex)
{
	var Alvex = {};
}

/**
 * TaskList component.
 *
 * @namespace Alfresco
 * @class Alvex.TaskList
 */
(function()
{
   /**
    * YUI Library aliases
    */
   var Dom = YAHOO.util.Dom,
         Event = YAHOO.util.Event;

   /**
    * Alfresco Slingshot aliases
    */
   var $html = Alfresco.util.encodeHTML,
      $siteURL = Alfresco.util.siteURL;

   /**
    * Preferences
    */
   var PREFERENCES_MY_TASKS = "org.alfresco.share.my.tasks";
   var PREFERENCES_MY_TASKS_FILTER = PREFERENCES_MY_TASKS + ".filter";
   var PREFERENCES_MY_TASKS_SORTER = PREFERENCES_MY_TASKS + ".sorter";

   /**
    * DocumentList constructor.
    *
    * @param htmlId {String} The HTML id of the parent element
    * @return {Alvex.TaskList} The new DocumentList instance
    * @constructor
    */
   Alvex.TaskList = function(htmlId)
   {
      Alvex.TaskList.superclass.constructor.call(this, "Alvex.TaskList", htmlId, ["button", "menu", "container", "datasource", "datatable", "paginator", "json", "history"]);

      // Services
      this.services.preferences = new Alfresco.service.Preferences();

      /**
       * Decoupled event listeners
       */
      YAHOO.Bubbling.on("filterChanged", this.onFilterChanged, this);

      return this;
   };

   /**
    * Extend from Alvex.Base
    */
   YAHOO.extend(Alvex.TaskList, Alfresco.component.Base);

   /**
    * Augment prototype with Common Workflow actions to reuse createFilterURLParameters
    */
   YAHOO.lang.augmentProto(Alvex.TaskList, Alfresco.action.WorkflowActions);

   /**
    * Augment prototype with main class implementation, ensuring overwrite is enabled
    */
   YAHOO.lang.augmentObject(Alvex.TaskList.prototype,
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
          * Task types not to display
          *
          * @property hiddenTaskTypes
          * @type Array
          * @default []
          */
         hiddenTaskTypes: [],
         
         /**
          * Instruction show to resolve filter id & data to url parameters 
          *
          * @property filterParameters
          * @type Array
          * @default []
          */
         filterParameters: [],

         /**
          * Number of tasks to display at the same time
          *
          * @property maxItems
          * @type int
          * @default 50
          */
         maxItems: 50
      },

      /**
       * Fired by YUI when parent element is available for scripting.
       * Initial History Manager event registration
       *
       * @method onReady
       */
      onReady: function DL_onReady()
      {
         // Create sorter menu
         this.widgets.sorterMenuButton = Alfresco.util.createYUIButton(this, "sorters", this.onSorterSelected,
         {
            type: "menu",
            menu: "sorters-menu",
            lazyloadmenu: false
         });

         // Load preferences (after which the appropriate tasks will be displayed)
         this.services.preferences.request(PREFERENCES_MY_TASKS,
         {
            successCallback:
            {
               fn: this.onPreferencesLoaded,
               scope: this
            }
         });
      },

      /**
       * Process response from preference query
       *
       * @method onPreferencesLoaded
       * @param p_response {object} Response from "api/people/{userId}/preferences" query
       */
      onPreferencesLoaded: function MyTasks_onPreferencesLoaded(p_response)
      {

         // Select the preferred sorter in the ui
         var sorter = Alfresco.util.findValueByDotNotation(p_response.json, PREFERENCES_MY_TASKS_SORTER, "byDueDate");
         sorter = this.options.sorters.hasOwnProperty(sorter) ? sorter : "byDueDate";
         this.widgets.sorterMenuButton.set("label", this.msg("sorter." + sorter));
         this.widgets.sorterMenuButton.value = sorter;

         // Display the toolbar now that we have selected the filter
         Dom.removeClass(Selector.query(".task-list div", this.id, true), "hidden");

         this.widgets.pagingDataTable = new Alfresco.util.DataTable(
         {
            dataTable:
            {
               container: this.id + "-tasks",
               columnDefinitions:
               [
                  { key: "id", sortable: false, formatter: this.bind(this.renderCellIcons), width: 40 },
                  { key: "title", sortable: false, formatter: this.bind(this.renderCellTaskInfo) },
                  { key: "name", sortable: false, formatter: this.bind(this.renderCellActions), width: 200 }
               ],
               config:
               {
                  MSG_EMPTY: this.msg("message.noTasks")
               }
            },
            dataSource:
            {
               url: this.getDataSourceURL(),
               defaultFilter:
               {
                  filterId: "workflows.active"
               },
               filterResolver: this.bind(function(filter)
               {
                  // Reuse method form WorkflowActions
                  return this.createFilterURLParameters(filter, this.options.filterParameters);
               })
            },
            paginator:
            {
               config:
               {
                  containers: [this.id + "-paginator"],
                  rowsPerPage: this.options.maxItems
               }
            }
         });
      },

      getReqParameters: function()
      {
            var parameters = this.options.sorters[this.widgets.sorterMenuButton.value];
            return parameters;
      },

      getDataSourceURL: function()
      {
            // Prepare webscript url to task instances
            var webscript = YAHOO.lang.substitute("api/alvex/task-instances?authority={authority}&properties={prop}&exclude={exclude}",
            {
                  authority: encodeURIComponent(Alfresco.constants.USERNAME),
                  prop: ["bpm_priority", "bpm_status", "bpm_dueDate", "bpm_startDate", "bpm_completionDate", "bpm_description", "alvexrwf_relatedWorkflows", "itdrwf_relatedWorkflows"].join(","),
                  exclude: this.options.hiddenTaskTypes.join(",")
            });
            return Alfresco.constants.PROXY_URI + webscript + '&' + this.getReqParameters();
      },

      /**
       * Resorts the list with the new sorter and updates the sorter menu button's label
       *
       * @param p_sType {string} The event
       * @param p_aArgs {array} Event arguments
       */
      onSorterSelected: function MyTasks_onSorterSelected(p_sType, p_aArgs)
      {
         var menuItem = p_aArgs[1];
         
         if (menuItem)
         {
            this.widgets.sorterMenuButton.set("label", menuItem.cfg.getProperty("text"));
            this.widgets.sorterMenuButton.value = menuItem.value;
            
            this.widgets.pagingDataTable.widgets.dataSource.liveData = this.getDataSourceURL();
            this.widgets.pagingDataTable.loadDataTable(/*this.getReqParameters()*/);

            // Save preferences
            this.services.preferences.set(PREFERENCES_MY_TASKS_SORTER, menuItem.value);
         }
      },

      /**
       * Fired when the currently active filter has changed
       *
       * @method onFilterChanged
       * @param layer {string} the event source
       * @param args {object} arguments object
       */
      onFilterChanged: function BaseFilter_onFilterChanged(layer, args)
      {
         var filter = Alfresco.util.cleanBubblingObject(args[1]);
         Dom.get(this.id + "-filterTitle").innerHTML = $html(this.msg("filter." + filter.filterId + (filter.filterData ? "." + filter.filterData : ""), filter.filterData));
      },

      /**
       * DataTable Cell Renderers
       */

      /**
       * Priority & pooled icons custom datacell formatter
       *
       * @method TL_renderCellIcons
       * @param elCell {object}
       * @param oRecord {object}
       * @param oColumn {object}
       * @param oData {object|string}
       */
      renderCellIcons: function TL_renderCellIcons(elCell, oRecord, oColumn, oData)
      {
         var priority = oRecord.getData("properties")["bpm_priority"],
               priorityMap = { "1": "high", "2": "medium", "3": "low" },
               priorityKey = priorityMap[priority + ""],
               pooledTask = oRecord.getData("isPooled");
         var desc = '<img src="' + Alfresco.constants.URL_RESCONTEXT + 'components/images/priority-' + priorityKey + '-16.png" title="' + this.msg("label.priority", this.msg("priority." + priorityKey)) + '"/>';
         if (pooledTask)
         {
            desc += '<br/><img src="' + Alfresco.constants.URL_RESCONTEXT + 'components/images/pooled-task-16.png" title="' + this.msg("label.pooledTask") + '"/>';
         }

         if( oRecord.getData("properties")["alvexrwf_relatedWorkflows"] || oRecord.getData("properties")["itdrwf_relatedWorkflows"] )
         {
            desc += '<br/><img src="' + Alfresco.constants.URL_RESCONTEXT + 'components/images/with-related-tasks-16.png" title="' + this.msg("label.withRelatedTasks") + '"/>';
         }

         elCell.innerHTML = desc;
      },

      /**
       * Task info custom datacell formatter
       *
       * @method TL_renderCellTaskInfo
       * @param elCell {object}
       * @param oRecord {object}
       * @param oColumn {object}
       * @param oData {object|string}
       */
      renderCellTaskInfo: function TL_renderCellTaskInfo(elCell, oRecord, oColumn, oData)
      {
         var data = oRecord.getData();
         var taskId = data.id,
               message = $html(data.properties["bpm_description"]),
               dueDateStr = data.properties["bpm_dueDate"],
               dueDate = dueDateStr ? Alfresco.util.fromISO8601(dueDateStr) : null,
               today = new Date(),
               workflowInstance = data.workflowInstance,
               taskStartDate = data.properties["bpm_startDate"] ? Alfresco.util.fromISO8601(data.properties["bpm_startDate"]) : null,
               taskCompletionDate = data.properties["bpm_completionDate"] ? Alfresco.util.fromISO8601(data.properties["bpm_completionDate"]) : null,
               workflowStartDate = workflowInstance.startDate ? Alfresco.util.fromISO8601(workflowInstance.startDate) : null,
               type = $html(data.title),
               status = $html(data.properties["bpm_status"]),
               assignee = data.owner,
               description = $html(data.description),
               initiator = $html(workflowInstance.initiator.firstName);
               
         // if there is a property label available for the status use that instead
         if (data.propertyLabels && Alfresco.util.isValueSet(data.propertyLabels["bpm_status"], false))
         {
            status = data.propertyLabels["bpm_status"];
         }
               
         // if message is the same as the task type show the <no message> label
         if (message == type)
         {
            message = this.msg("workflow.no_message");
         }
               
         var href;
         if(oRecord.getData('isEditable'))
         {
            href = $siteURL('task-edit?taskId=' + taskId + '&referrer=tasks&myTasksLinkBack=true') + '" class="theme-color-1" title="' + this.msg("link.editTask");
         }
         else
         {
            href = $siteURL('task-details?taskId=' + taskId + '&referrer=tasks&myTasksLinkBack=true') + '" class="theme-color-1" title="' + this.msg("link.viewTask");
         }

         var info = '<h3><a href="' + href + '">' + message + '</a></h3>';
         info += '<div class="due">' + ( dueDate && !taskCompletionDate && today > dueDate ? '<span class="task-delayed"></span>': '' )
                 + '<label>' + this.msg("label.due") + ':</label><span>' 
                 + ( dueDate ? Alfresco.util.formatDate(dueDate, "longDate") : this.msg("label.none") ) + '</span></div>';
         info += '<div class="started"><label>' + this.msg("label.taskStartDate") + ':</label><span>' + (taskStartDate ? Alfresco.util.formatDate(taskStartDate, "longDate") : this.msg("label.none")) + '</span></div>';
         if (taskCompletionDate)
         {
            info += '<div class="ended"><label>' + this.msg("label.ended") + ':</label><span>' + (taskCompletionDate ? Alfresco.util.formatDate(taskCompletionDate, "longDate") : this.msg("label.none")) + '</span></div>';
         }
         /*if (!workflowInstance.isActive)
         {
            var endedDate = workflowInstance.endDate ? Alfresco.util.fromISO8601(workflowInstance.endDate) : null;
            info += '<div class=ended"><label>' + this.msg("label.ended") + ':</label><span>' + (endedDate ? Alfresco.util.formatDate(endedDate, "longDate") : this.msg("label.none")) + '</span></div>';
         }*/
         info += '<div class="status"><label>' + this.msg("label.status") + ':</label><span>' + status + '</span></div>';
         info += '<div class="started"><label>' + this.msg("label.workflowStartDate") + ':</label><span>' + (workflowStartDate ? Alfresco.util.formatDate(workflowStartDate, "longDate") : this.msg("label.none")) + '</span></div>';
         info += '<div class="type"><label>' + this.msg("label.type", type) + ':</label><span>' + type + '</span></div>';
         // info += '<div class="description"><label>' + this.msg("label.description") + ':</label><span>' + description + '</span></div>';
         info += '<div class="initiator"><label>' + this.msg("label.initiator") + ':</label><span>' + initiator + '</span></div>';
         if (!assignee || !assignee.userName)
         {
            info += '<div class="unassigned"><span class="theme-bg-color-5 theme-color-5 unassigned-task">' + this.msg("label.unassignedTask") + '</span></div>';
         }
         elCell.innerHTML = info;
      },

      /**
       * Actions custom datacell formatter
       *
       * @method TL_renderCellSelected
       * @param elCell {object}
       * @param oRecord {object}
       * @param oColumn {object}
       * @param oData {object|string}
       */
      renderCellActions: function TL_renderCellActions(elCell, oRecord, oColumn, oData)
      {
         // Create actions using WorkflowAction
         if (oRecord.getData('isEditable'))
         {
            this.createAction(elCell, this.msg("link.editTask"), "task-edit-link", $siteURL('task-edit?taskId=' + oRecord.getData('id') + '&referrer=tasks&myTasksLinkBack=true'));
         }
         this.createAction(elCell, this.msg("link.viewTask"), "task-view-link", $siteURL('task-details?taskId=' + oRecord.getData('id') + '&referrer=tasks&myTasksLinkBack=true'));
         this.createAction(elCell, this.msg("link.viewWorkflow"), "workflow-view-link", $siteURL('workflow-details?workflowId=' + oRecord.getData('workflowInstance').id + '&' + 'taskId=' + oRecord.getData('id') + '&referrer=tasks&myTasksLinkBack=true'));
      }

   }, true);
})();
