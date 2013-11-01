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
	//var PREFERENCES_... = "org.alfresco.share.my.tasks";

	/**
	* ProjectConversationsHeader constructor.
	*
	* @param {String} htmlId The HTML id of the parent element
	* @return {Alvex.ProjectConversationsHeader} The new ProjectConversationsHeader instance
	* @constructor
	*/
	Alvex.ProjectConversationsHeader = function TDH_constructor(htmlId)
	{
		Alvex.ProjectConversationsHeader.superclass.constructor.call(this, "Alvex.ProjectConversationsHeader", htmlId, ["button"]);
		
		// Services
		this.services.preferences = new Alfresco.service.Preferences();
		
		YAHOO.Bubbling.on("filterChanged", this.onFilterChanged, this);
		//YAHOO.Bubbling.on("taskListPreferencesLoaded", this.onTaskListPreferencesLoaded, this);
		
		return this;
	};

	YAHOO.extend(Alvex.ProjectConversationsHeader, Alfresco.component.Base,
	{
		onReady: function()
		{
			var me = this;
			Alfresco.util.Ajax.jsonGet(
			{
				url: Alfresco.constants.PROXY_URI + "api/alvex/project/" + encodeURIComponent(Alfresco.constants.SITE) + "/conversations/container",
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

		onFilterChanged: function(layer, args)
		{
			var filter = Alfresco.util.cleanBubblingObject(args[1]);
		}
		
   });

})();
