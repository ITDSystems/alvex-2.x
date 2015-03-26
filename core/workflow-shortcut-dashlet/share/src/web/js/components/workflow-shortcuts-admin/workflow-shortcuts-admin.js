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
if (typeof Alvex == "undefined" || !Alvex)
{
	var Alvex = {};	
}

(function()
{
	var Dom = YAHOO.util.Dom,
		Event = YAHOO.util.Event,
		Element = YAHOO.util.Element;

	var $html = Alfresco.util.encodeHTML,
		$hasEventInterest = Alfresco.util.hasEventInterest; 

	Alvex.WorkflowShortcutsAdmin = function(htmlId)
	{
		this.name = "Alvex.WorkflowShortcutsAdmi";
		Alvex.WorkflowShortcutsAdmin.superclass.constructor.call(this, htmlId);

		Alfresco.util.ComponentManager.register(this);

		Alfresco.util.YUILoaderHelper.require(["button", "container", "datasource", 
			"datatable", "json", "history", "autocomplete"], this.onComponentsLoaded, this);

		var parent = this;

		this.cur_group = '';

		YAHOO.Bubbling.on("removeWorkflowClick", this.onRemoveWorkflowClick, this);

		PanelHandler = function PanelHandler_constructor()
		{
			PanelHandler.superclass.constructor.call(this, "main");
		};
		YAHOO.extend(PanelHandler, Alfresco.ConsolePanelHandler,
		{
			onLoad: function onLoad()
			{

				parent.cur_group = parent.options.groups[0].shortName;

				// DataSource setup
				parent.widgets.dataSource = new YAHOO.util.DataSource(Alfresco.constants.PROXY_URI 
					+ "api/alvex/workflow-shortcut/admin/allowed-workflows?",
				{
					responseType: YAHOO.util.DataSource.TYPE_JSON,
					responseSchema:
					{
						resultsList: "workflows"
					}
				});

				parent.widgets.dataSource.doBeforeParseData = function f(oRequest, oFullResponse)
				{
					var workflowDefinitions = parent.options.workflowDefinitions;
					var updatedResponse = {};
					updatedResponse['workflows'] = [];
					for (var i = 0; i < oFullResponse.workflows.length; i++) {
						oFullResponse.workflows[i].actions = '';
						for (var j = 0; j < workflowDefinitions.length; j++)
							if(workflowDefinitions[j].name == oFullResponse.workflows[i].name) {
								oFullResponse.workflows[i].title = workflowDefinitions[j].title;
								updatedResponse.workflows.push(oFullResponse.workflows[i]);
							}
					}
					return updatedResponse;
				};
				
				parent.widgets.DSGroups = new YAHOO.util.LocalDataSource(parent.options.groups);
			    parent.widgets.DSGroups.responseSchema = {
			        fields : ["displayName", "shortName"]
			    };
			    
			    parent.widgets.AutoCompGroups = new YAHOO.widget.AutoComplete(parent.id + "-group-input", parent.id + "-group-container", parent.widgets.DSGroups);
			    parent.widgets.AutoCompGroups.animVert = true;
			    parent.widgets.AutoCompGroups.maxResultsDisplayed = 50;
			    parent.widgets.AutoCompGroups.useIFrame = true;
			    parent.widgets.AutoCompGroups.applyLocalFilter = true;
			    parent.widgets.AutoCompGroups.queryMatchContains = true;
			    parent.widgets.AutoCompGroups.minQueryLength = 0;
			    parent.widgets.AutoCompGroups.textboxFocusEvent.subscribe(function(){parent.widgets.AutoCompGroups.sendQuery("");});
				parent.widgets.AutoCompGroups.itemSelectEvent.subscribe(parent.onEnterGroup, null, parent);
			    
				parent.widgets.DSWorkflows = new YAHOO.util.LocalDataSource(parent.options.workflowDefinitions);
			    parent.widgets.DSWorkflows.responseSchema = {
			        fields : ["title", "name"]
			    };
			    
			    parent.widgets.AutoCompWorkflows = new YAHOO.widget.AutoComplete(parent.id + "-workflow-input", parent.id + "-workflow-container", parent.widgets.DSWorkflows);
			    parent.widgets.AutoCompWorkflows.animVert = true;
			    parent.widgets.AutoCompWorkflows.maxResultsDisplayed = 50;
			    parent.widgets.AutoCompWorkflows.useIFrame = true;
			    parent.widgets.AutoCompWorkflows.applyLocalFilter = true;
			    parent.widgets.AutoCompWorkflows.queryMatchContains = true;
			    parent.widgets.AutoCompWorkflows.minQueryLength = 0;
			    parent.widgets.AutoCompWorkflows.textboxFocusEvent.subscribe(function(){parent.widgets.AutoCompWorkflows.sendQuery("");});
			    parent.widgets.AutoCompWorkflows.itemSelectEvent.subscribe(parent.onWorkflowAdd, null, parent);
				
				var renderActions = function renderActions(elCell, oRecord, oColumn, oData)
				{
					var removeLink = document.createElement("a");
					removeLink.href = '#';
					removeLink.innerHTML = '<div style="text-align:right;">' 
						+ '<img align="top" src="' + Alfresco.constants.URL_RESCONTEXT 
						+ 'components/workflow-shortcuts-admin/document-delete-16.png' + '"/> ' 
						+ parent.msg("wsa.button.remove") + '</div>';

					YAHOO.util.Event.addListener(removeLink, "click", function(e)
					{
						YAHOO.Bubbling.fire('removeWorkflowClick',
						{
							name: oRecord.getData("name")
						});
					}, null, parent);
					elCell.appendChild(removeLink);
				};

				var columnDefinitions =
				[
					{ key: "title", label: parent.msg("wsa.label.workflow"), 
								sortable: true, width: 500 },
					{ key: "actions", label: '', 
								sortable: false, width: 125, formatter: renderActions }
				];

				// DataTable definition
				parent.widgets.dataTable = new YAHOO.widget.DataTable(parent.id + "-datatable", 
					columnDefinitions, parent.widgets.dataSource,
				{
					initialLoad: true,
					initialRequest: 'group=' + parent.cur_group,
					renderLoopSize: 32,
					sortedBy:
					{
						key: "title",
						dir: "asc"
					},
					MSG_EMPTY: parent.msg("wsa.label.no_workflows"),
					MSG_LOADING: parent.msg("wsa.label.loading_workflows"),
					MSG_ERROR: parent.msg("wsa.label.data_error")
				});
			}
		});
		new PanelHandler;

		return this;
	};

	YAHOO.extend(Alvex.WorkflowShortcutsAdmin, Alfresco.ConsoleTool,
	{
		options:
		{
			workflowDefinitions: [],
			groups: []
		},

		onReady: function WSA_onReady()
		{
			Alvex.WorkflowShortcutsAdmin.superclass.onReady.call(this);
		},

		onRemoveWorkflowClick: function WSA_onRemoveWorkflowClick(e, args)
		{
			var workflow = args[1].name;
			var url = Alfresco.constants.PROXY_URI 
				+ "api/alvex/workflow-shortcut/admin/allowed-workflows?group=" 
				+ this.cur_group + "&workflow=" + workflow;
			Alfresco.util.Ajax.request({
				url: url,
				method: Alfresco.util.Ajax.DELETE,
				successCallback:
				{
					fn: this.updateTable,
					scope: this
				},
				failureCallback:
				{
					fn: this.reportError,
					scope: this
				}
			});
		},

		onEnterGroup: function WSA_onEnterGroup(sType, aArgs) 
		{
			this.cur_group = aArgs[1]._oResultData[1];
			this.updateTable();
			this.widgets.AutoCompGroups.sendQuery("");
	    },
	
		onWorkflowAdd: function WSA_onWorkflowAdd(sType, aArgs)
		{
			var workflow = aArgs[1]._oResultData[1];
			var req = { group: this.cur_group, workflow: workflow };
			Alfresco.util.Ajax.request({
				url: Alfresco.constants.PROXY_URI + "api/alvex/workflow-shortcut/admin/allowed-workflows",
				method: Alfresco.util.Ajax.PUT,
				dataObj: req,
				requestContentType: Alfresco.util.Ajax.JSON,
				successCallback:
				{
					fn: this.updateTable,
					scope: this
				},
				failureCallback:
				{
					fn: this.reportError,
					scope: this
				}
			});
		},
		
		updateTable: function WSA_updateTable(resp)
		{
			this.widgets.dataTable.getDataSource().sendRequest(
				'group=' + this.cur_group, 
				{ 
					success: this.widgets.dataTable.onDataReturnInitializeTable, 
					scope: this.widgets.dataTable
				});
		},

		reportError: function WSA_reportError(res)
		{
			var json = Alfresco.util.parseJSON(res.serverResponse.responseText);
			Alfresco.util.PopupManager.displayPrompt(
			{
				title: this.msg("wsa.msg.error"),
				text: this.msg("wsa.msg.error_reason") + '\n' + json.message
			});
		}
	});

})();
