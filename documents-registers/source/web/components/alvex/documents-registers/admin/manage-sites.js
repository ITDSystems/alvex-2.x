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

		YAHOO.Bubbling.on("removeSiteClick", this.onRemoveSiteClick, this);
		YAHOO.Bubbling.on("siteCreatedEvent", this.onSiteCreated, this);

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

				parent.widgets.dataSource.doBeforeParseData = function WSA_doBeforeParseData(oRequest, oFullResponse)
				{
					var updatedResponse = oFullResponse;

					for (var i = 0; i < updatedResponse.length; i++)
						updatedResponse[i].actions = '';

					return {sites: updatedResponse};
				};

				var renderActions = function renderActions(elCell, oRecord, oColumn, oData)
				{
					// var removeLink = document.createElement("a");
					// removeLink.href = '#';
					// removeLink.innerHTML = '<div style="text-align:right;"><img align="top" src="' 
					// 		+ Alfresco.constants.URL_RESCONTEXT 
					// 		+ 'components/committees-sites-admin/document-delete-16.png' + '"/> '
					// 		+ parent.msg("csa.button.remove") + '</div>';

					// YAHOO.util.Event.addListener(removeLink, "click", function(e)
					// {
					// 	YAHOO.Bubbling.fire('removeSiteClick',
					// 	{
					// 		shortName: oRecord.getData("shortName")
					// 	});
					// }, null, parent);
					// elCell.appendChild(removeLink);
				};

				var columnDefinitions =
				[
					{ key: "title", label: parent.msg("drsa.label.site"), sortable: true, width: 500 },
					{ key: "actions", label: '', sortable: false, width: 125, formatter: renderActions }
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

		onReady: function CSA_onReady()
		{
			Alvex.DocRegSitesAdmin.superclass.onReady.call(this);
		},

		onRemoveSiteClick: function CSA_onRemoveSiteClick(e, args)
		{
			var site = args[1].shortName;
			// Not implemented - use default site delete options
		},

		onSiteAddClick: function CSA_onSiteAddClick()
		{
			this.widgets.createSiteDialog = Alvex.getCreateDocRegSiteInstance();
			this.widgets.createSiteDialog.show();
		},

		onSiteCreated: function CSA_onSiteCreated()
		{
			this.updateTable();
		},

		updateTable: function WSA_updateTable(resp)
		{
			this.widgets.dataTable.getDataSource().sendRequest(
				'size=250&spf=documents-register-dashboard', 
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
				title: this.msg("drsa.msg.error"),
				text: this.msg("drsa.msg.error_reason") + '\n' + json.message
			});
		}

	});

})();
