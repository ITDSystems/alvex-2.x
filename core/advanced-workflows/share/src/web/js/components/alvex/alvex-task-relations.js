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
 * TaskRelations component.
 *
 * @namespace Alvex
 * @class Alvex.TaskRelations
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
       $hasEventInterest = Alfresco.util.hasEventInterest,
       $siteURL = Alfresco.util.siteURL,
       $combine = Alfresco.util.combinePaths;

   /**
    * TaskRelations constructor.
    *
    * @param {String} htmlId The HTML id of the parent element
    * @return {Alvex.TaskRelations} The new TaskRelations instance
    * @constructor
    */
   Alvex.TaskRelations = function TaskRelations_constructor(htmlId)
   {
      Alvex.TaskRelations.superclass.constructor.call(this, htmlId, ["button"]);

      // Re-register with our own name
      this.name = "Alvex.TaskRelations";

      // Instance variables
      this.options = YAHOO.lang.merge(this.options, Alvex.TaskRelations.superclass.options);
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
   YAHOO.extend(Alvex.TaskRelations, Alfresco.component.ShareFormManager, 
   {

      style: "table", // options - "bubbles", "table"

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
      workflow: null,

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
      onWorkflowDetailedData: function (layer, args)
      {
         this.workflow = args[1];
		 if( !this.workflow.id )
			 return;
		 if( this.style === "table" )
			this.fillRelatedWorkflowTable();
		 else
			 this.fillRelatedWorkflowList();
		 this.createRelatedWorkflowButtons();
	  },
	
		createRelatedWorkflowButtons: function()
		{
			var me = this;
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
			var fnActionHandler1 = function fnActionHandler(layer, args)
			{
				var owner = YAHOO.Bubbling.getOwnerByTagName(args[1].anchor, "div");
				if (owner !== null)
				{
					if (typeof me[owner.className] == "function")
					{
						args[1].stop = true;
						var asset = owner.id;
						me[owner.className].call(me, asset, owner);
					}
				}
				return true;
			};

			YAHOO.Bubbling.addDefaultAction(this.id + "-attach-workflow-action-link", fnActionHandler, true);
			YAHOO.Bubbling.addDefaultAction(this.id + "-cancel-workflow-action-link", fnActionHandler1, true);

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

		formatWorkflowAttachIconField: function(elCell, oRecord, oColumn, oData)
		{
			var desc = '<img src="' + Alfresco.constants.URL_RESCONTEXT 
					+ 'components/images/priority-medium-16.png"/>';
			elCell.innerHTML = desc;
		},
		
		formatWorkflowAttachNameField: function(elCell, oRecord, oColumn, oData)
		{
			var workflow = oRecord.getData();
			var desc = '<h3><a href="' + $siteURL('workflow-details?workflowId=' + workflow.id 
				+ '&referrer=workflows') + '" class="theme-color-1" title="' 
				+ this.parent.msg("link.viewWorkflow") + '">' + $html(workflow.message) + '</a></h3>';
			elCell.innerHTML = desc;
		},
		
		formatWorkflowAttachActionsField: function(elCell, oRecord, oColumn, oData)
		{
			var workflow = oRecord.getData();
			var desc = '<div class="action">';
			
			var msg = this.parent.msg('action.attachWorkflow');
			var clb = 'onAttachWorkflow';
			
			desc += '<div class="' + clb + '"><a href="" ' + 'class="alvex-related-workflow-action ' 
					+ this.parent.id + '-attach-workflow-action-link" ' 
					+ 'title="' + msg +'"><span>' + msg + '</span></a></div>';
			desc += '</div>';

			elCell.innerHTML = desc;
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
						+ "api/alvex/workflow/" 
						+ encodeURIComponent(me.workflow.id) + "/workflows",
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
						if( me.style === "table")
							me.options.dataSource.sendRequest(
								null,
								{
									success: me.options.dataTable.onDataReturnInitializeTable, 
									scope: me.options.dataTable
								}
							);
						else
							me.fillRelatedWorkflowList();
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
						if( me.style === "table" )
							me.options.dataSource.sendRequest(
								null,
								{
									success: me.options.dataTable.onDataReturnInitializeTable, 
									scope: me.options.dataTable
								}
							);
						else
							me.fillRelatedWorkflowList();
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
							Alfresco.util.message(this.msg("header.startRelatedWorkflow"))
							]);
						Alfresco.util.populateHTML([
							p_dialog.id + "-form-container_h", 
							Alfresco.util.message(this.msg("header.startRelatedWorkflow"))
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
		},
				
		fillRelatedWorkflowTable: function()
		{
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
						var asset = me.options.dataTable.getRecord(args[1].target.offsetParent).getData();
						me[owner.className].call(me, asset, owner);
					}
				}
				return true;
			};
			YAHOO.Bubbling.addDefaultAction(this.id + "-action-link", fnActionHandler, true);

			// Columns defs
			var columnDefs =
			[
				{
					key: '',
					label: this.msg("alvex.related_workflows.workflow"),
					sortable:false,
					resizeable:true,
					width:250,
					formatter: this.formatDescriptionField
				},

				{
					key:"startDate",
					label: this.msg("alvex.related_workflows.start_date"),
					sortable:false,
					resizeable:true,
					width:125,
					formatter: this.formatStartDateField
				},

				{
					key:"status",
					label: this.msg("alvex.related_workflows.progress"),
					sortable:false,
					resizeable:true,
					width:125,
					formatter: this.formatStatusField
				},
				{
					key:"assignees",
					label: this.msg("alvex.related_workflows.persons_in_charge"),
					sortable:false,
					resizeable:true,
					width:100,
					formatter: this.formatAssigneesField
				},

				{
					key: '',
					label: this.msg('alvex.related_workflows.actions'),
					sortable:false,
					resizeable:true,
					width:100,
					formatter: this.formatActionsField
				}
			];

			// Use our list of related workflows as datasource
			var url = YAHOO.lang.substitute(
				"{proxy}api/alvex/workflow/{workflowId}/workflows",
				{
					proxy: Alfresco.constants.PROXY_URI,
					workflowId: this.workflow.id
				}
			);
			this.options.dataSource = new YAHOO.util.DataSource(url);
			this.options.dataSource.responseType = YAHOO.util.DataSource.TYPE_JSON;
			this.options.dataSource.responseSchema = {
				resultsList: 'data',
				fields: [
					'relatedWorkflow.id',
					'relatedWorkflow.status',
					'relatedWorkflow.description',
					'relatedWorkflow.startDate',
					'relatedWorkflow.endDate',
					'relatedWorkflow.dueDate',
					'relatedWorkflow.assignees'
				]
			};
			this.options.dataSource.maxCacheEntries = 0;
			this.options.dataSource.doBeforeParseData = function (oRequest, oFullResponse)
			{
				var updatedResponse = { "data": [] };
				for (var i = 0; i < oFullResponse.data.length; i++)
					if( oFullResponse.data[i].relatedWorkflow.id !== me.workflow.id )
						updatedResponse.data.push(oFullResponse.data[i]);
				return updatedResponse;
			};

			// Create the table
			this.options.dataTable = new YAHOO.widget.DataTable(
				this.id + "-related-workflows", columnDefs, this.options.dataSource,
				{
					selectionMode:"single",
					renderLoopSize: 32,
					MSG_EMPTY: this.msg('alvex.related_workflows.no_related_workflows')
				});
			this.options.dataTable.relatedWorkflows = this;
			this.options.dataTable.showTableMessage(
				this.msg('alvex.related_workflows.loading'),
				YAHOO.widget.DataTable.CLASS_LOADING
			);
				
			// Enable row highlighting
			this.options.dataTable.subscribe("rowMouseoverEvent", this.onEventHighlightRow, this, true);
			this.options.dataTable.subscribe("rowMouseoutEvent", this.onEventUnhighlightRow, this, true);

			this.options.dataSource.sendRequest(
				null,
				{
					success: this.options.dataTable.onDataReturnInitializeTable, 
					scope: this.options.dataTable
				}
			);
      },

		formatDescriptionField: function (elLiner, oRecord, oColumn, oData)
		{
			elLiner.innerHTML = YAHOO.lang.substitute(
				'<a href="{page}workflow-details?workflowId={id}">{descr}</a>',
				{
					page: Alfresco.constants.URL_PAGECONTEXT,
					id: oRecord._oData["relatedWorkflow.id"],
					descr: YAHOO.lang.escapeHTML(oRecord._oData["relatedWorkflow.description"])
				}
			);
		},

		formatStartDateField: function (elLiner, oRecord, oColumn, oData)
		{
			elLiner.innerHTML = Alfresco.util.formatDate( Alfresco.util.fromISO8601(oRecord._oData["relatedWorkflow.startDate"]) , "mediumDate");
		},

		formatStatusField: function (elLiner, oRecord, oColumn, oData)
		{
			elLiner.innerHTML = {
				'in-progress': this.relatedWorkflows.msg("alvex.related_workflows.in_progress")
				+ ( oRecord._oData["relatedWorkflow.dueDate"] && oRecord._oData["relatedWorkflow.dueDate"] != '' && oRecord._oData["relatedWorkflow.dueDate"] != 'null' ? 
					"<br/>" + this.relatedWorkflows.msg("alvex.related_workflows.dueDate") + " " 
				+ Alfresco.util.formatDate( Alfresco.util.fromISO8601(oRecord._oData["relatedWorkflow.dueDate"]) , "mediumDate") : "" ),
				'complete': this.relatedWorkflows.msg("alvex.related_workflows.complete")
				+ " (" + Alfresco.util.formatDate( Alfresco.util.fromISO8601(oRecord._oData["relatedWorkflow.completeDate"]) , "mediumDate") + ")"
			}[oRecord._oData["relatedWorkflow.status"]];
		},

		formatAssigneesField: function (elLiner, oRecord, oColumn, oData)
		{
			for (var idx in oRecord._oData["relatedWorkflow.assignees"])
			{
				var person = oRecord._oData["relatedWorkflow.assignees"][idx];
				elLiner.innerHTML += YAHOO.lang.substitute(
					'<a href="{page}user/{user}/profile">{firstName} {lastName}</a><br/>',
					{
						page: Alfresco.constants.URL_PAGECONTEXT,
						user: person.userName,
						firstName: person.firstName,
						lastName: person.lastName
					}
				);
			}
		},

		formatActionsField: function (elLiner, oRecord, oColumn, oData)
		{
			if( this.relatedWorkflows.options.mode == "view" )
			{
				elLiner.innerHTML = '';
				return;
			}
			
			var clb, msg;
			var id = this.relatedWorkflows.id;
			var html = '<div id="' + id + '-actions-' + oRecord.getId() + '" class="hidden action">';
			
			msg = this.relatedWorkflows.msg('alvex.related_workflows.retrieve');
			if (oRecord._oData["relatedWorkflow.status"] == 'complete')
				clb = 'retrieveDocuments';
			else
				clb = 'retrieveDocumentsDisabled';
			
			html += '<div class="' + clb + '"><a rel="cancel" href="" ' 
					+ 'class="related-workflows-action-link ' + id + '-action-link"'
					+ 'title="' + msg +'"><span>' + msg + '</span></a></div>';
			
			msg = this.relatedWorkflows.msg('alvex.related_workflows.cancel');
			if (oRecord._oData["relatedWorkflow.status"] == 'in-progress')
				clb = 'cancelWorkflow';
			else
				clb = 'cancelWorkflowDisabled';

			html += '<div class="' + clb + '"><a rel="cancel" href="" ' 
					+ 'class="related-workflows-action-link ' + id + '-action-link"'
					+ 'title="' + msg +'"><span>' + msg + '</span></a></div>';

			html += '</div>';

			elLiner.innerHTML = html;
		},

		onEventHighlightRow: function DataGrid_onEventHighlightRow(oArgs)
		{
			// Call through to get the row highlighted by YUI
			// this.widgets.dataTable.onEventHighlightRow.call(this.widgets.dataTable, oArgs);

			var elActions = Dom.get(this.id + "-actions-" + oArgs.target.id);
			Dom.removeClass(elActions, "hidden");
		},

		onEventUnhighlightRow: function DataGrid_onEventUnhighlightRow(oArgs)
		{
			// Call through to get the row unhighlighted by YUI
			// this.widgets.dataTable.onEventUnhighlightRow.call(this.widgets.dataTable, oArgs);

			var elActions = Dom.get(this.id + "-actions-" + (oArgs.target.id));
			Dom.addClass(elActions, "hidden");
		},
				
				
		fillRelatedWorkflowList: function()
		{
			var me = this;
			var url = YAHOO.lang.substitute(
				"{proxy}api/alvex/workflow/{workflowId}/workflows",
				{
					proxy: Alfresco.constants.PROXY_URI,
					workflowId: this.workflow.id
				}
			);
			 Alfresco.util.Ajax.jsonGet(
			 {
				url: url,
				successCallback:
				{
				   fn: function(resp)
				   {
					   var container = Dom.get( me.id + "-related-workflows" );
					   container.innerHTML = '';
					   for( var a in resp.json.data )
					   {
							var link = YAHOO.lang.substitute(
								'<a href="{page}workflow-details?workflowId={id}">{descr}</a>',
								{
									page: Alfresco.constants.URL_PAGECONTEXT,
									id: resp.json.data[a].relatedWorkflow.id,
									descr: YAHOO.lang.escapeHTML(resp.json.data[a].relatedWorkflow.description)
								}
							);
						   
						   var div = document.createElement("div");
						   div.className = "related-workflow-item";
						   var span = document.createElement("span");
						   span.innerHTML = link;
						   if( resp.json.data[a].relatedWorkflow.status === "in-progress" )
							   span.className = "pending";
						   else
							   span.className = "completed";
						   var action = document.createElement("span");
						   action.className = "action";

							var msg = me.msg('alvex.related_workflows.cancel');
							var clb = 'cancelWorkflow';

							action.innerHTML = '<div class="' + clb + '" id="' + resp.json.data[a].relatedWorkflow.id + '">' 
									+ '<a href="" ' + 'class="alvex-related-workflow-action ' 
									+ me.id + '-cancel-workflow-action-link" style="visibility: visible;" ' 
									+ 'title="' + msg +'"><span class="title">' + msg + '</span></a></div>';

						   div.appendChild( span );
						   div.appendChild( action );
						   container.appendChild( div );
					   }
				   },
				   scope: this
				},
				failureCallback:
				{
					fn: function (resp)
					{
						if (resp.serverResponse.statusText)
							Alfresco.util.PopupManager.displayMessage({ text: resp.serverResponse.statusText });
					},
					scope: this
				}
			 });
		},



		cancelWorkflow: function (obj)
		{
			Alfresco.util.PopupManager.displayPrompt(
			{
				title: this.msg("alvex.related_workflows.cancel_title"),
				text: this.msg("alvex.related_workflows.cancel_text"),
				buttons:
				[
					{
						text: this.msg("alvex.related_workflows.yes"),
						handler: (function(rw, obj){
							return function()
							{
								var url=YAHOO.lang.substitute(
									'{proxy}/api/workflow-instances/{id}',
									{
										proxy:Alfresco.constants.PROXY_URI,
										id:obj.id
									}
								);
								Alfresco.util.Ajax.jsonRequest({
									url:url,
									method:Alfresco.util.Ajax.DELETE,
									successCallback:
									{
										fn:function()
										{
											rw.update();
										}
									}
								});
								this.destroy();
							}
						})(this,obj)
					},
					{
						text:this.msg("alvex.related_workflows.no"),
						handler:function()
						{
							this.destroy();
						},
						isDefault:true
					}
				]
			});
		},

		retrieveDocuments: function (obj)
		{
			Alvex.util.processAjaxQueue({
				queue: [
					{
						url: Alfresco.constants.PROXY_URI+'api/workflow-instances/'+obj.id,
						responseContentType: Alfresco.util.Ajax.JSON,
						successCallback: {
							fn: function (response)
							{
								// build url for the next query
								var ref = response.json.data['package'].match(new RegExp('(.*)://(.*)/(.*)'))
								response.config.config.queue[1].url = YAHOO.lang.substitute(
									'{proxy}api/alvex/workflow-files?packageRef={ref}',
									{
										proxy: Alfresco.constants.PROXY_URI,
										ref: ref[0]
									}
								);
							},
							scope: this
						}
					},
					{
						url: null,
						successCallback: {
							fn: function (response)
							{
								var nodes = [];
								for (var i = 0; i < response.json.files.length; i++)
								{
									nodes.push( response.json.files[i].nodeRef );
								}
								YAHOO.Bubbling.fire('uploaderAddFilesReq', 
									{
										uploader: this.options.parentUploaderId,
										files: nodes.join(',')
									});
							},
							scope: this
						}
					}
				]
			});
		}


   });
})();
