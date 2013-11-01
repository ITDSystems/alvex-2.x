/**
 * Copyright © 2013 ITD Systems
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
 * Project Workflows component.
 *
 * @namespace Alvex
 * @class Alvex.ProjectWorkflows
 */
(function()
{
	/**
	* YUI Library aliases
	*/
	var Dom = YAHOO.util.Dom,
		Event = YAHOO.util.Event,
		Selector = YAHOO.util.Selector,
		KeyListener = YAHOO.util.KeyListener;

	/**
	* Alfresco Slingshot aliases
	*/
	var $html = Alfresco.util.encodeHTML,
		$siteURL = Alfresco.util.siteURL;

	/**
	* Preferences
	*/
	var PREFERENCES_WORKFLOWS_DASHLET = "org.alfresco.share.projectworkflows.dashlet";
	var PREFERENCES_WORKFLOWS_DASHLET_FILTER = PREFERENCES_WORKFLOWS_DASHLET + ".filter";
	var PREFERENCES_WORKFLOWS_DASHLET_SORTER = PREFERENCES_WORKFLOWS_DASHLET + ".sorter";

	/**
	* Dashboard ProjectWorkflows constructor.
	*
	* @param {String} htmlId The HTML id of the parent element
	* @return {Alvex.ProjectWorkflows} The new component instance
	* @constructor
	*/
	Alvex.ProjectWorkflows = function ProjectWorkflows_constructor(htmlId)
	{
		Alvex.ProjectWorkflows.superclass.constructor.call(this, "Alvex.ProjectWorkflows", htmlId, 
			["button", "container", "datasource", "datatable", "paginator", "history", "animation"]);

		// Services
		this.services.preferences = new Alfresco.service.Preferences();

		return this;
	};

	/**
	* Extend from Alfresco.component.Base
	*/
	YAHOO.extend(Alvex.ProjectWorkflows, Alfresco.component.Base);

	/**
	* Augment prototype with Common Workflow actions to reuse createFilterURLParameters
	*/
	YAHOO.lang.augmentProto(Alvex.ProjectWorkflows, Alfresco.action.WorkflowActions);

	/**
	* Augment prototype with main class implementation, ensuring overwrite is enabled
	*/
	YAHOO.lang.augmentObject(Alvex.ProjectWorkflows.prototype,
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
			filters: {},
		},

		/**
		* Fired by YUI when parent element is available for scripting
		* @method onReady
		*/
		onReady: function ProjectWorkflows_onReady()
		{
			var me = this;
			
			// Create filter menu
			this.widgets.filterMenuButton = Alfresco.util.createYUIButton(this, "filters", this.onFilterSelected,
			{
				type: "menu",
				menu: "filters-menu",
				lazyloadmenu: false
			});

			// Create sorter menu
			this.widgets.sorterMenuButton = Alfresco.util.createYUIButton(this, "sorters", this.onSorterSelected,
			{
				type: "menu",
				menu: "sorters-menu",
				lazyloadmenu: false
			});
			
			// Start workflow menu
			var urlDefs = YAHOO.lang.substitute(
				"{proxy}api/alvex/list-definitions?filter={filter}",
				{
					proxy: Alfresco.constants.PROXY_URI,
					filter: ''
				}
				);

			var urlAllowed = YAHOO.lang.substitute(
				"{proxy}api/alvex/workflow-shortcut/allowed-workflows",
				{
					proxy: Alfresco.constants.PROXY_URI
				}
				);

			Alvex.util.processAjaxQueue({
				queue: [
					{
						url: urlAllowed,
						responseContentType: Alfresco.util.Ajax.JSON,
						successCallback: {
							fn: function(response)
							{
								this.options.allowedWorkflows = response.json.workflows;
							},
							scope: this
						}
					},
					{
						url: urlDefs,
						responseContentType: Alfresco.util.Ajax.JSON,
						successCallback: {
							fn: function(response)
							{
								var menuEl = Dom.get(me.id + '-start-workflow-menu');
								for (var key in response.json.data)  {
									var task = response.json.data[key];
									for (var i in this.options.allowedWorkflows)
										if(this.options.allowedWorkflows[i].name === task.name)
											menuEl.options.add(new Option(task.title, task.name));
								}
								me.widgets.startWorkflowButton = new YAHOO.widget.Button(
									this.id + "-start-workflow",
									{
										type: "menu",
										menu: me.id + '-start-workflow-menu'
									} );
								me.widgets.startWorkflowButton.getMenu().subscribe("click", me.onStartWorkflowDialog, null, me)
							},
							scope: this
						}						
					}
				]
			});
			
			// Listener for add workflow buttons
			me.widgets.attachWorkflowButton = new YAHOO.widget.Button(this.id + "-attach-workflow",
													{ onclick: { fn: this.onAttachWorkflowDialog, obj: null, scope: this } });
			// Dialog for workflow attach
			var dialogId = this.id + "-attach-workflow-dialog";
			
			// Setup search button
			this.widgets.searchButton = new YAHOO.widget.Button(dialogId + "-search-ok");
			this.widgets.searchButton.on("click", this.onSearch, this.widgets.searchButton, this);

			// Register the "enter" event on the search text field
			var zinput = Dom.get(dialogId + "-search");
			new YAHOO.util.KeyListener(zinput,
			{
				keys: 13
			},
			{
			fn: me.onSearch,
				scope: this,
				correctScope: true
			}, "keydown").enable();

			this.widgets.attachWorkflowDialog = Alfresco.util.createYUIPanel(dialogId, { width: "540px" });
			this.widgets.attachWorkflowDialog.hideEvent.subscribe(this.onAttachCancel, null, this);

			var me = this;
			
			// Hook action events
			var fnActionHandler = function fnActionHandler(layer, args)
			{
				var owner = YAHOO.Bubbling.getOwnerByTagName(args[1].anchor, "div");
				if (owner !== null)
				{
					if (typeof me[owner.className] == "function")
					{
						args[1].stop = true;
						var asset = me.widgets.workflowsDataTable.getRecord(args[1].target.offsetParent).getData();
						me[owner.className].call(me, asset, owner);
					}
				}
				return true;
			};
			YAHOO.Bubbling.addDefaultAction(this.id + "-attach-workflow-action-link", fnActionHandler, true);

			var myColumnDefs = [
				{key:'id', sortable:false, width:32, formatter: this.formatWorkflowAttachIconField},
				{key:'description', sortable:false, width: 310, formatter: this.formatWorkflowAttachNameField},
				{key:'action', sortable:false, width:45, formatter: this.formatWorkflowAttachActionsField}
			];

			this.options.workflowsDataStore = [];
			this.widgets.workflowsDataSource = new YAHOO.util.DataSource(me.options.workflowsDataStore);
			this.widgets.workflowsDataSource.responseType = YAHOO.util.DataSource.TYPE_JSARRAY;
			this.widgets.workflowsDataSource.responseSchema = {
				fields: ["id", "message", "action"]
			};
			
			this.widgets.workflowsDataSource.doBeforeParseData = function (oRequest, oFullResponse)
			{
				var response = [];
				for( var i in me.options.workflowsDataStore )
				{
					me.options.workflowsDataStore[i].action = '';
					response.push(me.options.workflowsDataStore[i]);
				}		
				return response;
			};
			
			this.widgets.workflowsDataTable = new YAHOO.widget.DataTable(dialogId + "-options-table",
				myColumnDefs, this.widgets.workflowsDataSource,
			{
				MSG_EMPTY: this.msg("message.noWorkflows"),
				renderLoopSize: 100
			} );
			
			this.widgets.workflowsDataTable.parent = me;
			//this.widgets.workflowsDataTable.subscribe("rowMouseoverEvent", this.onWorkflowHighlightRow, this, true);
			//this.widgets.workflowsDataTable.subscribe("rowMouseoutEvent", this.onWorkflowUnhighlightRow, this, true);

			// Load preferences (after which the appropriate tasks will be displayed)
			this.services.preferences.request(PREFERENCES_WORKFLOWS_DASHLET,
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
		onPreferencesLoaded: function ProjectWorkflows_onPreferencesLoaded(p_response)
		{
			// Select the preferred filter in the ui
			var filter = Alfresco.util.findValueByDotNotation(p_response.json, 
						PREFERENCES_WORKFLOWS_DASHLET_FILTER, "allActiveWorkflows");
			filter = this.options.filters.hasOwnProperty(filter) ? filter : "allActiveWorkflows";
			this.widgets.filterMenuButton.set("label", this.msg("filter." + filter));
			this.widgets.filterMenuButton.value = filter;

			// Select the preferred sorter in the ui
			var sorter = Alfresco.util.findValueByDotNotation(p_response.json, 
						PREFERENCES_WORKFLOWS_DASHLET_SORTER, "byDueDate");
			sorter = this.options.sorters.hasOwnProperty(sorter) ? sorter : "byDueDate";
			this.widgets.sorterMenuButton.set("label", this.msg("sorter." + sorter));
			this.widgets.sorterMenuButton.value = sorter;

			// Display the toolbar now that we have selected the filter
			Dom.removeClass(Selector.query(".toolbar div", this.id, true), "hidden");

			// Hook action events
			var me = this;
			var fnActionHandler = function fnActionHandler(layer, args)
			{
				var owner = YAHOO.Bubbling.getOwnerByTagName(args[1].anchor, "div");
				if (owner !== null)
				{
					if (typeof me[owner.className] == "function")
					{
						args[1].stop = true;
						var asset = me.widgets.alfrescoDataTable.getDataTable().getRecord(args[1].target.offsetParent).getData();
						me[owner.className].call(me, asset, owner);
					}
				}
				return true;
			};
			YAHOO.Bubbling.addDefaultAction(this.id + "-action-link", fnActionHandler, true);

			/**
			* Create datatable with a simple pagination that only displays number of results.
			* The pagination is handled in the "base" data source url and can't be changed in the dashlet
			*/
			this.widgets.alfrescoDataTable = new Alfresco.util.DataTable(
			{
				dataSource:
				{
					url: this.getDataSourceURL(),
					doBeforeParseData: this.sortWorkflows,
					initialParameters: ''
				},
				dataTable:
				{
					container: this.id + "-workflows",
					columnDefinitions:
					[
						{ key: "icon", sortable: false, formatter: this.bind(this.renderCellIcons), width:24 },
						{ key: "workflow", sortable: false, formatter: this.bind(this.renderCellWorkflowInfo) },
						{ key: "actions", sortable: false, formatter: this.bind(this.renderCellActions), width:90 }
					],
					config:
					{
						MSG_EMPTY: this.msg("message.noWorkflows")
					}
				},
				paginator:
				{
					history: false,
					// hide: false,
					config:
					{
						containers: [this.id + "-paginator"],
						// template: this.msg("pagination.template"),
						// pageReportTemplate: this.msg("pagination.template.page-report"),
						rowsPerPage: this.options.maxItems
					}               
				}
			});

			// Override DataTable function to set custom empty message
			var me = this,
				dataTable = this.widgets.alfrescoDataTable.getDataTable(),
				original_doBeforeLoadData = dataTable.doBeforeLoadData;

			dataTable.doBeforeLoadData = function ProjectWorkflows_doBeforeLoadData(sRequest, oResponse, oPayload)
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

		sortWorkflows: function (oRequest, oFullResponse)
		{
			return oFullResponse;
		},

		/**
		* Reloads the list with the new filter and updates the filter menu button's label
		*
		* @param p_sType {string} The event
		* @param p_aArgs {array} Event arguments
		*/
		onFilterSelected: function ProjectWorkflows_onFilterSelected(p_sType, p_aArgs)
		{
			var menuItem = p_aArgs[1];

			if (menuItem)
			{
				this.widgets.filterMenuButton.set("label", menuItem.cfg.getProperty("text"));
				this.widgets.filterMenuButton.value = menuItem.value;

				this.widgets.alfrescoDataTable.widgets.dataSource.liveData = this.getDataSourceURL();
				this.widgets.alfrescoDataTable.loadDataTable();

				// Save preferences
				this.services.preferences.set(PREFERENCES_WORKFLOWS_DASHLET_FILTER, menuItem.value);
			}
		},
		
		/**
		* Resorts the list with the new sorter and updates the sorter menu button's label
		*
		* @param p_sType {string} The event
		* @param p_aArgs {array} Event arguments
		*/
		onSorterSelected: function ProjectWorkflows_onSorterSelected(p_sType, p_aArgs)
		{
			var menuItem = p_aArgs[1];

			if (menuItem)
			{
				this.widgets.sorterMenuButton.set("label", menuItem.cfg.getProperty("text"));
				this.widgets.sorterMenuButton.value = menuItem.value;
			
				this.widgets.alfrescoDataTable.widgets.dataSource.liveData = this.getDataSourceURL();
				this.widgets.alfrescoDataTable.loadDataTable();
				
				// Save preferences
				this.services.preferences.set(PREFERENCES_WORKFLOWS_DASHLET_SORTER, menuItem.value);
			}
		},
		
		getReqParameters: function()
		{
			var parameters = this.substituteParameters(this.options.filters[this.widgets.filterMenuButton.value], {});
			parameters += ( parameters == '' ? '' : '&' );
			parameters += this.options.sorters[this.widgets.sorterMenuButton.value];
			return parameters;
		},
		
		getDataSourceURL: function()
		{
			// Prepare webscript url to task instances
			var webscript = YAHOO.lang.substitute("api/alvex/project/{projectId}/workflows?exclude={exclude}",
			{
				projectId: encodeURIComponent(Alfresco.constants.SITE),
				exclude: this.options.hiddenWorkflowsNames.join(",")
			});
			return Alfresco.constants.PROXY_URI + webscript + '&' + this.getReqParameters();
		},
		
		formatWorkflowAttachIconField: function(elCell, oRecord, oColumn, oData)
		{
			var desc = '<img src="' + Alfresco.constants.URL_RESCONTEXT 
					+ 'components/images/priority-medium-16.png"/>';
			elCell.innerHTML = desc;
		},
		
		formatWorkflowAttachNameField: function(elCell, oRecord, oColumn, oData)
		{
			var workflow = oRecord.getData();
			var desc = '<h3><a href="' + Alfresco.constants.URL_PAGECONTEXT 
				+ 'workflow-details?workflowId=' + workflow.id 
				+ '&referrer=workflows' + '" class="theme-color-1" title="' 
				+ this.parent.msg("link.viewWorkflow") + '">' + $html(workflow.message) + '</a></h3>';
			elCell.innerHTML = desc;
		},
		
		formatWorkflowAttachActionsField: function(elCell, oRecord, oColumn, oData)
		{
			var workflow = oRecord.getData();
			var desc = '<div class="action">';
			
			var msg = this.parent.msg('action.attachWorkflow');
			var clb = 'onAttachWorkflow';
			
			desc += '<div class="' + clb + '"><a href="" ' + 'class="alvex-project-workflow-action ' 
					+ this.parent.id + '-attach-workflow-action-link" ' 
					+ 'title="' + msg +'"><span>' + msg + '</span></a></div>';
			desc += '</div>';

			elCell.innerHTML = desc;
		},
		
		/**
		* Priority & pooled icons custom datacell formatter
		*/
		renderCellIcons: function ProjectWorkflows_onReady_renderCellIcons(elCell, oRecord, oColumn, oData)
		{
			var data = oRecord.getData();

			if (data.isInfo)
			{
				oColumn.width = 52;
				Dom.setStyle(elCell, "width", oColumn.width + "px");
				Dom.setStyle(elCell.parentNode, "width", oColumn.width + "px");
				elCell.innerHTML = '<img src="' + Alfresco.constants.URL_RESCONTEXT + 'components/images/help-task-bw-32.png" />';
				return;
			}

			data = data.workflow;
			var priority = 2;//data.priority,
				priorityMap = { "1": "high", "2": "medium", "3": "low" },
				priorityKey = priorityMap[priority + ""];

			var desc = '<img src="' + Alfresco.constants.URL_RESCONTEXT 
					+ 'components/images/priority-' + priorityKey + '-16.png" title="' 
					+ this.msg("label.priority", this.msg("priority." + priorityKey)) + '"/>';

			elCell.innerHTML = desc;
		},

		/**
		* Task info custom datacell formatter
		*/
		renderCellWorkflowInfo: function ProjectWorkflows_onReady_renderCellTaskInfo(elCell, oRecord, oColumn, oData)
		{
			var workflow = oRecord.getData();

			if (workflow.isInfo)
			{
				elCell.innerHTML = '<div class="empty"><h3>' + workflow.title + '</h3>' 
							+ '<span>' + workflow.description + '</span></div>';
				return;
			}

			workflow = workflow.workflow;
			var info = '<h3><a href="' + Alfresco.constants.URL_PAGECONTEXT 
				+ 'workflow-details?workflowId=' + workflow.id 
				+ '&referrer=workflows' + '" class="theme-color-1" title="' 
				+ this.msg("link.viewWorkflow") + '">' + $html(workflow.description) + '</a></h3>';

			/*var message = workflow.message ? workflow.message : this.msg("workflow.no_message"),
				dueDate = workflow.dueDate ? Alfresco.util.fromISO8601(workflow.dueDate) : null,
				endDate = workflow.endDate ? Alfresco.util.fromISO8601(workflow.endDate) : null,
				today = new Date(),
				startDate = workflow.startDate ? Alfresco.util.fromISO8601(workflow.startDate) : null;

			var assignee = null, 
				task = null, 
				taskStarted = null;
			
			var messageDesc = '<h3><a href="' + Alfresco.constants.URL_PAGECONTEXT + 'workflow-details?workflowId=' + workflow.id 
				+ '&referrer=workflows' + '" class="theme-color-1" title="' 
				+ this.msg("link.viewWorkflow") + '">' + $html(message) + '</a></h3>';
			
			var dateDesc = dueDate ? '<div class="' + (today > dueDate ? "workflow-delayed" : "") + '"><strong>' 
				+ this.msg("label.workflowDueDate") + '</strong> ' 
				+ Alfresco.util.formatDate(dueDate, "longDate") + '</div>' : "";

			dateDesc += startDate ? '<div><strong>' + this.msg("label.workflowStartDate") + '</strong> '
				+ Alfresco.util.formatDate(startDate, "longDate") + '</div>' : "";
			
			info = messageDesc + dateDesc;

			for(var t in workflow.tasks)
				if(workflow.tasks[t].state === "IN_PROGRESS")
				{
					var task_visible = true;
					for(var ht in this.options.hiddenTasksTypes)
						if( workflow.tasks[t].name.match(this.options.hiddenTasksTypes[ht]) )
							task_visible = false;

					if( task_visible )
					{
						var assignee, ownerUserName;
						if( workflow.tasks[t].owner != null )
						{
							assignee = workflow.tasks[t].owner.firstName ? workflow.tasks[t].owner.firstName + ' ' : '';
							assignee += workflow.tasks[t].owner.lastName;
							ownerUserName = workflow.tasks[t].owner.userName;
						} else {
							assignee = this.msg("task.not_assigned.pooled");
							ownerUserName = '';
						}

						task = workflow.tasks[t].title ? workflow.tasks[t].title : this.msg("workflow.no_message");

						taskStarted = workflow.tasks[t].created ? 
								Alfresco.util.fromISO8601(workflow.tasks[t].created) : null;

						var statusDesc = task ? '<div><strong>' + this.msg("label.currentTask") + '</strong> ' + task + '</div>' : "";

						statusDesc += '<div>' + assignee ? '<strong>' + this.msg("label.assignee") + '</strong> ' 
							+ '<a href="' + Alfresco.constants.URL_PAGECONTEXT + 'user/' 
							+ ownerUserName + '/profile">' + $html(assignee) + '</a> ' : "" ;
						
						if( taskStarted != null )
							statusDesc += '<strong>' + this.msg("label.taskStarted") + '</strong> ' 
								+ Alfresco.util.formatDate(taskStarted, "longDate") + '</div>';

						info += statusDesc;
					}
				}*/

			elCell.innerHTML = info;
		},

		/**
		* Actions custom datacell formatter
		*/
		renderCellActions:function ProjectWorkflows_onReady_renderCellActions(elCell, oRecord, oColumn, oData)
		{
			var data = oRecord.getData();

			if (data.isInfo)
			{
				oColumn.width = 0;
				Dom.setStyle(elCell, "width", oColumn.width + "px");
				Dom.setStyle(elCell.parentNode, "width", oColumn.width + "px");
				return;
			}
			
			data = data.workflow;
			var desc = '<div class="action">';
			desc += '<div><a href="' + Alfresco.constants.URL_PAGECONTEXT 
						+ 'workflow-details?workflowId=' + data.id + '&referrer=workflows' 
						+ '" class="view-workflow" title="' + this.msg("link.viewWorkflow") + '">&nbsp;</a></div>';
				
			var msg = this.msg('action.detachWorkflowFromProject');
			var clb = 'onDetachWorkflow';
			
			desc += '<div class="' + clb + '"><a href="" ' + 'class="alvex-project-workflow-action ' + this.id + '-action-link" ' 
					+ 'title="' + msg +'"><span>' + msg + '</span></a></div>';
			desc += '</div>';

			elCell.innerHTML = desc;
		},
		
		onDetachWorkflow: function(obj)
		{
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
		
		onAttachWorkflowDialog: function (event)
		{
			Event.preventDefault(event);
			var me = this;
			
			if( ! this.widgets.attachWorkflowDialog )
				return;
			
			// Enable esc listener
			if (!this.widgets.attachWorkflowDialogEscapeListener)
			{
				this.widgets.attachWorkflowDialogEscapeListener = new KeyListener(
					this.id + "-attach-workflow-dialog",
					{
						keys: KeyListener.KEY.ESCAPE
					},
					{
						fn: function(eventName, keyEvent)
						{
							this.onAttachCancel();
							Event.stopEvent(keyEvent[1]);
						},
						scope: this,
						correctScope: true
					});
			}
			this.widgets.attachWorkflowDialogEscapeListener.enable();

			// Show the dialog
			this.widgets.attachWorkflowDialog.show();
			Dom.removeClass(this.id + "-attach-workflow-dialog", "hidden");
			this.widgets.attachWorkflowDialog.center();
		},
		
		onSearch: function()
		{
			// Get possible workflows to attach, fill dataTable
			Alfresco.util.Ajax.jsonRequest({
				url: Alfresco.constants.PROXY_URI 
						+ "api/alvex/workflow-instances?" 
						+ "text=" + Dom.get(this.id + '-attach-workflow-dialog-search').value,
				method: Alfresco.util.Ajax.GET,
				successCallback:
				{
					fn: function (resp)
					{
						this.options.workflowsDataStore = [];
						for( var w in resp.json.data )
							this.options.workflowsDataStore.push(resp.json.data[w]);
						this.widgets.workflowsDataTable.getDataSource().sendRequest('', 
								{ 
									success: this.widgets.workflowsDataTable.onDataReturnInitializeTable, 
									scope: this.widgets.workflowsDataTable
								}
							);
					},
					scope:this
				},
				failureCallback:
				{
					fn: function (resp)
					{
						if (resp.serverResponse.statusText) {
							Alfresco.util.PopupManager.displayMessage( { 
								text: resp.serverResponse.statusText });
						}
					},
					scope:this
				}
			});
		},
			
		onAttachWorkflow: function(obj)
		{
			var me = this;
			
			Alfresco.util.Ajax.jsonRequest({
				url: Alfresco.constants.PROXY_URI 
						+ "api/alvex/project/" 
						+ encodeURIComponent(Alfresco.constants.SITE) + "/workflows",
				method: Alfresco.util.Ajax.PUT,
				dataObj: { data: { workflows: obj.id } },
				successCallback:
				{
					fn: function (resp)
					{
						if (resp.serverResponse.statusText) {
							Alfresco.util.PopupManager.displayMessage( { 
								text: resp.serverResponse.statusText });
						}
						me.widgets.alfrescoDataTable.loadDataTable();
					},
					scope:this
				},
				failureCallback:
				{
					fn: function (resp)
					{
						if (resp.serverResponse.statusText) {
							Alfresco.util.PopupManager.displayMessage( { 
								text: resp.serverResponse.statusText });
						}
						me.widgets.alfrescoDataTable.loadDataTable();
					},
					scope:this
				}
			});
		},

		onAttachCancel: function(e, p_obj)
		{
			this.widgets.attachWorkflowDialogEscapeListener.disable();
			this.widgets.attachWorkflowDialog.hide();
			if (e) {
				Event.preventDefault(e);
			}
		},

		onStartWorkflowDialog: function (event, obj)
		{
			var def = obj[1].value;
			// Custom template URL for the dialog
			var templateUrl = YAHOO.lang.substitute(
				Alfresco.constants.URL_SERVICECONTEXT 
				+ "components/form?itemKind={itemKind}&itemId={itemId}&mode={mode}&submitType={submitType}&formId={formId}&showCancelButton=true",
				{
					itemKind: "workflow",
					itemId: def,
					mode: "create",
					submitType: "json",
					formId: "popupDialogForm"	// Custom dialog form
				});

			// Create new dialog

			// It looks like 'destroyOnHide: true' works globally for all dialogs on the page - do not use it
			// We still delete dialog manually because we are to clear the form and everything around it
			if( this.widgets.startWorkflowDialog )
			{
				var form = Dom.get( this.widgets.startWorkflowDialog.form.formId );
				form.parentNode.removeChild( form );
				delete this.widgets.startWorkflowDialog;
			}

			this.widgets.startWorkflowDialog = new Alfresco.module.SimpleDialog(this.id + "-cntrl-popup-dialog");

			this.widgets.startWorkflowDialog.setOptions(
			{
				width: "800px",				// Alfresco default workflow task form width
				templateUrl: templateUrl,	// Our custom template URL
				actionUrl: null,
				destroyOnHide: false,

				// Before dialog show we just set its title
				doBeforeDialogShow:
				{
					fn: function RelWf_customizeDialogProperties(p_form, p_dialog)
					{
						// Final UI bits for child workflow form
						Dom.addClass(p_dialog.id + "-form-cancel", "hidden");
						var button = Dom.get(p_dialog.id + "-form-submit");
						button.children[0].children[0].innerHTML = this.msg("button.startWorkflow");
						Alfresco.util.populateHTML([
							p_dialog.id + "-dialogTitle", 
							Alfresco.util.message(this.msg("header.startWorkflowForProject"))
							]);
						Alfresco.util.populateHTML([
							p_dialog.id + "-form-container_h", 
							Alfresco.util.message(this.msg("header.startWorkflowForProject"))
							]);
					},
					scope: this
				},

				// It is called when dialog is closed with success.
				// It means child workflow was started successfully and we got the response.
				onSuccess:
				{
					fn: function RelWf_dialog_on_success(response, p_obj)
					{
						// Get workflow description from the form
						// TODO - hardcoded property name, move it to the config (?)
						var desc = response.config.dataObj.prop_bpm_workflowDescription;
						var id = response.json.persistedObject.replace('WorkflowInstance[id=','').split(',')[0];
						// Save workflow details, update server state and UI
						this.onAttachWorkflow( { "id":id, "description":desc } );
					},
					scope: this
				},

				onFailure:
				{
					fn: function RelWf_dialog_on_failure(resp)
					{
						if (resp.serverResponse.statusText) {
							Alfresco.util.PopupManager.displayMessage( { 
								text: resp.serverResponse.statusText });
						}
					},
					scope: this
				}
			}).show();
		}

	});
})();