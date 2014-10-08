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
	Alvex.DatalistPicker= function(htmlId)
	{
		Alvex.DatalistPicker.superclass.constructor.call(this, "Alvex.DatalistPicker", htmlId);
		YAHOO.Bubbling.on("formContentReady", this.onFormContentReady, this);
		return this;
	};

	YAHOO.extend(Alvex.DatalistPicker, Alfresco.component.Base,
	{
		options:
		{
			disabled: false,
			initialized: false
		},

		onReady: function()
		{
			// Workaround for strange bug when onReady is not called
			if( this.options.initialized )
				return;

			this.options.initialized = true;
			this.fillSelect();
		},

		onFormContentReady: function()
		{
			// Workaround for strange bug when onReady is not called
			if( this.options.initialized )
				return;

			this.options.initialized = true;
			this.fillSelect();
		},

		fillSelect: function()
		{
			Alfresco.util.Ajax.jsonGet(
			{
				url: Alfresco.constants.PROXY_URI + "api/alvex/datalists/list-all",
				successCallback:
				{
					fn: function (resp)
					{
						var dls = resp.json.dls;
						if( !this.options.disabled )
						{
							var selectEl = Dom.get( this.id + '-cntrl' );
							for(var s in dls)
								selectEl.options.add( new Option(
									dls[s].listTitle + " (" + dls[s].siteTitle + ")", 
									dls[s].nodeRef) 
								);
							var me = this;
							var val = Dom.get( this.id ).value;
							if(val && val !== "") {
								selectEl.value = val;
								YAHOO.Bubbling.fire("datalistUpdated", { "dls": dls, "cur": val });
							}
							selectEl.onchange = function()
							{
								Dom.get( me.id ).value = this.value;
								YAHOO.Bubbling.fire("mandatoryControlValueUpdated", me);
								YAHOO.Bubbling.fire("datalistUpdated", { "dls": dls, "cur": this.value });
							};
						} else {
							var val = Dom.get( this.id ).value;
							var el = Dom.get( this.id + '-cntrl' );
							for(var s in dls)
								if( dls[s].nodeRef == val ) {
									el.innerHTML = dls[s].listTitle + " (" + dls[s].siteTitle + ")";
									YAHOO.Bubbling.fire("datalistUpdated", { "dls": dls, "cur": val });
								}
						}
					},
					scope: this
				},
				failureCallback:
				{
					fn: function (resp)
					{
						if (resp.serverResponse.statusText)
							Alfresco.util.PopupManager.displayMessage({ text: resp.serverResponse.statusText });
					},
					scope: this
				}
			});
		}
	});
})();