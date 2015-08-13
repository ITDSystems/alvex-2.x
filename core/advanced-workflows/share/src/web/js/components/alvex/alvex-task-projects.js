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
 * TaskProjects component.
 *
 * @namespace Alvex
 * @class Alvex.TaskProjects
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
    * TaskProjects constructor.
    *
    * @param {String} htmlId The HTML id of the parent element
    * @return {Alvex.TaskProjects} The new TaskProjects instance
    * @constructor
    */
   Alvex.TaskProjects = function TaskProjects_constructor(htmlId)
   {
      Alvex.TaskProjects.superclass.constructor.call(this, htmlId, ["button"]);

      // Re-register with our own name
      this.name = "Alvex.TaskProjects";

      // Instance variables
      this.options = YAHOO.lang.merge(this.options, Alvex.TaskProjects.superclass.options);
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
   YAHOO.extend(Alvex.TaskProjects, Alfresco.component.ShareFormManager, 
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
         if(!args[1].id)
             return;
         this.workflow = args[1];
		 this.workflowId = args[1].id;
		 if( !this.workflowId )
			 return;
		 this.initUI();
		 this.fillProjectsList();
	  },
			  
	fillProjectsList: function()
	{
		var me = this;
         Alfresco.util.Ajax.jsonGet(
				 {
					url: Alfresco.constants.PROXY_URI + "api/alvex/workflow/" 
							+ me.workflowId + "/projects",
					successCallback:
					{
					   fn: function(resp)
					   {
						   var container = Dom.get( me.id + "-projects-list" );
						   container.innerHTML = '';
						   for( var a in resp.json.data )
						   {
							   var div = document.createElement("div");
							   div.className = "project-item";
							   //var img = document.createElement("img");
							   //img.src = Alfresco.constants.URL_RESCONTEXT + "components/images/site-16.png";
							   var span = document.createElement("span");
							   span.innerHTML = '<a title="' + resp.json.data[a]['project']['description'] 
									   + '" href="' + Alfresco.constants.URL_PAGECONTEXT 
									   + 'site/' + resp.json.data[a]['project']['shortName'] + '/dashboard">' 
									   + resp.json.data[a]['project']['title'] + '</a>';
							   span.className = 'project-site';
							   var action = document.createElement("span");
							   action.className = "action";
			
								var msg = me.msg('action.detachProject');
								var clb = 'onDetachProject';

								action.innerHTML = '<div class="' + clb + '" id="' + resp.json.data[a]['project']['shortName'] + '">' 
										+ '<a href="" ' + 'class="alvex-project-workflow-action ' 
										+ me.id + '-detach-project-action-link" style="visibility: visible;" ' 
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
			// Listener for add project buttons
			me.widgets.attachProjectButton = new YAHOO.widget.Button(this.id + "-add-project",
								{ onclick: { fn: this.onAttachProjectDialog, obj: null, scope: this } });

			// Dialog for project attach
			var dialogId = this.id + "-attach-project-dialog";
			
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

			this.widgets.attachProjectDialog = Alfresco.util.createYUIPanel(dialogId, { width: "540px" });
			this.widgets.attachProjectDialog.hideEvent.subscribe(this.onAttachCancel, null, this);

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
						var asset = me.widgets.projectsDataTable.getRecord(args[1].target.offsetParent).getData();
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
			YAHOO.Bubbling.addDefaultAction(this.id + "-attach-project-action-link", fnActionHandler, true);
			YAHOO.Bubbling.addDefaultAction(this.id + "-detach-project-action-link", fnActionHandler1, true);

			var myColumnDefs = [
				{key:'shortName', sortable:false, width:32, formatter: this.formatProjectAttachIconField},
				{key:'title', sortable:false, width: 310, formatter: this.formatProjectAttachNameField},
				{key:'action', sortable:false, width:45, formatter: this.formatProjectAttachActionsField}
			];

			this.options.projectsDataStore = [];
			this.widgets.projectsDataSource = new YAHOO.util.DataSource(me.options.projectsDataStore);
			this.widgets.projectsDataSource.responseType = YAHOO.util.DataSource.TYPE_JSARRAY;
			this.widgets.projectsDataSource.responseSchema = {
				fields: ["shortName", "title", "action"]
			};
			
			this.widgets.projectsDataSource.doBeforeParseData = function (oRequest, oFullResponse)
			{
				var response = [];
				for( var i in me.options.projectsDataStore )
				{
					me.options.projectsDataStore[i].action = '';
					response.push(me.options.projectsDataStore[i]);
				}		
				return response;
			};
			
			this.widgets.projectsDataTable = new YAHOO.widget.DataTable(dialogId + "-options-table",
				myColumnDefs, this.widgets.projectsDataSource,
			{
				MSG_EMPTY: this.msg("message.noProjects"),
				renderLoopSize: 100
			} );
			
			this.widgets.projectsDataTable.parent = me;

			this.onSearch();
      },
	  
  		formatProjectAttachIconField: function(elCell, oRecord, oColumn, oData)
		{
			var desc = '<img src="' + Alfresco.constants.URL_RESCONTEXT 
					+ 'components/images/site-16.png"/>';
			elCell.innerHTML = desc;
		},
		
		formatProjectAttachNameField: function(elCell, oRecord, oColumn, oData)
		{
			var item = oRecord.getData();
			var desc = '<h3><a href="' + $siteURL('site/' + item.shortName + '/dashboard') 
				+ '" class="theme-color-1" title="' 
				+ this.parent.msg("link.viewProject") + '">' + $html(item.title) + '</a></h3>';
			elCell.innerHTML = desc;
		},
		
		formatProjectAttachActionsField: function(elCell, oRecord, oColumn, oData)
		{
			var item = oRecord.getData();
			var desc = '<div class="action">';
			
			var msg = this.parent.msg('action.attachProject');
			var clb = 'onAttachProject';
			
			desc += '<div class="' + clb + '"><a href="" ' + 'class="alvex-project-workflow-action ' 
					+ this.parent.id + '-attach-project-action-link" ' 
					+ 'title="' + msg +'"><span>' + msg + '</span></a></div>';
			desc += '</div>';

			elCell.innerHTML = desc;
		},

		onAttachProjectDialog: function (event)
		{
			Event.preventDefault(event);
			var me = this;
			
			if( ! this.widgets.attachProjectDialog )
				return;
			
			// Enable esc listener
			if (!this.widgets.attachProjectDialogEscapeListener)
			{
				this.widgets.attachProjectDialogEscapeListener = new KeyListener(
					this.id + "-attach-project-dialog",
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
			this.widgets.attachProjectDialogEscapeListener.enable();

			// Show the dialog
			this.widgets.attachProjectDialog.show();
			Dom.removeClass(this.id + "-attach-project-dialog", "hidden");
			this.widgets.attachProjectDialog.center();
		},
		
		onSearch: function()
		{
			// Get possible workflows to attach, fill dataTable
			Alfresco.util.Ajax.jsonRequest({
				url: Alfresco.constants.PROXY_URI 
						+ "api/sites?size=250&spf=project-dashboard",
				method: Alfresco.util.Ajax.GET,
				successCallback:
				{
					fn: function (resp)
					{
						this.options.projectsDataStore = [];
						for( var w in resp.json )
							this.options.projectsDataStore.push(resp.json[w]);
						this.widgets.projectsDataTable.getDataSource().sendRequest('', 
								{ 
									success: this.widgets.projectsDataTable.onDataReturnInitializeTable, 
									scope: this.widgets.projectsDataTable
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
			
		onAttachProject: function(obj)
		{
			var me = this;
			
			Alfresco.util.Ajax.jsonRequest({
				url: Alfresco.constants.PROXY_URI 
						+ "api/alvex/project/" 
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
						me.fillProjectsList();
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
						me.fillProjectsList();
					},
					scope:this
				}
			});
		},

		onAttachCancel: function(e, p_obj)
		{
			this.widgets.attachProjectDialogEscapeListener.disable();
			this.widgets.attachProjectDialog.hide();
			if (e) {
				Event.preventDefault(e);
			}
		},
				
		onDetachProject: function(projectId)
		{
			var me = this;

			Alfresco.util.PopupManager.displayPrompt(
			{
				title: me.msg("title.detachProjectFromWorkflow"),
				text: me.msg("message.detachProjectFromWorkflow"),
				buttons: [
				{
					text: me.msg("button.detachProjectFromWorkflow"),
					handler: function()
					{
						var req = {};
									
						// Delete org chart role
						Alfresco.util.Ajax.jsonRequest({
							url: Alfresco.constants.PROXY_URI 
										+ "api/alvex/project/" + encodeURIComponent(projectId) 
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
									me.fillProjectsList();
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
									me.fillProjectsList();
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
