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
 * TaskCases component.
 *
 * @namespace Alvex
 * @class Alvex.TaskCases
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
    * TaskCases constructor.
    *
    * @param {String} htmlId The HTML id of the parent element
    * @return {Alvex.TaskCases} The new TaskCases instance
    * @constructor
    */
   Alvex.TaskCases = function TaskCases_constructor(htmlId)
   {
      Alvex.TaskCases.superclass.constructor.call(this, htmlId, ["button"]);

      // Re-register with our own name
      this.name = "Alvex.TaskCases";

      // Instance variables
      this.options = YAHOO.lang.merge(this.options, Alvex.TaskCases.superclass.options);
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
   YAHOO.extend(Alvex.TaskCases, Alfresco.component.ShareFormManager, 
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
		 this.workflowId = args[1].id;
		 if( !this.workflowId )
			 return;
		 this.initUI();
		 this.fillCasesList();
	  },
			  
	fillCasesList: function()
	{
		var me = this;
         Alfresco.util.Ajax.jsonGet(
				 {
					url: Alfresco.constants.PROXY_URI + "api/alvex/workflow/" 
							+ me.workflowId + "/cases",
					successCallback:
					{
					   fn: function(resp)
					   {
						   var container = Dom.get( me.id + "-cases-list" );
						   container.innerHTML = '';
						   for( var a in resp.json.data )
						   {
							   var div = document.createElement("div");
							   div.className = "case-item";
							   //var img = document.createElement("img");
							   //img.src = Alfresco.constants.URL_RESCONTEXT + "components/images/site-16.png";
							   var span = document.createElement("span");
							   span.innerHTML = '<a title="' + resp.json.data[a]['case']['description'] 
									   + '" href="' + Alfresco.constants.URL_PAGECONTEXT 
									   + 'site/' + resp.json.data[a]['case']['shortName'] + '/dashboard">' 
									   + resp.json.data[a]['case']['title'] + '</a>';
							   span.className = 'case-site';
							   var action = document.createElement("span");
							   action.className = "action";
			
								var msg = me.msg('action.detachCase');
								var clb = 'onDetachCase';

								action.innerHTML = '<div class="' + clb + '" id="' + resp.json.data[a]['case']['shortName'] + '">' 
										+ '<a href="" ' + 'class="alvex-case-workflow-action ' 
										+ me.id + '-detach-case-action-link" style="visibility: visible;" ' 
										+ 'title="' + msg +'"><span class="title">' + msg + '</span></a></div>';
			
							   //div.appendChild( img );
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
			  
	initUI: function()
	{
		var me = this;
			// Listener for add case buttons
			me.widgets.attachCaseButton = new YAHOO.widget.Button(this.id + "-add-case",
								{ onclick: { fn: this.onAttachCaseDialog, obj: null, scope: this } });

			// Dialog for case attach
			var dialogId = this.id + "-attach-case-dialog";
			
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

			this.widgets.attachCaseDialog = Alfresco.util.createYUIPanel(dialogId, { width: "540px" });
			this.widgets.attachCaseDialog.hideEvent.subscribe(this.onAttachCancel, null, this);

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
						var asset = me.widgets.casesDataTable.getRecord(args[1].target.offsetParent).getData();
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
			YAHOO.Bubbling.addDefaultAction(this.id + "-attach-case-action-link", fnActionHandler, true);
			YAHOO.Bubbling.addDefaultAction(this.id + "-detach-case-action-link", fnActionHandler1, true);

			var myColumnDefs = [
				{key:'shortName', sortable:false, width:32, formatter: this.formatCaseAttachIconField},
				{key:'title', sortable:false, width: 310, formatter: this.formatCaseAttachNameField},
				{key:'action', sortable:false, width:45, formatter: this.formatCaseAttachActionsField}
			];

			this.options.casesDataStore = [];
			this.widgets.casesDataSource = new YAHOO.util.DataSource(me.options.casesDataStore);
			this.widgets.casesDataSource.responseType = YAHOO.util.DataSource.TYPE_JSARRAY;
			this.widgets.casesDataSource.responseSchema = {
				fields: ["shortName", "title", "action"]
			};
			
			this.widgets.casesDataSource.doBeforeParseData = function (oRequest, oFullResponse)
			{
				var response = [];
				for( var i in me.options.casesDataStore )
				{
					me.options.casesDataStore[i].action = '';
					response.push(me.options.casesDataStore[i]);
				}		
				return response;
			};
			
			this.widgets.casesDataTable = new YAHOO.widget.DataTable(dialogId + "-options-table",
				myColumnDefs, this.widgets.casesDataSource,
			{
				MSG_EMPTY: this.msg("message.noCases"),
				renderLoopSize: 100
			} );
			
			this.widgets.casesDataTable.parent = me;

			this.onSearch();
      },
	  
  		formatCaseAttachIconField: function(elCell, oRecord, oColumn, oData)
		{
			var desc = '<img src="' + Alfresco.constants.URL_RESCONTEXT 
					+ 'components/images/site-16.png"/>';
			elCell.innerHTML = desc;
		},
		
		formatCaseAttachNameField: function(elCell, oRecord, oColumn, oData)
		{
			var item = oRecord.getData();
			var desc = '<h3><a href="' + $siteURL('site/' + item.shortName + '/dashboard') 
				+ '" class="theme-color-1" title="' 
				+ this.parent.msg("link.viewCase") + '">' + $html(item.title) + '</a></h3>';
			elCell.innerHTML = desc;
		},
		
		formatCaseAttachActionsField: function(elCell, oRecord, oColumn, oData)
		{
			var item = oRecord.getData();
			var desc = '<div class="action">';
			
			var msg = this.parent.msg('action.attachCase');
			var clb = 'onAttachCase';
			
			desc += '<div class="' + clb + '"><a href="" ' + 'class="alvex-case-workflow-action ' 
					+ this.parent.id + '-attach-case-action-link" ' 
					+ 'title="' + msg +'"><span>' + msg + '</span></a></div>';
			desc += '</div>';

			elCell.innerHTML = desc;
		},

		onAttachCaseDialog: function (event)
		{
			Event.preventDefault(event);
			var me = this;
			
			if( ! this.widgets.attachCaseDialog )
				return;
			
			// Enable esc listener
			if (!this.widgets.attachCaseDialogEscapeListener)
			{
				this.widgets.attachCaseDialogEscapeListener = new KeyListener(
					this.id + "-attach-case-dialog",
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
			this.widgets.attachCaseDialogEscapeListener.enable();

			// Show the dialog
			this.widgets.attachCaseDialog.show();
			Dom.removeClass(this.id + "-attach-case-dialog", "hidden");
			this.widgets.attachCaseDialog.center();
		},
		
		onSearch: function()
		{
			// Get possible workflows to attach, fill dataTable
			Alfresco.util.Ajax.jsonRequest({
				url: Alfresco.constants.PROXY_URI 
						+ "api/sites?size=250&spf=case-dashboard",
				method: Alfresco.util.Ajax.GET,
				successCallback:
				{
					fn: function (resp)
					{
						this.options.casesDataStore = [];
						for( var w in resp.json )
							this.options.casesDataStore.push(resp.json[w]);
						this.widgets.casesDataTable.getDataSource().sendRequest('', 
								{ 
									success: this.widgets.casesDataTable.onDataReturnInitializeTable, 
									scope: this.widgets.casesDataTable
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
			
		onAttachCase: function(obj)
		{
			var me = this;
			
			Alfresco.util.Ajax.jsonRequest({
				url: Alfresco.constants.PROXY_URI 
						+ "api/alvex/case/" 
						+ encodeURIComponent(obj.shortName) + "/workflows",
				method: Alfresco.util.Ajax.PUT,
				dataObj: { data: { workflows: me.workflowId } },
				successCallback:
				{
					fn: function (resp)
					{
						if (resp.serverResponse.statusText) {
							Alfresco.util.PopupManager.displayMessage( { 
								text: resp.serverResponse.statusText });
						}
						me.fillCasesList();
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
						me.fillCasesList();
					},
					scope:this
				}
			});
		},

		onAttachCancel: function(e, p_obj)
		{
			this.widgets.attachCaseDialogEscapeListener.disable();
			this.widgets.attachCaseDialog.hide();
			if (e) {
				Event.preventDefault(e);
			}
		},
				
		onDetachCase: function(caseId)
		{
			var me = this;

			Alfresco.util.PopupManager.displayPrompt(
			{
				title: me.msg("title.detachCaseFromWorkflow"),
				text: me.msg("message.detachCaseFromWorkflow"),
				buttons: [
				{
					text: me.msg("button.detachCaseFromWorkflow"),
					handler: function()
					{
						var req = {};
									
						// Delete org chart role
						Alfresco.util.Ajax.jsonRequest({
							url: Alfresco.constants.PROXY_URI 
										+ "api/alvex/case/" + encodeURIComponent(caseId) 
										+ "/workflow/" + encodeURIComponent(me.workflowId) + "?alf_method=DELETE",
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
									me.fillCasesList();
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
									me.fillCasesList();
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

		}


   });
})();
