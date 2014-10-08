/**
 * Copyright © 2014 ITD Systems
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

	Alvex.MasterDataAdmin = function(htmlId)
	{
		this.name = "Alvex.MasterDataAdmin";
		Alvex.MasterDataAdmin.superclass.constructor.call(this, htmlId);

		Alfresco.util.ComponentManager.register(this);

		Alfresco.util.YUILoaderHelper.require(["button", "container", "datasource", "datatable", "json", "history"], 
												this.onComponentsLoaded, this);

		//YAHOO.Bubbling.on("siteCreatedEvent", this.onSiteCreated, this);
		//YAHOO.Bubbling.on("siteDeleted", this.onSiteDeleted, this);

		var parent = this;

		PanelHandler = function PanelHandler_constructor()
		{
			PanelHandler.superclass.constructor.call(this, "main");
		};
		YAHOO.extend(PanelHandler, Alfresco.ConsolePanelHandler,
		{
			onLoad: function onLoad()
			{
				parent.initUI();
			}
		});
		new PanelHandler;

		return this;
	};

	YAHOO.extend(Alvex.MasterDataAdmin, Alfresco.ConsoleTool,
	{
		options:
		{
		},

		onReady: function ()
		{
			Alvex.MasterDataAdmin.superclass.onReady.call(this);
		},
				
		initUI: function ()
		{
			this.widgets.addDatalistButton = new YAHOO.widget.Button(this.id + "-add-datalist-button");
			this.widgets.addDatalistButton.on("click", this.onDatalistAddClick, null, this);
			
			this.widgets.addRestJsonButton = new YAHOO.widget.Button(this.id + "-add-rest-json-button");
			this.widgets.addRestJsonButton.on("click", this.onRestJsonAddClick, null, this);
			
			this.widgets.addRestXmlButton = new YAHOO.widget.Button(this.id + "-add-rest-xml-button");
			this.widgets.addRestXmlButton.on("click", this.onRestXmlAddClick, null, this);

			// DataSource setup
			this.widgets.dataSource = new YAHOO.util.DataSource(Alfresco.constants.PROXY_URI 
					+ "api/alvex/masterdata/sources",
			{
				responseType: YAHOO.util.DataSource.TYPE_JSON,
				responseSchema:
				{
					resultsList: "dataSources"
				}
			});

			this.widgets.dataSource.doBeforeParseData = function (oRequest, oFullResponse)
			{
				var updatedResponse = oFullResponse;
				for (var i = 0; i < updatedResponse.length; i++)
					updatedResponse[i].actions = '';
				return updatedResponse;
			};

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
						var asset = me.widgets.dataTable.getRecord(args[1].target.offsetParent).getData();
						me[owner.className].call(me, asset, owner);
					}
				}
				return true;
			};
			YAHOO.Bubbling.addDefaultAction(this.id + "-action-link", fnActionHandler, true);

			var columnDefinitions =
			[
				{ 
					key: "name", label: this.msg("masterdata.source.name"), 
					sortable: true, resizeable: true, width: 300, 
					formatter: this.renderNameField
				},
				{ 
					key: "type", label: this.msg("masterdata.source.type"), 
					sortable: true, resizeable: true, width: 200, 
					formatter: this.renderTypeField
				},
				{ 
					key: "actions", label: '', 
					sortable: false, resizeable: true, width: 125, 
					formatter: this.renderActions 
				}
			];

			// DataTable definition
			this.widgets.dataTable = new YAHOO.widget.DataTable(this.id + "-datatable", 
								columnDefinitions, this.widgets.dataSource,
			{
				initialLoad: true,
				initialRequest: '',
				renderLoopSize: 32,
				sortedBy:
				{
					key: "name",
					dir: "asc"
				},
				MSG_EMPTY: this.msg("masterdata.source.noSources")
			});
				
			// Enable row highlighting
			this.widgets.dataTable.subscribe("rowMouseoverEvent", this.onEventHighlightRow, this, true);
			this.widgets.dataTable.subscribe("rowMouseoutEvent", this.onEventUnhighlightRow, this, true);
			
			this.widgets.dataTable.masterDataManage = me;
		},

		onDeleteSource: function (source)
		{
			var me = this;
			Alfresco.util.PopupManager.displayPrompt(
			{
				title: this.msg("masterdata.deleteSource.title"),
				text: this.msg("masterdata.deleteSource.message",  Alfresco.util.encodeHTML(source.name)),
				buttons: [
				{
					text: this.msg("button.delete"),
					handler: function()
					{
						// Delete org chart unit
						Alfresco.util.Ajax.jsonRequest({
							url: Alfresco.constants.PROXY_URI 
								+ "api/alvex/masterdata/sources/" 
								+ encodeURIComponent(source.name) + "?alf_method=DELETE",
							method: Alfresco.util.Ajax.POST,
							dataObj: null,
							successCallback:
							{
								fn: function (response)
								{
									me.updateTable();
								},
								scope:this
							},
							failureCallback:
							{
								fn: function (response)
								{
									if (response.serverResponse.statusText)
										Alfresco.util.PopupManager.displayMessage({ 
											text: response.serverResponse.statusText 
										});
								},
								scope:this
							}
						});
						this.destroy();
					}
				},
				{
					text: this.msg("button.cancel"),
					handler: function()
					{
						this.destroy();
					},
					isDefault: true
				}]
			});
		},

		onDatalistAddClick: function ()
		{
			// Intercept before dialog show
			var doBeforeDialogShow = function(p_form, p_dialog)
			{
				Alfresco.util.populateHTML(
					[ p_dialog.id + "-dialogTitle", this.msg("masterdata.new.datalist") ],
					[ p_dialog.id + "-dialogHeader", this.msg("masterdata.new.datalist") ]
				);
			};
			
			var templateUrl = YAHOO.lang.substitute(Alfresco.constants.URL_SERVICECONTEXT 
					+ "components/form?itemKind={itemKind}&itemId={itemId}" 
					+ "&mode={mode}&submitType={submitType}&showCancelButton=true",
				{
					itemKind: "type",
					itemId: "alvexmd:datalistMasterDataSource",
					mode: "create",
					submitType: "json"
				});
	
			// Using Forms Service, so always create new instance
			var createDialog = new Alvex.SimpleDialog(this.id + "-create-dialog");
			createDialog.setOptions(
			{
				//width: "50em",
				templateUrl: templateUrl,
				actionUrl:  Alfresco.constants.PROXY_URI + "api/alvex/masterdata/sources", 
				destroyOnHide: true,
				doBeforeDialogShow:
				{
					fn: doBeforeDialogShow,
					scope: this
				},
				doBeforeAjaxRequest:
				{
					fn: function(config)
					{
						config.dataObj["type"] = "datalist";
						config.dataObj["name"] = config.dataObj["prop_cm_name"];
						config.dataObj["datalistRef"] = config.dataObj["assoc_alvexmd_masterDataStorage"];
						config.dataObj["valueColumn"] = config.dataObj["prop_alvexmd_datalistColumnValueField"];
						config.dataObj["labelColumn"] = config.dataObj["prop_alvexmd_datalistColumnLabelField"];
						return true;
					},
					scope: this
				},
				onSuccess:
				{
					fn: function(response)
					{
						this.updateTable();
					},
					scope: this
				},
				onFailure:
				{
					fn: function(response)
					{
						if (response.serverResponse.statusText)
							Alfresco.util.PopupManager.displayMessage({ 
								text: response.serverResponse.statusText 
							});
					},
					scope: this
				}
			}).show();
		},

		onRestJsonAddClick: function ()
		{
			// Intercept before dialog show
			var doBeforeDialogShow = function(p_form, p_dialog)
			{
				Alfresco.util.populateHTML(
					[ p_dialog.id + "-dialogTitle", this.msg("masterdata.new.restjson") ],
					[ p_dialog.id + "-dialogHeader", this.msg("masterdata.new.restjson") ]
				);
			};
			
			var templateUrl = YAHOO.lang.substitute(Alfresco.constants.URL_SERVICECONTEXT 
					+ "components/form?itemKind={itemKind}&itemId={itemId}" 
					+ "&mode={mode}&submitType={submitType}&showCancelButton=true",
				{
					itemKind: "type",
					itemId: "alvexmd:restJsonMasterDataSource",
					mode: "create",
					submitType: "json"
				});
	
			// Using Forms Service, so always create new instance
			var createDialog = new Alvex.SimpleDialog(this.id + "-create-dialog");
			createDialog.setOptions(
			{
				//width: "50em",
				templateUrl: templateUrl,
				actionUrl:  Alfresco.constants.PROXY_URI + "api/alvex/masterdata/sources", 
				destroyOnHide: true,
				doBeforeDialogShow:
				{
					fn: doBeforeDialogShow,
					scope: this
				},
				doBeforeAjaxRequest:
				{
					fn: function(config)
					{
						config.dataObj["type"] = "restJSON";
						config.dataObj["name"] = config.dataObj["prop_cm_name"];
						config.dataObj["masterDataURL"] = config.dataObj["prop_alvexmd_masterDataURL"];
						config.dataObj["dataRootJsonQuery"] = config.dataObj["prop_alvexmd_dataRootJsonQuery"];
						config.dataObj["valueField"] = config.dataObj["prop_alvexmd_valueJsonField"];
						config.dataObj["labelField"] = config.dataObj["prop_alvexmd_labelJsonField"];
						config.dataObj["caching"] = config.dataObj["prop_alvexmd_caching"];
						return true;
					},
					scope: this
				},
				onSuccess:
				{
					fn: function(response)
					{
						this.updateTable();
					},
					scope: this
				},
				onFailure:
				{
					fn: function(response)
					{
						if (response.serverResponse.statusText)
							Alfresco.util.PopupManager.displayMessage({ 
								text: response.serverResponse.statusText 
							});
					},
					scope: this
				}
			}).show();
		},


		onRestXmlAddClick: function ()
		{
			// Intercept before dialog show
			var doBeforeDialogShow = function(p_form, p_dialog)
			{
				Alfresco.util.populateHTML(
					[ p_dialog.id + "-dialogTitle", this.msg("masterdata.new.restxml") ],
					[ p_dialog.id + "-dialogHeader", this.msg("masterdata.new.restxml") ]
				);
			};
			
			var templateUrl = YAHOO.lang.substitute(Alfresco.constants.URL_SERVICECONTEXT 
					+ "components/form?itemKind={itemKind}&itemId={itemId}" 
					+ "&mode={mode}&submitType={submitType}&showCancelButton=true",
				{
					itemKind: "type",
					itemId: "alvexmd:restXmlMasterDataSource",
					mode: "create",
					submitType: "json"
				});
	
			// Using Forms Service, so always create new instance
			var createDialog = new Alvex.SimpleDialog(this.id + "-create-dialog");
			createDialog.setOptions(
			{
				//width: "50em",
				templateUrl: templateUrl,
				actionUrl:  Alfresco.constants.PROXY_URI + "api/alvex/masterdata/sources", 
				destroyOnHide: true,
				doBeforeDialogShow:
				{
					fn: doBeforeDialogShow,
					scope: this
				},
				doBeforeAjaxRequest:
				{
					fn: function(config)
					{
						config.dataObj["type"] = "restXML";
						config.dataObj["name"] = config.dataObj["prop_cm_name"];
						config.dataObj["masterDataURL"] = config.dataObj["prop_alvexmd_masterDataURL"];
						config.dataObj["dataRootXpathQuery"] = config.dataObj["prop_alvexmd_dataRootXpathQuery"];
						config.dataObj["valueXpath"] = config.dataObj["prop_alvexmd_valueXpath"];
						config.dataObj["labelXpath"] = config.dataObj["prop_alvexmd_labelXpath"];
						config.dataObj["caching"] = config.dataObj["prop_alvexmd_caching"];
						return true;
					},
					scope: this
				},
				onSuccess:
				{
					fn: function(response)
					{
						this.updateTable();
					},
					scope: this
				},
				onFailure:
				{
					fn: function(response)
					{
						if (response.serverResponse.statusText)
							Alfresco.util.PopupManager.displayMessage({ 
								text: response.serverResponse.statusText 
							});
					},
					scope: this
				}
			}).show();
		},
		
		onViewSource: function (source)
		{
			// Intercept before dialog show
			var doBeforeDialogShow = function(p_form, p_dialog)
			{
				Alfresco.util.populateHTML(
					[ p_dialog.id + "-dialogTitle", this.msg("masterdata.source") ]
				);
			};
			
			var templateUrl = YAHOO.lang.substitute(Alfresco.constants.URL_SERVICECONTEXT 
					+ "components/form?itemKind={itemKind}&itemId={itemId}" 
					+ "&mode={mode}&submitType={submitType}&showCancelButton=true",
				{
					itemKind: "node",
					itemId: source.nodeRef,
					mode: "view",
					submitType: "json"
				});
	
			// Using Forms Service, so always create new instance
			var viewDialog = new Alvex.SimpleDialog(this.id + "-view-dialog");
			viewDialog.setOptions(
			{
				//width: "50em",
				templateUrl: templateUrl,
				actionUrl:  null, 
				destroyOnHide: true,
				formsServiceAvailable: false,
				doBeforeDialogShow:
				{
					fn: doBeforeDialogShow,
					scope: this
				}
			}).show();
		},
		
		onEditSource: function (source)
		{
			// Intercept before dialog show
			var doBeforeDialogShow = function(p_form, p_dialog)
			{
				Alfresco.util.populateHTML(
					[ p_dialog.id + "-dialogTitle", this.msg("masterdata.source") ]
				);
			};
			
			var templateUrl = YAHOO.lang.substitute(Alfresco.constants.URL_SERVICECONTEXT 
					+ "components/form?itemKind={itemKind}&itemId={itemId}" 
					+ "&mode={mode}&submitType={submitType}&showCancelButton=true",
				{
					itemKind: "node",
					itemId: source.nodeRef,
					mode: "edit",
					submitType: "json"
				});
	
			// Using Forms Service, so always create new instance
			var viewDialog = new Alvex.SimpleDialog(this.id + "-view-dialog");
			viewDialog.setOptions(
			{
				//width: "50em",
				templateUrl: templateUrl,
				actionUrl:  null, 
				destroyOnHide: true,
				doBeforeDialogShow:
				{
					fn: doBeforeDialogShow,
					scope: this
				},
				onSuccess:
				{
					fn: function(response)
					{
						this.updateTable();
					},
					scope: this
				},
			}).show();
		},

		updateTable: function (resp)
		{
			this.widgets.dataTable.getDataSource().sendRequest('', 
				{ 
					success: this.widgets.dataTable.onDataReturnInitializeTable, 
					scope: this.widgets.dataTable
				});
		},

		renderNameField: function (elCell, oRecord, oColumn, oData)
		{
			elCell.innerHTML = oRecord.getData("name");
		},
		
		renderTypeField: function (elCell, oRecord, oColumn, oData)
		{
			elCell.innerHTML = oRecord.getData("type");
		},

		renderActions: function (elCell, oRecord, oColumn, oData)
		{
			var id = this.masterDataManage.id;
			var html = '<div id="' + id + '-actions-' + oRecord.getId() + '" class="hidden action">';

			var msg = this.masterDataManage.msg('button.view');
			var clb = 'onViewSource';
			html += '<div class="' + clb + '"><a href="" ' 
					+ 'class="alvex-masterdata-admin-action-link ' + id + '-action-link" ' 
					+ 'title="' + msg +'"><span>' + msg + '</span></a></div>';
			
			msg = this.masterDataManage.msg('button.edit');
			clb = 'onEditSource';
			html += '<div class="' + clb + '"><a href="" ' 
					+ 'class="alvex-masterdata-admin-action-link ' + id + '-action-link" ' 
					+ 'title="' + msg +'"><span>' + msg + '</span></a></div>';
			
			msg = this.masterDataManage.msg('button.delete');
			clb = 'onDeleteSource';
			html += '<div class="' + clb + '"><a href="" ' 
					+ 'class="alvex-masterdata-admin-action-link ' + id + '-action-link" ' 
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
				title: this.msg("masterdata.msg.error"),
				text: this.msg("masterdata.msg.error_reason") + '\n' + json.message
			});
		}

	});

})();
