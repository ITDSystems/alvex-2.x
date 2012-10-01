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
	
	Alvex.ClassifierSelect= function(htmlId)
	{
		Alvex.ClassifierSelect.superclass.constructor.call(this, "Alvex.ClassifierSelect", htmlId);
		YAHOO.Bubbling.on("formContentReady", this.onFormContentReady, this);
		return this;
	};

	YAHOO.extend(Alvex.ClassifierSelect, Alfresco.component.Base,
	{
		options:
		{
			initialized: false,
			disabled: false,
			url: '',
			label: '',
			value: ''
		},

		onReady: function SiteChooser_onReady()
		{
			// Workaround for strange bug when onReady is not called
			if( this.options.initialized )
				return;
			this.options.initialized = true;
			this.fillSelect();
		},

		onFormContentReady: function SiteChooser_onFormContentReady()
		{
			// Workaround for strange bug when onReady is not called
			if( this.options.initialized )
				return;
			this.options.initialized = true;
			this.fillSelect();
		},

		fillSelect: function SiteChooser_fillSelect()
		{
			//this.options.url = Alfresco.constants.PROXY_URI + "api/sites?size=250";
			//this.options.label = "title";
			//this.options.value = "title";

			if( (this.options.url == '') || (this.options.label == '') || (this.options.value == '') )
				return;

			Alfresco.util.Ajax.jsonRequest({
				url: this.options.url,
				method: Alfresco.util.Ajax.GET,
				dataObj: null,
				successCallback:
				{
					fn: function (resp)
					{
						var curValue = Dom.get( this.id ).value;
						var curLabel = "";
						for(var r in resp.json) {
							if( resp.json[r][this.options.value] == curValue )
								curLabel = resp.json[r][this.options.label];
						}
						if(this.options.disabled) {
							Dom.get( this.id + '-cntrl' ).innerHTML = $html(curLabel);
						} else {
							var selectEl = Dom.get( this.id + '-cntrl' );
							selectEl.options.add( new Option( '', '' ) );
							for(var r in resp.json) {
								selectEl.options.add( 
									new Option(
										$html(resp.json[r][this.options.label]), 
										resp.json[r][this.options.value]
									)
								);
							}
							selectEl.value = curValue;
						}
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
