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
 * @class Alvex.ProjectContacts
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
	* Dashboard ProjectContacts constructor.
	*
	* @param {String} htmlId The HTML id of the parent element
	* @return {Alvex.ProjectContacts} The new component instance
	* @constructor
	*/
	Alvex.ProjectContacts = function ProjectContacts_constructor(htmlId)
	{
		Alvex.ProjectContacts.superclass.constructor.call(this, "Alvex.ProjectContacts", htmlId, 
			["button", "container", "datasource", "datatable", "paginator", "history", "animation"]);

		// Services
		this.services.preferences = new Alfresco.service.Preferences();

		return this;
	};

	/**
	* Extend from Alfresco.component.Base
	*/
	YAHOO.extend(Alvex.ProjectContacts, Alfresco.component.Base);

	/**
	* Augment prototype with main class implementation, ensuring overwrite is enabled
	*/
	YAHOO.lang.augmentObject(Alvex.ProjectContacts.prototype,
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
		onReady: function ProjectContacts_onReady()
		{
			var me = this;
			Alfresco.util.Ajax.jsonGet(
			{
				url: Alfresco.constants.PROXY_URI + "api/alvex/project/" + encodeURIComponent(Alfresco.constants.SITE) + "/contacts/container",
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

			var url = Alfresco.constants.PROXY_URI + YAHOO.lang.substitute("api/alvex/project/{projectId}/contacts",
			{
				projectId: encodeURIComponent(Alfresco.constants.SITE),
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
					container: this.id + "-contacts",
					columnDefinitions:
					[
						{ key: "ref", sortable: false, formatter: this.bind(this.renderCellIcon), width:56 },
						{ key: "firstName", sortable: false, formatter: this.bind(this.renderCellInfo) },
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

			dataTable.doBeforeLoadData = function ProjectContacts_doBeforeLoadData(sRequest, oResponse, oPayload)
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
					itemId: "alvexcm:externalContact",
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

			var me = this;
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
						var deleteUrl = Alfresco.constants.PROXY_URI + 'api/alvex/project/contact/' 
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
		renderCellIcon: function ProjectContacts_onReady_renderCellIcons(elCell, oRecord, oColumn, oData)
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
			var desc = '<div><img style="width:48px;" src="/share/res/components/images/no-user-photo-64.png" /></div>';
			elCell.innerHTML = desc;
		},

		/**
		* Task info custom datacell formatter
		*/
		renderCellInfo: function ProjectContacts_onReady_renderCellTaskInfo(elCell, oRecord, oColumn, oData)
		{
			var data = oRecord.getData();
			if (data.isInfo)
			{
				elCell.innerHTML = '<div class="empty"><h3>' + data.title + '</h3>' 
							+ '<span>' + data.description + '</span></div>';
				return;
			}
			var info = '<h3>' + data.firstName + ' ' + data.lastName + '</h3>';
			info += '<p>' + data.company + ', ' + data.position + '</p>';
			elCell.innerHTML = info;
		},

		/**
		* Actions custom datacell formatter
		*/
		renderCellActions:function ProjectContacts_onReady_renderCellActions(elCell, oRecord, oColumn, oData)
		{
			var data = oRecord.getData();
			if (data.isInfo)
			{
				oColumn.width = 0;
				Dom.setStyle(elCell, "width", oColumn.width + "px");
				Dom.setStyle(elCell.parentNode, "width", oColumn.width + "px");
				return;
			}

			var desc = '<div class="action">';
			
			var	msg = this.msg('action.viewItem');
			var clb = 'onViewItem';
			desc += '<div class="' + clb + '">' 
					+ '<a href="" ' + 'class="alvex-project-contacts-action '+ this.id + '-action-link" ' 
					+ 'title="' + msg +'"><span>' + msg + '</span></a></div>';
			
			msg = this.msg('action.editItem');
			clb = 'onEditItem';
			desc += '<div class="' + clb + '">' 
					+ '<a href="" ' + 'class="alvex-project-contacts-action '+ this.id + '-action-link" ' 
					+ 'title="' + msg +'"><span>' + msg + '</span></a></div>';
			
			msg = this.msg('action.deleteItem');
			clb = 'onDeleteItem';
			desc += '<div class="' + clb + '">' 
					+ '<a href="" ' + 'class="alvex-project-contacts-action '+ this.id + '-action-link" ' 
					+ 'title="' + msg +'"><span>' + msg + '</span></a></div>';

			desc += '</div>';

			elCell.innerHTML = desc;
		}

	});
})();