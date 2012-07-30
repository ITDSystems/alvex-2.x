/**
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
 * Dashboard MyWorkflows component.
 *
 * @namespace ITD
 * @class ITD.MyWorkflows
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
		$siteURL = Alfresco.util.siteURL;

	/**
	* Preferences
	*/
	var PREFERENCES_WORKFLOWS_DASHLET_FILTER = "org.alfresco.share.workflows.dashlet.filter";

	/**
	* Dashboard MyWorkflows constructor.
	*
	* @param {String} htmlId The HTML id of the parent element
	* @return {ITD.MyWorkflows} The new component instance
	* @constructor
	*/
	ITD.MyWorkflows = function MyWorkflows_constructor(htmlId)
	{
		ITD.MyWorkflows.superclass.constructor.call(this, "ITD.MyWorkflows", htmlId, 
			["button", "container", "datasource", "datatable", "paginator", "history", "animation"]);

		// Services
		this.services.preferences = new Alfresco.service.Preferences();

		return this;
	};

	/**
	* Extend from Alfresco.component.Base
	*/
	YAHOO.extend(ITD.MyWorkflows, Alfresco.component.Base);

	/**
	* Augment prototype with Common Workflow actions to reuse createFilterURLParameters
	*/
	YAHOO.lang.augmentProto(ITD.MyWorkflows, Alfresco.action.WorkflowActions);

	/**
	* Augment prototype with main class implementation, ensuring overwrite is enabled
	*/
	YAHOO.lang.augmentObject(ITD.MyWorkflows.prototype,
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
			* @type object
			* @default []
			*/
			hiddenWorkflowsNames: [],

			/**
			* Maximum number of tasks to display in the dashlet.
			*
			* @property maxItems
			* @type int
			* @default 50
			*/
			maxItems: 50,

			/**
			* Filter look-up: type to display value and query value
			*
			* @property filters
			* @type Object
			*/
			filters: {}
		},

		/**
		* Fired by YUI when parent element is available for scripting
		* @method onReady
		*/
		onReady: function MyWorkflows_onReady()
		{
			// Create filter menu
			this.widgets.filterMenuButton = Alfresco.util.createYUIButton(this, "filters", this.onFilterSelected,
			{
				type: "menu",
				menu: "filters-menu",
				lazyloadmenu: false
			});

			// Load preferences (after which the appropriate tasks will be displayed)
			this.services.preferences.request(PREFERENCES_WORKFLOWS_DASHLET_FILTER,
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
		onPreferencesLoaded: function MyWorkflows_onPreferencesLoaded(p_response)
		{
			// Select the preferred filter in the ui
			var filter = Alfresco.util.findValueByDotNotation(p_response.json, 
						PREFERENCES_WORKFLOWS_DASHLET_FILTER, "allActiveWorkflows");
			filter = this.options.filters.hasOwnProperty(filter) ? filter : "allActiveWorkflows";
			this.widgets.filterMenuButton.set("label", this.msg("filter." + filter));
			this.widgets.filterMenuButton.value = filter;

			// Display the toolbar now that we have selected the filter
			Dom.removeClass(Selector.query(".toolbar div", this.id, true), "hidden");

			// Prepare webscript url to task instances
			var webscript = YAHOO.lang.substitute("api/itd/workflow-instances?initiator={initiator}&exclude={exclude}",
			{
				initiator: encodeURIComponent(Alfresco.constants.USERNAME),
				exclude: this.options.hiddenWorkflowsNames.join(",")
			});

			/**
			* Create datatable with a simple pagination that only displays number of results.
			* The pagination is handled in the "base" data source url and can't be changed in the dashlet
			*/
			this.widgets.alfrescoDataTable = new Alfresco.util.DataTable(
			{
				dataSource:
				{
					url: Alfresco.constants.PROXY_URI + webscript,
					initialParameters: this.substituteParameters(this.options.filters[filter]) || ""
				},
				dataTable:
				{
					container: this.id + "-workflows",
					columnDefinitions:
					[
						{ key: "icon", sortable: false, formatter: this.bind(this.renderCellIcons), width:24 },
						{ key: "workflow", sortable: false, formatter: this.bind(this.renderCellWorkflowInfo) },
						{ key: "actions", sortable: false, formatter: this.bind(this.renderCellActions), width:45 }
					],
					config:
					{
						MSG_EMPTY: this.msg("message.noWorkflows")
					}
				},
				paginator:
				{
					history: false,
					hide: false,
					config:
					{
						containers: [this.id + "-paginator"],
						template: this.msg("pagination.template"),
						pageReportTemplate: this.msg("pagination.template.page-report"),
						rowsPerPage: this.options.maxItems
					}               
				}
			});

			// Override DataTable function to set custom empty message
			var me = this,
				dataTable = this.widgets.alfrescoDataTable.getDataTable(),
				original_doBeforeLoadData = dataTable.doBeforeLoadData;

			dataTable.doBeforeLoadData = function MyWorkflows_doBeforeLoadData(sRequest, oResponse, oPayload)
			{
				// Hide the paginator if there are fewer rows than would cause pagination
				Dom.setStyle(this.configs.paginator.getContainerNodes(), "visibility", 
							(oResponse.results.length == 0) ? "hidden" : "visible");

				if (oResponse.results.length === 0)
				{
					oResponse.results.unshift(
					{
						isInfo: true,
						title: me.msg("empty.title"),
						description: me.msg("empty.description")
					});
				}

				return original_doBeforeLoadData.apply(this, arguments);
			};
		},

		/**
		* Reloads the list with the new filter and updates the filter menu button's label
		*
		* @param p_sType {string} The event
		* @param p_aArgs {array} Event arguments
		*/
		onFilterSelected: function MyWorkflows_onFilterSelected(p_sType, p_aArgs)
		{
			var menuItem = p_aArgs[1];

			if (menuItem)
			{
				this.widgets.filterMenuButton.set("label", menuItem.cfg.getProperty("text"));
				this.widgets.filterMenuButton.value = menuItem.value;

				var parameters = this.substituteParameters(this.options.filters[menuItem.value], {});
				this.widgets.alfrescoDataTable.loadDataTable(parameters);

				// Save preferences
				this.services.preferences.set(PREFERENCES_WORKFLOWS_DASHLET_FILTER, menuItem.value);
			}
		},

		/**
		* Priority & pooled icons custom datacell formatter
		*/
		renderCellIcons: function MyWorkflows_onReady_renderCellIcons(elCell, oRecord, oColumn, oData)
		{
			var data = oRecord.getData(),
				priority = data.priority,
				priorityMap = { "1": "high", "2": "medium", "3": "low" },
				priorityKey = priorityMap[priority + ""];

			if (data.isInfo)
			{
				oColumn.width = 52;
				Dom.setStyle(elCell, "width", oColumn.width + "px");
				Dom.setStyle(elCell.parentNode, "width", oColumn.width + "px");
				elCell.innerHTML = '<img src="' + Alfresco.constants.URL_RESCONTEXT 
							+ 'components/images/help-task-bw-32.png" />';
				return;
			}

			var desc = '<img src="' + Alfresco.constants.URL_RESCONTEXT 
					+ 'components/images/priority-' + priorityKey + '-16.png" title="' 
					+ this.msg("label.priority", this.msg("priority." + priorityKey)) + '"/>';

			elCell.innerHTML = desc;
		},

		/**
		* Task info custom datacell formatter
		*/
		renderCellWorkflowInfo: function MyWorkflows_onReady_renderCellTaskInfo(elCell, oRecord, oColumn, oData)
		{
			var workflow = oRecord.getData();

			if (workflow.isInfo)
			{
				elCell.innerHTML = '<div class="empty"><h3>' + workflow.title + '</h3>' 
							+ '<span>' + workflow.description + '</span></div>';
				return;
			}

			var message = workflow.message ? workflow.message : this.msg("workflow.no_message"),
				dueDate = workflow.dueDate ? Alfresco.util.fromISO8601(workflow.dueDate) : null,
				endDate = workflow.endDate ? Alfresco.util.fromISO8601(workflow.endDate) : null,
				today = new Date(),
				startDate = workflow.startDate ? Alfresco.util.fromISO8601(workflow.startDate) : null;

			var assignee = null, 
				task = null, 
				taskStarted = null;

			for(var t in workflow.tasks)
				if(workflow.tasks[t].state === "IN_PROGRESS")
				{
					var task_visible = true;
					for(var ht in this.options.hiddenTasksTypes)
						if( workflow.tasks[t].name.match(this.options.hiddenTasksTypes[ht]) )
							task_visible = false;

					if( task_visible )
					{
						assignee = workflow.tasks[t].owner.firstName ? workflow.tasks[t].owner.firstName + ' ' : '';
						assignee += workflow.tasks[t].owner.lastName;

						task = workflow.tasks[t].title ? workflow.tasks[t].title : this.msg("workflow.no_message");

						taskStarted = workflow.tasks[t].properties.cm_created ? 
								Alfresco.util.fromISO8601(workflow.tasks[t].properties.cm_created) : null;
					}
				}

			var messageDesc = '<h3><a href="' + $siteURL('workflow-details?workflowId=' + workflow.id 
							+ '&referrer=workflows') + '" class="theme-color-1" title="' 
							+ this.msg("link.viewWorkflow") + '">' + $html(message) + '</a></h3>';

			var dateDesc = dueDate ? '<span class="' + (today > dueDate ? "workflow-delayed" : "") + '"><strong>' 
							+ this.msg("label.workflowDueDate") + '</strong> ' 
							+ Alfresco.util.formatDate(dueDate, "longDate") + '</span>' : "";

			var statusDesc = task ? '<div><strong>' + this.msg("label.currentTask") + '</strong> ' + task + '</div>' : "";

			var personDesc = assignee ? '<div><strong>' + this.msg("label.assignee") + '</strong> ' + assignee + '. ' 
							+ '<strong>' + this.msg("label.taskStarted") + '</strong> ' 
							+ Alfresco.util.formatDate(taskStarted, "longDate") + '</div>' : "";

			var info = messageDesc + dateDesc + statusDesc + personDesc;
			elCell.innerHTML = info;
		},

		/**
		* Actions custom datacell formatter
		*/
		renderCellActions:function MyWorkflows_onReady_renderCellActions(elCell, oRecord, oColumn, oData)
		{
			var data = oRecord.getData();

			if (data.isInfo)
			{
				oColumn.width = 0;
				Dom.setStyle(elCell, "width", oColumn.width + "px");
				Dom.setStyle(elCell.parentNode, "width", oColumn.width + "px");
				return;
			}

			var desc = '<a href="' + $siteURL('workflow-details?workflowId=' + data.id + '&referrer=workflows') 
						+ '" class="view-workflow" title="' + this.msg("link.viewWorkflow") + '">&nbsp;</a>';

			elCell.innerHTML = desc;
		}
	});
})();
