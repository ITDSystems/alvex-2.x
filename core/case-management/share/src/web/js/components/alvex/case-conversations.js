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
 * Case Workflows component.
 *
 * @namespace Alvex
 * @class Alvex.CaseConversations
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
	var PREFERENCES_WORKFLOWS_DASHLET = "org.alfresco.share.caseworkflows.dashlet";
	var PREFERENCES_WORKFLOWS_DASHLET_FILTER = PREFERENCES_WORKFLOWS_DASHLET + ".filter";
	var PREFERENCES_WORKFLOWS_DASHLET_SORTER = PREFERENCES_WORKFLOWS_DASHLET + ".sorter";

	/**
	* Dashboard CaseConversations constructor.
	*
	* @param {String} htmlId The HTML id of the parent element
	* @return {Alvex.CaseConversations} The new component instance
	* @constructor
	*/
	Alvex.CaseConversations = function CaseConversations_constructor(htmlId)
	{
		Alvex.CaseConversations.superclass.constructor.call(this, "Alvex.CaseConversations", htmlId, 
			["button", "container", "datasource", "datatable", "paginator", "history", "animation"]);

		// Services
		this.services.preferences = new Alfresco.service.Preferences();

		return this;
	};

	/**
	* Extend from Alfresco.component.Base
	*/
	YAHOO.extend(Alvex.CaseConversations, Alfresco.component.Base);

	/**
	* Augment prototype with main class implementation, ensuring overwrite is enabled
	*/
	YAHOO.lang.augmentObject(Alvex.CaseConversations.prototype,
	{
		/**
		* Object container for initialization options
		*
		* @property options
		* @type object
		*/
		options:
		{
		},

		/**
		* Fired by YUI when parent element is available for scripting
		* @method onReady
		*/
		onReady: function CaseConversations_onReady()
		{
			var me = this;
			Alfresco.util.Ajax.jsonGet(
			{
				url: Alfresco.constants.PROXY_URI + "api/alvex/case/" + encodeURIComponent(Alfresco.constants.SITE) + "/conversations/container",
				successCallback:
				{
					fn: function(resp)
					{
						me.options.containerRef = resp.json.ref;
						me.widgets.addItemButton = Alfresco.util.createYUIButton(me, "addItem-button", me.onAddItemClick, {});
						Dom.removeClass(Selector.query(".hidden", me.id + "-body", true), "hidden");
					},
					scope: this
				}
			});
			
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

			var url = Alfresco.constants.PROXY_URI + YAHOO.lang.substitute("api/alvex/case/{caseId}/conversations",
			{
				caseId: encodeURIComponent(Alfresco.constants.SITE),
			});

			/**
			* Create datatable with a simple pagination that only displays number of results.
			* The pagination is handled in the "base" data source url and can't be changed in the dashlet
			*/
			this.widgets.alfrescoDataTable = new Alfresco.util.DataTable(
			{
				dataSource:
				{
					url: url
				},
				dataTable:
				{
					container: this.id + "-conversations",
					columnDefinitions:
					[
						{ key: "type", sortable: false, formatter: this.bind(this.renderCellIcon), width:90 },
						{ key: "summary", sortable: false, formatter: this.bind(this.renderCellInfo) },
						{ key: "actions", sortable: false, formatter: this.bind(this.renderCellActions), width:90 }
					],
					config:
					{
						MSG_EMPTY: this.msg("message.noConversations")
					}
				}
			});

			// Override DataTable function to set custom empty message
			var me = this,
				dataTable = this.widgets.alfrescoDataTable.getDataTable(),
				original_doBeforeLoadData = dataTable.doBeforeLoadData;

			dataTable.doBeforeLoadData = function CaseConversations_doBeforeLoadData(sRequest, oResponse, oPayload)
			{
				
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
		
		onAddItemClick: function(ev, obj)
		{
			var templateUrl = YAHOO.lang.substitute(
					Alfresco.constants.URL_SERVICECONTEXT 
						+ "components/form?itemKind={itemKind}&itemId={itemId}&mode={mode}" 
						+ "&submitType={submitType}&destination={destination}&showCancelButton=true",
				{
					itemKind: "type",
					itemId: "alvexcm:conversationItem",
					destination: this.options.containerRef,
					mode: "create",
					submitType: "json"
				});

			// Intercept before dialog show
			var doBeforeDialogShow = function(p_form, p_dialog)
			{
				Alfresco.util.populateHTML(
					[ p_dialog.id + "-dialogTitle", this.msg("new-item.title") ],
					[ p_dialog.id + "-dialogHeader", this.msg("new-item.title") ]
				);
			};

			// Using Forms Service, so always create new instance
			var addItemDialog = new Alfresco.module.SimpleDialog(this.id + "-addItemDialog");

			addItemDialog.setOptions(
			{
				width: "50em",
				templateUrl: templateUrl,
				actionUrl: null,
				destroyOnHide: true,

				doBeforeDialogShow:
				{
					fn: doBeforeDialogShow,
					scope: this
				},
				onSuccess:
				{
					fn: function(response, p_obj)
					{
						
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

		onEditItem: function(item)
		{
			var me = this;
			var templateUrl = YAHOO.lang.substitute(
					Alfresco.constants.URL_SERVICECONTEXT 
						+ "components/form?itemKind={itemKind}&itemId={itemId}&mode={mode}" 
						+ "&submitType={submitType}&showCancelButton=true",
				{
					itemKind: "node",
					itemId: item.ref,
					mode: "edit",
					submitType: "json"
				});

			// Intercept before dialog show
			var doBeforeDialogShow = function(p_form, p_dialog)
			{
				Alfresco.util.populateHTML(
					[ p_dialog.id + "-dialogTitle", this.msg("edit-item.title") ],
					[ p_dialog.id + "-dialogHeader", this.msg("edit-item.title") ]
				);
			};

			// Using Forms Service, so always create new instance
			var editItemDialog = new Alfresco.module.SimpleDialog(this.id + "-editItemDialog");

			editItemDialog.setOptions(
			{
				width: "50em",
				templateUrl: templateUrl,
				actionUrl: null,
				destroyOnHide: true,

				doBeforeDialogShow:
				{
					fn: doBeforeDialogShow,
					scope: this
				},
				onSuccess:
				{
					fn: function(response, p_obj)
					{
						me.widgets.alfrescoDataTable.loadDataTable();
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

		onViewItem: function(item)
		{
			var me = this;
			var templateUrl = YAHOO.lang.substitute(
					Alfresco.constants.URL_SERVICECONTEXT 
						+ "components/form?itemKind={itemKind}&itemId={itemId}&mode={mode}" 
						+ "&submitType={submitType}&showCancelButton=true",
				{
					itemKind: "node",
					itemId: item.ref,
					mode: "view",
					submitType: "json"
				});

			// Intercept before dialog show
			var doBeforeDialogShow = function(p_form, p_dialog)
			{
				Alfresco.util.populateHTML(
					[ p_dialog.id + "-dialogTitle", this.msg("view-item.title") ],
					[ p_dialog.id + "-dialogHeader", this.msg("view-item.title") ]
				);
			};

			// Using Forms Service, so always create new instance
			var viewItemDialog = new Alvex.SimpleDialog(this.id + "-viewItemDialog");

			viewItemDialog.setOptions(
			{
				width: "50em",
				templateUrl: templateUrl,
				actionUrl: null,
				destroyOnHide: true,
				formsServiceAvailable: false,

				doBeforeDialogShow:
				{
					fn: doBeforeDialogShow,
					scope: this
				},
				onSuccess:
				{
					fn: function(response, p_obj)
					{
						me.widgets.alfrescoDataTable.loadDataTable();
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
		
		onDeleteItem: function(item)
		{
			var me = this;
			Alfresco.util.PopupManager.displayPrompt(
			{
				title: me.msg("delete-item.title"),
				text: me.msg("message.delete-item",  Alfresco.util.encodeHTML(item.summary)),
				noEscape: true,
				buttons: [
				{
					text: me.msg("button.delete"),
					handler: function()
					{
						var deleteUrl = Alfresco.constants.PROXY_URI + 'api/alvex/case/conversation/' 
										+ Alfresco.util.NodeRef( item.ref ).uri + '?alf_method=DELETE';
						Alfresco.util.Ajax.jsonRequest({
							url: deleteUrl,
							method: Alfresco.util.Ajax.POST,
							successCallback:
							{
								fn: function (resp)
								{
									this.destroy();
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
		* Priority & pooled icons custom datacell formatter
		*/
		renderCellIcon: function CaseConversations_onReady_renderCellIcons(elCell, oRecord, oColumn, oData)
		{
			var data = oRecord.getData();
			var desc = '<div style="width:100px; text-align:center;"><img src="/share/res/components/images/' + data.type + '-64.png" /></div>';
			elCell.innerHTML = desc;
		},

		/**
		* Task info custom datacell formatter
		*/
		renderCellInfo: function CaseConversations_onReady_renderCellTaskInfo(elCell, oRecord, oColumn, oData)
		{
			var data = oRecord.getData();
			var info = '<h3>Topic: ' + data.summary + '</h3>';
			info += '<p>Date: ' + Alfresco.util.formatDate(Alfresco.util.fromISO8601(data.date), "dd.mm.yyyy") + '</p>';
			info += '<p>Participants: ';
			for(var i in data.people)
			{
				info += '<a href="' + Alfresco.constants.URL_PAGECONTEXT 
						+ 'user/' + data.people[i].userName + '/profile">' 
						+ data.people[i].name + '</a> ';
			}
			info += '</p>';
			info += '<p>Files: ';
			for(var i in data.files)
			{
				info += '<a href="' + Alfresco.constants.URL_PAGECONTEXT + 'site/' 
						+ Alfresco.constants.SITE + '/document-details?nodeRef=' + data.files[i].ref + '">' 
						+ data.files[i].name + '</a> ';
			}
			info += '</p>';
			elCell.innerHTML = info;
		},

		/**
		* Actions custom datacell formatter
		*/
		renderCellActions:function CaseConversations_onReady_renderCellActions(elCell, oRecord, oColumn, oData)
		{
			var data = oRecord.getData();

			var desc = '<div class="action">';
			
			var	msg = this.msg('action.viewItem');
			var clb = 'onViewItem';
			desc += '<div class="' + clb + '">' 
					+ '<a href="" ' + 'class="alvex-case-conversations-action '+ this.id + '-action-link" ' 
					+ 'title="' + msg +'"><span>' + msg + '</span></a></div>';
			
			msg = this.msg('action.editItem');
			clb = 'onEditItem';
			desc += '<div class="' + clb + '">' 
					+ '<a href="" ' + 'class="alvex-case-conversations-action '+ this.id + '-action-link" ' 
					+ 'title="' + msg +'"><span>' + msg + '</span></a></div>';
			
			msg = this.msg('action.deleteItem');
			clb = 'onDeleteItem';
			desc += '<div class="' + clb + '">' 
					+ '<a href="" ' + 'class="alvex-case-conversations-action '+ this.id + '-action-link" ' 
					+ 'title="' + msg +'"><span>' + msg + '</span></a></div>';

			desc += '</div>';

			elCell.innerHTML = desc;
		}

	});
})();