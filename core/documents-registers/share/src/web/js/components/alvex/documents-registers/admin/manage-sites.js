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

	Alvex.DocRegSitesAdmin = function(htmlId)
	{
		this.name = "Alvex.DocregSitesAdmin";
		Alvex.DocRegSitesAdmin.superclass.constructor.call(this, htmlId);

		Alfresco.util.ComponentManager.register(this);

		Alfresco.util.YUILoaderHelper.require(["button", "container", "datasource", "datatable", "json", "history"], 
												this.onComponentsLoaded, this);

		YAHOO.Bubbling.on("siteCreatedEvent", this.onSiteCreated, this);
		YAHOO.Bubbling.on("siteDeleted", this.onSiteDeleted, this);

		var parent = this;

		PanelHandler = function PanelHandler_constructor()
		{
			PanelHandler.superclass.constructor.call(this, "main");
		};
		YAHOO.extend(PanelHandler, Alfresco.ConsolePanelHandler,
		{
			onLoad: function onLoad()
			{
				// Add site button
				parent.widgets.addButton = new YAHOO.widget.Button(parent.id + "-add-site-button");
				parent.widgets.addButton.on("click", parent.onSiteAddClick, null, parent);

				// DataSource setup
				parent.widgets.dataSource = new YAHOO.util.DataSource(Alfresco.constants.PROXY_URI + "api/sites?",
				{
					responseType: YAHOO.util.DataSource.TYPE_JSON,
					responseSchema:
					{
						resultsList: "sites"
					}
				});

				parent.widgets.dataSource.doBeforeParseData = function (oRequest, oFullResponse)
				{
					var updatedResponse = oFullResponse;

					for (var i = 0; i < updatedResponse.length; i++)
						updatedResponse[i].actions = '';

					return {sites: updatedResponse};
				};

				// Hook action events
				var me = parent;
				var fnActionHandler = function fnActionHandler(layer, args)
				{
					var owner = YAHOO.Bubbling.getOwnerByTagName(args[1].anchor, "div");
					if (owner !== null)
					{
						if (typeof me[owner.className] == "function")
						{
							args[1].stop = true;
							var asset = me.widgets.dataTable.getRecord(args[1].target.offsetParent).getData();
							me[owner.className].call(me, asset, owner);
						}
					}
					return true;
				};
				YAHOO.Bubbling.addDefaultAction(parent.id + "-action-link", fnActionHandler, true);

				var columnDefinitions =
				[
					{ 
						key: "title", label: parent.msg("drsa.label.site"), 
						sortable: true, resizeable: true, width: 500, 
						formatter: parent.renderSiteNameField
					},
					{ 
						key: "actions", label: '', 
						sortable: false, resizeable: true, width: 125, 
						formatter: parent.renderActions 
					}
				];

				// DataTable definition
				parent.widgets.dataTable = new YAHOO.widget.DataTable(parent.id + "-datatable", 
									columnDefinitions, parent.widgets.dataSource,
				{
					initialLoad: true,
					initialRequest: 'size=250&spf=documents-register-dashboard',
					renderLoopSize: 32,
					sortedBy:
					{
						key: "title",
						dir: "asc"
					},
					MSG_EMPTY: parent.msg("drsa.label.no_sites")
				});
				
				// Enable row highlighting
				parent.widgets.dataTable.subscribe("rowMouseoverEvent", parent.onEventHighlightRow, parent, true);
				parent.widgets.dataTable.subscribe("rowMouseoutEvent", parent.onEventUnhighlightRow, parent, true);
				
				parent.widgets.dataTable.siteManage = parent;
			}
		});
		new PanelHandler;

		return this;
	};

	YAHOO.extend(Alvex.DocRegSitesAdmin, Alfresco.ConsoleTool,
	{
		options:
		{
		},

		onReady: function ()
		{
			Alvex.DocRegSitesAdmin.superclass.onReady.call(this);
		},

		onDeleteSite: function (obj)
		{
			// Display the delete dialog for the site
			Alfresco.module.getDeleteSiteInstance().show(
			{
				site: obj
			});
		},

		onSiteAddClick: function ()
		{
			this.widgets.createSiteDialog = Alvex.getCreateDocRegSiteInstance();
			this.widgets.createSiteDialog.show();
		},

		onSiteCreated: function ()
		{
			this.updateTable();
		},

		onSiteDeleted: function ()
		{
			this.updateTable();
		},

		updateTable: function (resp)
		{
			this.widgets.dataTable.getDataSource().sendRequest(
				'size=250&spf=documents-register-dashboard', 
				{ 
					success: this.widgets.dataTable.onDataReturnInitializeTable, 
					scope: this.widgets.dataTable
				});
		},

		renderSiteNameField: function (elCell, oRecord, oColumn, oData)
		{
			var shortName = oRecord._oData.shortName;
			var title = oRecord._oData.title;
			var link = '<a href="' + Alfresco.constants.URL_PAGECONTEXT 
							+ 'site/' + shortName + '/dashboard">' + title + '</a>';
			elCell.innerHTML = link;
		},

		renderActions: function (elCell, oRecord, oColumn, oData)
		{
			var id = this.siteManage.id;
			var html = '<div id="' + id + '-actions-' + oRecord.getId() + '" class="hidden action">';
			
			var msg = this.siteManage.msg('button.delete');
			var clb = 'onDeleteSite';
			html += '<div class="' + clb + '"><a href="" ' 
					+ 'class="alvex-site-manage-action-link ' + id + '-action-link" ' 
					+ 'title="' + msg +'"><span>' + msg + '</span></a></div>';
			html += '</div>';
			elCell.innerHTML = html;
		},

		onEventHighlightRow: function (oArgs)
		{
			// Call through to get the row highlighted by YUI
			// this.widgets.dataTable.onEventHighlightRow.call(this.widgets.dataTable, oArgs);

			var elActions = Dom.get(this.id + "-actions-" + oArgs.target.id);
			Dom.removeClass(elActions, "hidden");
		},
		
		onEventUnhighlightRow: function (oArgs)
		{
			// Call through to get the row unhighlighted by YUI
			// this.widgets.dataTable.onEventUnhighlightRow.call(this.widgets.dataTable, oArgs);

			var elActions = Dom.get(this.id + "-actions-" + (oArgs.target.id));
			Dom.addClass(elActions, "hidden");
		},

		reportError: function (res)
		{
			var json = Alfresco.util.parseJSON(res.serverResponse.responseText);
			Alfresco.util.PopupManager.displayPrompt(
			{
				title: this.msg("drsa.msg.error"),
				text: this.msg("drsa.msg.error_reason") + '\n' + json.message
			});
		}

	});

})();
