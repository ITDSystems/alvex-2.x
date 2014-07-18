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
	var Dom = YAHOO.util.Dom;
	var $html = Alfresco.util.encodeHTML;
	
	Alvex.AutoNumberer = function(htmlId)
	{
		Alvex.AutoNumberer.superclass.constructor.call(this, "Alvex.AutoNumberer", htmlId);
		YAHOO.Bubbling.on("formContentReady", this.onFormContentReady, this);
		return this;
	};

	YAHOO.extend(Alvex.AutoNumberer, Alfresco.component.Base,
	{
		options:
		{
			initialized: false,
			autoIdOnly: false,
			disabled: false
		},

		onReady: function _onReady()
		{
			// Workaround for strange bug when onReady is not called
			if( this.options.initialized )
				return;
			this.options.initialized = true;
			this.fillNumber();
		},

		onFormContentReady: function _onFormContentReady()
		{
			// Workaround for strange bug when onReady is not called
			if( this.options.initialized )
				return;
			this.options.initialized = true;
			this.fillNumber();
		},

		fillNumber: function _fillNumber()
		{
			if(this.options.disabled)
				return;
			// If we are here - we need auto-numbering for document without number
			
			// We inform about our presence if there is a chance a value will be changed by user
			// In this case we should check it before form submit
			YAHOO.Bubbling.fire("autoNumbererInfo", { htmlId: this.id } );
						
			var targetDlRef = document.getElementsByName("alf_destination")[0].value;
			
			Alfresco.util.Ajax.jsonRequest({
				url: Alfresco.constants.PROXY_URI + "api/alvex/documents-registers/number/suggest"
						+ "?register=" + targetDlRef,
				method: Alfresco.util.Ajax.GET,
				dataObj: null,
				successCallback:
				{
					fn: function (resp)
					{
						Dom.get( this.id ).value = $html(resp.json.number);
						// Special case - read-only field is rendered completely differently (see .ftl)
						if( this.options.autoIdOnly )
							Dom.get( this.id + "-display" ).innerHTML = $html(resp.json.number);
					},
					scope:this
				},
				failureCallback:
				{
					fn: function (resp)
					{
						if (resp.serverResponse.statusText)
							Alfresco.util.PopupManager.displayMessage({ text: resp.serverResponse.statusText });
					},
					scope:this
				}
			});
		}
	});
})();
