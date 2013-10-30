/**
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

// Ensure root object exists
if (typeof Alvex == "undefined" || !Alvex)
{
	var Alvex = {};
}

(function()
{
	/**
	* YUI Library aliases
	*/
	var Dom = YAHOO.util.Dom,
		Event = YAHOO.util.Event,
		KeyListener = YAHOO.util.KeyListener,
		Selector = YAHOO.util.Selector;
	
	var $html = Alfresco.util.encodeHTML;

	/**
	 * Preferences
	 */
	var PREFERENCES_MY_TASKS = "org.alfresco.share.my.tasks";
	var PREFERENCES_MY_TASKS_FILTER = PREFERENCES_MY_TASKS + ".filter";
	var PREFERENCES_MY_TASKS_SORTER = PREFERENCES_MY_TASKS + ".sorter";
	var PREFERENCES_MY_TASKS_COLUMNS = PREFERENCES_MY_TASKS + ".columns";
	var PREFERENCES_MY_TASKS_STYLE = PREFERENCES_MY_TASKS + ".style";

	/**
	* TaskListHeader constructor.
	*
	* @param {String} htmlId The HTML id of the parent element
	* @return {Alvex.TaskListHeader} The new TaskListHeader instance
	* @constructor
	*/
	Alvex.TaskListHeader = function TDH_constructor(htmlId)
	{
		Alvex.TaskListHeader.superclass.constructor.call(this, "Alvex.TaskListHeader", htmlId, ["button"]);
		
		// Services
		this.services.preferences = new Alfresco.service.Preferences();
		
		YAHOO.Bubbling.on("filterChanged", this.onFilterChanged, this);
		YAHOO.Bubbling.on("taskListPreferencesLoaded", this.onTaskListPreferencesLoaded, this);
		
		return this;
	};

	YAHOO.extend(Alvex.TaskListHeader, Alfresco.component.Base,
	{
		onReady: function WLT_onReady()
		{
			this.widgets.configurePageButton = Alfresco.util.createYUIButton(this, "configurePage-button", this.onConfigurePageButtonClick, {});
			
			var dialogId = this.id + '-conf-dialog';
			
			this.widgets.configurePageDialogOk = new YAHOO.widget.Button(dialogId + '-ok',
						{ onclick: { fn: this.onConfigureOk, obj: null, scope: this } });
			this.widgets.configurePageDialogCancel = new YAHOO.widget.Button(dialogId + '-cancel',
						{ onclick: { fn: this.onConfigureCancel, obj: null, scope: this } });
			
			this.widgets.configurePageDialog = Alfresco.util.createYUIPanel(dialogId, { width: "800px" });
			this.widgets.configurePageDialog.hideEvent.subscribe(this.onConfigureCancel, null, this);

			this.createStartWorkflowMenu();
			
			if( Alfresco.constants.SITE !== "" )
				this.createAttachWorkflowDialog();
		},
		
		createAttachWorkflowDialog: function()
		{
			var me = this;
			// Listener for add workflow buttons
			me.widgets.attachWorkflowButton = new YAHOO.widget.Button(this.id + "-attachWorkflow-button",
													{ onclick: { fn: this.onAttachWorkflowDialog, obj: null, scope: this } });
													
			Dom.removeClass(Selector.query(".attach-workflow", me.id + "-body", true), "hidden");
			
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
		},
		
		createStartWorkflowMenu: function()
		{
			// Start workflow menu
			var me = this;
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
								var menuEl = Dom.get(me.id + '-startWorkflow-button-menu');
								for (var key in response.json.data)  {
									var task = response.json.data[key];
									for (var i in this.options.allowedWorkflows)
										if(this.options.allowedWorkflows[i].name === task.name)
											menuEl.options.add(new Option(task.title, task.name));
								}
								me.widgets.startWorkflowButton = new YAHOO.widget.Button(
									this.id + "-startWorkflow-button",
									{
										type: "menu",
										menu: me.id + '-startWorkflow-button-menu'
									} );
								me.widgets.startWorkflowButton.getMenu().subscribe("click", me.onStartWorkflowClick, null, me)
								Dom.removeClass(Selector.query(".hidden", me.id + "-body", true), "hidden");
							},
							scope: this
						}						
					}
				]
			});
		},

		createDNDArea: function()
		{
			this.widgets.availListEl = Dom.get(this.id + "-conf-dialog-column-ul-0");
			this.widgets.usedListEl = Dom.get(this.id + "-conf-dialog-column-ul-1");
			this.widgets.shadowEl = Dom.get(this.id + "-conf-dialog-dashlet-li-shadow");

			var dndConfig =
			{
				shadow: this.widgets.shadowEl,
				draggables: [
					{
						container: this.widgets.availListEl,
						groups: [Alfresco.util.DragAndDrop.GROUP_MOVE],
						cssClass: "availableDashlet",
					},
					{
						container: this.widgets.usedListEl,
						groups: [Alfresco.util.DragAndDrop.GROUP_MOVE],
						cssClass: "usedDashlet",
					}
				],
				targets: [
					{
						container: this.widgets.availListEl,
						group: Alfresco.util.DragAndDrop.GROUP_MOVE
					},
					{
						container: this.widgets.usedListEl,
						group: Alfresco.util.DragAndDrop.GROUP_MOVE
					}
				]
			};
			var dnd = new Alfresco.util.DragAndDrop(dndConfig);
		},
		
		onStartWorkflowClick: function(ev, obj)
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
							Alfresco.util.message(this.msg("header.startWorkflowForCase"))
							]);
						Alfresco.util.populateHTML([
							p_dialog.id + "-form-container_h", 
							Alfresco.util.message(this.msg("header.startWorkflowForCase"))
							]);
					},
					scope: this
				},

				// It is called when dialog is closed with success.
				// It means child workflow was started successfully and we got the response.
				onSuccess:
				{
					fn: function(response, p_obj)
					{
						if( Alfresco.constants.SITE === "" )
							return;
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
					fn: function(resp)
					{
						if (resp.serverResponse.statusText) {
							Alfresco.util.PopupManager.displayMessage( { 
								text: resp.serverResponse.statusText });
						}
					},
					scope: this
				}
			}).show();
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

		onAttachCancel: function(e, p_obj)
		{
			this.widgets.attachWorkflowDialogEscapeListener.disable();
			this.widgets.attachWorkflowDialog.hide();
			if (e) {
				Event.preventDefault(e);
			}
		},

		onAttachWorkflow: function(obj)
		{
			var me = this;
			
			Alfresco.util.Ajax.jsonRequest({
				url: Alfresco.constants.PROXY_URI 
						+ "api/alvex/case/" 
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
						YAHOO.Bubbling.fire("taskListTableReload");
						//me.widgets.alfrescoDataTable.loadDataTable();
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
						YAHOO.Bubbling.fire("taskListTableReload");
						//me.widgets.alfrescoDataTable.loadDataTable();
					},
					scope:this
				}
			});
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
			
			desc += '<div class="' + clb + '"><a href="" ' + 'class="alvex-case-workflow-action ' 
					+ this.parent.id + '-attach-workflow-action-link" ' 
					+ 'title="' + msg +'"><span>' + msg + '</span></a></div>';
			desc += '</div>';

			elCell.innerHTML = desc;
		},
		
		onFilterChanged: function BaseFilter_onFilterChanged(layer, args)
		{
			var filter = Alfresco.util.cleanBubblingObject(args[1]);
			Dom.get(this.id + "-subtitle").innerHTML = $html(this.msg("filter." + filter.filterId + (filter.filterData ? "." + filter.filterData : ""), filter.filterData));
		},
		
		onTaskListPreferencesLoaded: function(layer, args)
		{
			this.widgets.availListEl = Dom.get(this.id + "-conf-dialog-column-ul-0");
			this.widgets.usedListEl = Dom.get(this.id + "-conf-dialog-column-ul-1");

			this.widgets.availListEl.innerHTML = '';
			this.widgets.usedListEl.innerHTML = '';
			
			var data = args[1];
			for(var k in data.currentColumns )
			{
				for(var c in data.availableColumns)
				{
					if(data.availableColumns[c].id !== data.currentColumns[k])
						continue;
					var el = this.createColumnDND(data.availableColumns[c]);
					this.widgets.usedListEl.appendChild(el);
				}
			}
			for(var c in data.availableColumns)
			{
				var used = false;
				for(var k in data.currentColumns )
					if(data.availableColumns[c].id === data.currentColumns[k])
						used = true;
				if( !used )
				{
					var el = this.createColumnDND(data.availableColumns[c]);
					this.widgets.availListEl.appendChild(el);
				}
			}
			
			this.createDNDArea();
		},
		
		createColumnDND: function(column)
		{
			var li= document.createElement("li");
			li.className = 'tableColumn';
			var a = document.createElement('a');
			a.href = "#";
			var img = document.createElement('img');
			img.className = "dnd-draggable";
			img.src = Alfresco.constants.URL_CONTEXT + "res/yui/assets/skins/default/transparent.gif";
			img.alt = '';
			var span = document.createElement('span');
			span.innerHTML = column.label;
			var div = document.createElement('div');
			div.className = "dnd-draggable";
			div.title = this.msg("dnd.help.message");
			var hidden = document.createElement('input');
			hidden.type = "hidden";
			hidden.name = "columnid";
			hidden.value = column.id;

			a.appendChild(img);
			li.appendChild(a);
			li.appendChild(span);
			li.appendChild(div);
			li.appendChild(hidden);
			return li;
		},
		
		onConfigurePageButtonClick: function(event, p_obj)
		{
			Event.preventDefault(event);
			var me = this;
			
			if( ! this.widgets.configurePageDialog )
				return;
			
			// Enable esc listener
			if (!this.widgets.configurePageDialogEscapeListener)
			{
				this.widgets.configurePageDialogEscapeListener = new KeyListener(
					this.id + "-conf-dialog",
					{
						keys: KeyListener.KEY.ESCAPE
					},
					{
						fn: function(eventName, keyEvent)
						{
							this.onConfigureCancel();
							Event.stopEvent(keyEvent[1]);
						},
						scope: this,
						correctScope: true
					});
			}
			this.widgets.configurePageDialogEscapeListener.enable();

			// Show the dialog
			this.widgets.configurePageDialog.show();
			Dom.removeClass(this.id + "-conf-dialog", "hidden");
			this.widgets.configurePageDialog.center();
		},

		onConfigureCancel: function(e, p_obj)
		{
			this.widgets.configurePageDialogEscapeListener.disable();
			this.widgets.configurePageDialog.hide();
			if (e) {
				Event.preventDefault(e);
			}
		},
				
		onConfigureOk: function(e, p_obj)
		{
			var result = [];
			
			var ul = Dom.get(this.id + "-conf-dialog-column-ul-1");
			var lis = Dom.getElementsByClassName("tableColumn", "li", ul);
			for (var j = 0; j < lis.length; j++)
			{
				var li = lis[j];
				if(Dom.hasClass(li, "dnd-shadow"))
					continue;
				var id = Selector.query("input[type=hidden][name=columnid]", li, true).value
				result.push(j + '$' + id);
			}
			
			this.services.preferences.set(PREFERENCES_MY_TASKS_COLUMNS, result.join(','), 
				{
					successCallback: {
						fn: this.onPreferencesSaved,
						scope: this
					}
				});
			
			this.widgets.configurePageDialogEscapeListener.disable();
			this.widgets.configurePageDialog.hide();
			if (e) {
				Event.preventDefault(e);
			}
		},
				
		onPreferencesSaved: function()
		{
			YAHOO.Bubbling.fire("taskListPrefsUpdated");
		}
   });

})();
