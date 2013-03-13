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

	Alvex.AlvexUpdatesInfo = function(htmlId)
	{
		this.name = "Alvex.AlvexUpdatesInfo";
		Alvex.AlvexUpdatesInfo.superclass.constructor.call(this, htmlId);

		Alfresco.util.ComponentManager.register(this);

		Alfresco.util.YUILoaderHelper.require(["button", "container", "datasource", "datatable", "json", "history"],
												this.onComponentsLoaded, this);

		PanelHandler = function PanelHandler_constructor()
		{
			PanelHandler.superclass.constructor.call(this, "main");
		};

		YAHOO.extend(PanelHandler, Alfresco.ConsolePanelHandler,
		{
			onLoad: function onLoad()
			{

			}
		});
		new PanelHandler;

		return this;
	};

	YAHOO.extend(Alvex.AlvexUpdatesInfo, Alfresco.ConsoleTool,
	{
		options:
		{
		},

		showErrorMessage: function(_, obj)
		{
			this.hidePopupDialog();
			// show popup dialog with error message for 5 seconds
			Alfresco.util.PopupManager.displayMessage({
				text: obj,
				displayTime: 5
			});
		},


		onReady: function WSA_onReady()
		{
			Alvex.AlvexUpdatesInfo.superclass.onReady.call(this);
			this.popupDialog = Alfresco.util.PopupManager.displayMessage({
				text: this.msg('alvex.admin.loading_updates'),
				displayTime: 0,
				spanClass: 'wait'
			});
			Alfresco.util.Ajax.jsonRequest({
					url: Alfresco.constants.URL_SERVICECONTEXT+'api/alvex/check-updates',
					method: Alfresco.util.Ajax.GET,
					failureCallback:
					{
						fn: this.showErrorMessage,
						obj: this.msg('alvex.admin.updates_check_failed'),
						scope:this
					},
					successCallback:
					{
						fn: this.displayUpdatesInfo,
						scope:this
					},
					scope: this
			});
		},

		hidePopupDialog: function() {
			if (this.popupDialog) {
				this.popupDialog.hide();
				this.popupDialog = null;
			}
		},

		displayUpdatesInfo: function(response) {
			try {
				this.data = YAHOO.util.Lang.JSON.parse(response.serverResponse.responseText);
				alert(this.data.latestVersion);
			} catch (e) {
				this.showErrorMessage(null, this.msg('alvex.admin.updates_check_failed'));
				return;
			}
			this.hidePopupDialog();
			this.popupDialog = Alfresco.util.PopupManager.displayMessage({
				text: this.msg('alvex.admin.loading_detailed_updates'),
				displayTime: 0,
				spanClass: 'wait'
			});
			Alfresco.util.Ajax.jsonRequest({
					url: Alfresco.constants.URL_SERVICECONTEXT+'api/alvex/update-js',
					method: Alfresco.util.Ajax.GET,
					failureCallback:
					{
						fn: this.showErrorMessage,
						obj: this.msg('alvex.admin.detailed_updates_check_failed'),
						scope:this
					},
					successCallback:
					{
						fn: this.displayUpdatesInfoExtended,
						scope:this
					},
					scope: this
			});
		},

		displayUpdatesInfoExtended: function(response) {
			this.hidePopupDialog();
			try {
				eval('('+response.serverResponse.responseText+')').call(this);
			}
			catch (e) {
				this.showErrorMessage(null, this.msg('alvex.admin.detailed_updates_check_failed'));
				return;
			}
		}
	});
})();
