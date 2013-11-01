/**
 * Copyright (C) 2005-2010 Alfresco Software Limited.
 * Copyright (C) 2013 ITD Systems LLC.
 *
 * This file is part of Alvex
 *
 * Alvex is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Alvex is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Alvex. If not, see <http://www.gnu.org/licenses/>.
 */

if (typeof Alvex == "undefined" || !Alvex)
{
	var Alvex = {};
}

/**
 * TaskList component.
 *
 * @namespace Alvex
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
	var PREFERENCES_MY_TASKS_COLUMNS = PREFERENCES_MY_TASKS + ".columns";
	var PREFERENCES_MY_TASKS_STYLE = PREFERENCES_MY_TASKS + ".style";

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
		YAHOO.Bubbling.on("taskListPrefsUpdated", this.loadPreferences, this);
		YAHOO.Bubbling.on("taskListTableReload", this.onTableReload, this);

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
			maxItems: 50,
			/*
			 * Columns to show in table view
			 */
			
			style: "alvex",
			
			columns: [],
			
			projectWorkflows: [],
			
			taskProps: [
				{ prop: "bpm_priority", width: 50, formatter: 'renderPriorityCell' }, 
				{ prop: "bpm_status", width: 100, formatter: 'renderTextCell' }, 
				{ prop: "bpm_dueDate", width: 100, formatter: 'renderDateCell' }, 
				{ prop: "bpm_startDate", width: 100, formatter: 'renderDateCell' }, 
				{ prop: "bpm_completionDate", width: 100, formatter: 'renderDateCell' }, 
				{ prop: "bpm_description", width: 0, formatter: 'renderTitleCell' }, 
				{ prop: "alvexrwf_relatedWorkflows", width: -1, formatter: 'renderTextCell' }, 
				{ prop: "itdrwf_relatedWorkflows", width: -1, formatter: 'renderTextCell' } 
			],
			
			// TODO - should we have 'created' separately for task and workflow?
			extProps: [
				{ prop: "state", width: 50, formatter: 'renderStateCell' },
				{ prop: "initiator", width: 100, formatter: 'renderInitiatorCell' },
				{ prop: "owner", width: 100, formatter: 'renderOwnerCell' },
				{ prop: "taskType", width: 100, formatter: 'renderTaskTypeCell' },
				{ prop: "wflType", width: 100, formatter: 'renderWflTypeCell' },
				{ prop: "icons", width: 100, formatter: 'renderIconsCell' }
			]
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
			
			var me = this;
			if( Alfresco.constants.SITE === "" )
			{
				this.loadPreferences();
			}
			else
			{
				var webscript = Alfresco.constants.PROXY_URI + 
						YAHOO.lang.substitute("api/alvex/project/{projectId}/workflows?exclude={exclude}",
				{
					projectId: encodeURIComponent(Alfresco.constants.SITE),
					exclude: this.options.hiddenWorkflowsNames.join(",")
				});
				Alfresco.util.Ajax.jsonRequest({
					url: webscript,
					method: Alfresco.util.Ajax.GET,
					successCallback:
					{
						fn: function(resp)
						{
							me.options.projectWorkflows = resp.json.data;
							me.loadPreferences();
						},
						scope:this
					},
					failureCallback:
					{
						fn: function (resp)
						{
							if (resp.serverResponse.statusText)
								Alfresco.util.PopupManager.displayMessage({ text: resp.serverResponse.statusText });
						},
						scope:this
					}
				});
			}
		},
		
		loadPreferences: function ()
		{
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

			this.options.style = Alfresco.util.findValueByDotNotation(p_response.json, PREFERENCES_MY_TASKS_STYLE, "alvex");
			var columns = Alfresco.util.findValueByDotNotation(p_response.json, PREFERENCES_MY_TASKS_COLUMNS, 
									"1$bpm_priority,2$bpm_description,3$bpm_startDate,4$bpm_dueDate").split(',');
			
			this.options.columns = [];
			for(var c in columns)
			{
				var col = columns[c].split('$');
				this.options.columns.push(col[1]);
			}
			
			var availableColumns = [];
			for(var p in this.options.taskProps)
				if( this.options.taskProps[p].width >= 0 )
					availableColumns.push(
						{
							id: this.options.taskProps[p].prop, 
							label: this.msg(this.msg("column.title." + this.options.taskProps[p].prop)) 
						}
					);
			for(var p in this.options.extProps)
				if( this.options.extProps[p].width >= 0 )
					availableColumns.push(
						{
							id: this.options.extProps[p].prop, 
							label: this.msg(this.msg("column.title." + this.options.extProps[p].prop)) 
						}
					);
			
			YAHOO.Bubbling.fire("taskListPreferencesLoaded",
			{
				availableColumns: availableColumns,
				currentColumns: this.options.columns
			});
			
			this.initUI();
		},

		initUI: function()
		{
			if (this.options.style === "alfresco")
				this.initAlfrescoUI();
			else
				this.initAlvexUI();
		},
				
		initAlvexUI: function()
		{
			// Display the toolbar now that we have selected the filter
			// Dom.removeClass(Selector.query(".task-list div", this.id, true), "hidden");

			var props = [];
			for( var p in this.options.taskProps )
				props.push(this.options.taskProps[p]);
			for( var p in this.options.extProps )
				props.push(this.options.extProps[p]);

			var columns = this.options.columns;
			columns.push('actions');

			var colDefs = [];
			for (var c in columns)
			{
				var column = columns[c];
				for (var p in props)
				{
					if ( column === props[p].prop && props[p].width >= 0 )
					{
						var cDef = { 
							key: column, 
							label: this.msg("column.title." + column),
							sortable: true, 
							resizable: true, 
							formatter: this.bind(this[ props[p].formatter ])
						};
						if ( props[p].width > 0 )
							cDef.width = props[p].width;
						colDefs.push(cDef);
					}
				}
			}

			colDefs.push( {
				key: "actions", 
				label: this.msg("column.title.actions"),
				sortable: false, 
				formatter: this.bind(this.renderShortActionsCell), 
				width: 200
			});

			this.widgets.pagingDataTable = new Alfresco.util.DataTable(
			{
				dataTable:
				{
					container: this.id + "-tasks",
					columnDefinitions: colDefs,
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
			
			var me = this;
			var dataTable = this.widgets.pagingDataTable.getDataTable();
			var original_doBeforeLoadData = dataTable.doBeforeLoadData;
			
			dataTable.doBeforeLoadData = function(sRequest, oResponse, oPayload)
			{
				// Hide the paginator if there are fewer rows than would cause pagination
				//Dom.setStyle(this.configs.paginator.getContainerNodes(), "visibility", 
				//			(oResponse.results.length == 0) ? "hidden" : "visible");

				//if (oResponse.results.length === 0)
				//{
				//	oResponse.results.unshift(
				//	{
				//		isInfo: true,
				//		title: me.msg("empty.title"),
				//		description: me.msg("empty.description")
				//	});
				//}
				
				if(Alfresco.constants.SITE !== "")
				{
					var resp = [];
					for(var i = 0; i < oResponse.results.length; i++)
					{
						var our = false;
						for(var j = 0; j < me.options.projectWorkflows.length; j++)
						{
							if( oResponse.results[i].workflowInstance.id 
									=== me.options.projectWorkflows[j].workflow.id )
							{
								our = true
							}
						}
						if(our)
							resp.push(oResponse.results[i]);
					}
					oResponse.results = resp;
				}
				
				return original_doBeforeLoadData.apply(this, arguments);
			};

		},
		
		renderTextCell: function(elCell, oRecord, oColumn, oData)
		{
			var record = oRecord.getData();
			elCell.innerHTML = record.properties[oColumn.key];
		},
				
		renderDateCell: function(elCell, oRecord, oColumn, oData)
		{
			var record = oRecord.getData();
			var date = Alfresco.util.fromISO8601(record.properties[oColumn.key]);
			elCell.innerHTML = ( date !== null ?
							Alfresco.util.formatDate(date, "mediumDate") : this.msg("label.noDate") );
		},
		
		renderStateCell: function(elCell, oRecord, oColumn, oData)
		{
			var record = oRecord.getData();
			var msgId, cssClass;
			if( !record.workflowInstance.isActive ) {
				msgId = "label.completedWorkflow";
				cssClass = "completed";
			} else {
				if( record.state === "IN_PROGRESS" ) {
					msgId = "label.activeTask";
					cssClass = "todo";
				} else {
					msgId = "label.completedTaskActiveWorkflow";
					cssClass = "pending";
				}
			}
			elCell.innerHTML = '<span class="' + cssClass + '" title="' + this.msg( msgId ) + '">&nbsp;</span>';
		},
		
		renderInitiatorCell: function(elCell, oRecord, oColumn, oData)
		{
			elCell.innerHTML = this.getPersonHTML( oRecord.getData().workflowInstance.initiator );
		},
		
		renderOwnerCell: function(elCell, oRecord, oColumn, oData)
		{
			elCell.innerHTML = this.getPersonHTML( oRecord.getData().owner );
		},
		
		getPersonHTML: function(person)
		{
			return '<span class="person">' 
					+ '<a href="' + Alfresco.constants.URL_PAGECONTEXT + 'user/' + person.userName + '/profile">' 
					+ person.firstName + ' ' + person.lastName
					+ '</a></span>';
		},
		
		renderTaskTypeCell: function(elCell, oRecord, oColumn, oData)
		{
			var record = oRecord.getData();
			elCell.innerHTML = record.title;
		},
		
		renderWflTypeCell: function(elCell, oRecord, oColumn, oData)
		{
			var record = oRecord.getData();
			elCell.innerHTML = record.workflowInstance.title;
		},
		
		renderIconsCell: function(elCell, oRecord, oColumn, oData)
		{
			
		},
		
		renderPriorityCell: function(elCell, oRecord, oColumn, oData)
		{
			var priority = oRecord.getData("properties")["bpm_priority"],
					priorityMap = {"1": "high", "2": "medium", "3": "low"},
					priorityKey = priorityMap[priority + ""];
			var desc = '<div class="cell-centered cell-spaced">' 
					+ '<img src="' + Alfresco.constants.URL_RESCONTEXT 
					+ 'components/images/priority-' + priorityKey + '-16.png" ' + 'title="' 
					+ this.msg("label.priority", this.msg("priority." + priorityKey)) + '"/></div>';
			elCell.innerHTML = desc;
		},

		renderTitleCell: function(elCell, oRecord, oColumn, oData)
		{
			var data = oRecord.getData();
			var taskId = data.id,
					message = $html(data.properties["bpm_description"]),
					type = $html(data.title);

			if (message === type)
				message = this.msg("workflow.no_message");

			var href;
			if (oRecord.getData('isEditable'))
				href = $siteURL('task-edit?taskId=' + taskId + '&referrer=tasks&myTasksLinkBack=true') + '" class="theme-color-1" title="' + this.msg("link.editTask");
			else
				href = $siteURL('task-details?taskId=' + taskId + '&referrer=tasks&myTasksLinkBack=true') + '" class="theme-color-1" title="' + this.msg("link.viewTask");

			var info = '<h3><a href="' + href + '">' + message + '</a></h3>';
			elCell.innerHTML = info;
		},

		renderShortActionsCell: function(elCell, oRecord, oColumn, oData)
		{
			// Create actions using WorkflowAction
			if (oRecord.getData('isEditable'))
			{
				this.createAction(elCell, this.msg("link.editTask"), "task-edit-link", $siteURL('task-edit?taskId=' + oRecord.getData('id') + '&referrer=tasks&myTasksLinkBack=true'));
			}
		},
				
		initAlfrescoUI: function()
		{
			// Display the toolbar now that we have selected the filter
			Dom.removeClass(Selector.query(".task-list div", this.id, true), "hidden");

			this.widgets.pagingDataTable = new Alfresco.util.DataTable(
			{
				dataTable:
				{
					container: this.id + "-tasks",
					columnDefinitions:
					[
						{key: "id", sortable: false, formatter: this.bind(this.renderCellIcons), width: 40},
						{key: "title", sortable: false, formatter: this.bind(this.renderCellTaskInfo)},
						{key: "name", sortable: false, formatter: this.bind(this.renderCellActions), width: 200}
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
			var props = [];
			for( var p in this.options.taskProps )
				props.push(this.options.taskProps[p].prop);
			// Prepare webscript url to task instances
			var webscript = YAHOO.lang.substitute(
				"api/alvex/task-instances?authority={authority}&properties={prop}&exclude={exclude}",
				{
					authority: encodeURIComponent(Alfresco.constants.USERNAME),
					prop: props.join(","),
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
		
		onTableReload: function()
		{
			var me = this;
			var webscript = Alfresco.constants.PROXY_URI + 
						YAHOO.lang.substitute("api/alvex/project/{projectId}/workflows?exclude={exclude}",
			{
				projectId: encodeURIComponent(Alfresco.constants.SITE),
				exclude: this.options.hiddenWorkflowsNames.join(",")
			});
			Alfresco.util.Ajax.jsonRequest({
				url: webscript,
				method: Alfresco.util.Ajax.GET,
				successCallback:
				{
					fn: function(resp)
					{
						me.options.projectWorkflows = resp.json.data;
						this.widgets.pagingDataTable.loadDataTable(/*this.getReqParameters()*/);
					},
					scope:this
				},
				failureCallback:
				{
					fn: function (resp)
					{
						if (resp.serverResponse.statusText)
							Alfresco.util.PopupManager.displayMessage({ text: resp.serverResponse.statusText });
					},
					scope:this
				}
			});
		},
		
		onDetachWorkflow: function(obj)
		{
			return;
			var me = this;
			var workflow = obj.workflow;
			Alfresco.util.PopupManager.displayPrompt(
			{
				title: me.msg("title.detachWorkflowFromProject"),
				text: me.msg("message.detachWorkflowFromProject",  Alfresco.util.encodeHTML(workflow.description)),
				noEscape: true,
				buttons: [
				{
					text: me.msg("button.detachWorkflowFromProject"),
					handler: function()
					{
						var req = {};
									
						// Delete org chart role
						Alfresco.util.Ajax.jsonRequest({
							url: Alfresco.constants.PROXY_URI 
										+ "api/alvex/project/" + encodeURIComponent(obj['project'].shortName) 
										+ "/workflow/" + encodeURIComponent(workflow.id) + "?alf_method=DELETE",
							method: Alfresco.util.Ajax.POST,
							dataObj: req,
							successCallback:
							{
								fn: function (resp)
								{
									this.destroy();
									if (resp.serverResponse.statusText)
									{
										Alfresco.util.PopupManager.displayMessage({ text: resp.serverResponse.statusText });
									}
									me.widgets.alfrescoDataTable.loadDataTable();
								},
								scope:this
							},
							failureCallback:
							{
								fn: function (resp)
								{
									this.destroy();
									if (resp.serverResponse.statusText)
									{
										Alfresco.util.PopupManager.displayMessage({ text: resp.serverResponse.statusText });
									}
									me.widgets.alfrescoDataTable.loadDataTable();
								},
								scope:this
							}
						});
					}
				},
				{
					text: me.msg("button.cancel"),
					handler: function()
					{
						this.destroy();
					},
					isDefault: true
				}]
			});
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
					priorityMap = {"1": "high", "2": "medium", "3": "low"},
			priorityKey = priorityMap[priority + ""],
					pooledTask = oRecord.getData("isPooled");
			var desc = '<img src="' + Alfresco.constants.URL_RESCONTEXT + 'components/images/priority-' + priorityKey + '-16.png" title="' + this.msg("label.priority", this.msg("priority." + priorityKey)) + '"/>';
			if (pooledTask)
			{
				desc += '<br/><img src="' + Alfresco.constants.URL_RESCONTEXT + 'components/images/pooled-task-16.png" title="' + this.msg("label.pooledTask") + '"/>';
			}

			if (oRecord.getData("properties")["alvexrwf_relatedWorkflows"] || oRecord.getData("properties")["itdrwf_relatedWorkflows"])
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
					initiator = '', initiatorUserName = '';

			if (workflowInstance.initiator)
			{
				initiator = $html(workflowInstance.initiator.firstName + ' ' + workflowInstance.initiator.lastName);
				initiatorUserName = workflowInstance.initiator.userName;
			} else {
				initiator = this.msg("label.unknownUser");
				initiatorUserName = '';
			}

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
			if (oRecord.getData('isEditable'))
			{
				href = $siteURL('task-edit?taskId=' + taskId + '&referrer=tasks&myTasksLinkBack=true') + '" class="theme-color-1" title="' + this.msg("link.editTask");
			}
			else
			{
				href = $siteURL('task-details?taskId=' + taskId + '&referrer=tasks&myTasksLinkBack=true') + '" class="theme-color-1" title="' + this.msg("link.viewTask");
			}

			var info = '<h3><a href="' + href + '">' + message + '</a></h3>';
			info += '<div class="due">' + (dueDate && !taskCompletionDate && today > dueDate ? '<span class="task-delayed"></span>' : '')
					+ '<label>' + this.msg("label.due") + ':</label><span>'
					+ (dueDate ? Alfresco.util.formatDate(dueDate, "longDate") : this.msg("label.none")) + '</span></div>';
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
			info += '<div class="initiator"><label>' + this.msg("label.initiator") + ':</label><span>'
					+ '<a href="' + Alfresco.constants.URL_PAGECONTEXT + 'user/' + initiatorUserName + '/profile">' + initiator
					+ '</a></span></div>';
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

	}, true
	);
})();
