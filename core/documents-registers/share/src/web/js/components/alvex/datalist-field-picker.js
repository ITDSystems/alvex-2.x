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
	Alvex.DatalistFieldPicker= function(htmlId)
	{
		Alvex.DatalistFieldPicker.superclass.constructor.call(this, "Alvex.DatalistFieldPicker", htmlId);
		YAHOO.Bubbling.on("datalistUpdated", this.fillSelect, this);
		return this;
	};

	YAHOO.extend(Alvex.DatalistFieldPicker, Alfresco.component.Base,
	{
		options:
		{
			dls: [],
			disabled: false
		},

		onReady: function()
		{
		},

		onFormContentReady: function()
		{
		},

		fillSelect: function(ev, args)
		{
			var itemType;
			this.options.dls = args[1].dls;
			var dlRef = args[1].cur;
			for(var s in this.options.dls)
				if( this.options.dls[s].nodeRef == dlRef )
					itemType = this.options.dls[s].itemType;
					
			Alfresco.util.Ajax.jsonGet(
			{
				url: Alfresco.constants.URL_SERVICECONTEXT 
					+ "alvex/components/data-lists/config/columns?itemType=" 
					+ itemType,
				successCallback:
				{
					fn: function (resp)
					{
						var cols = resp.json.columns;
						var val = Dom.get( this.id ).value;
						if( !this.options.disabled )
						{
							var selectEl = Dom.get( this.id + '-cntrl' );
							selectEl.innerHTML = '';
							for(var s in cols)
								selectEl.options.add( new Option(
									cols[s].label, cols[s].name) );
							var me = this;
							for(var s in cols)
								if( cols[s].name === val ) {
									selectEl.value = val;
								}
							selectEl.onchange = function()
							{
								Dom.get( me.id ).value = this.value;
								YAHOO.Bubbling.fire("mandatoryControlValueUpdated", me);
							};
						} else {
							var el = Dom.get( this.id + '-cntrl' );
							for(var s in cols)
								if( cols[s].name === val ) {
									el.innerHTML = cols[s].label;
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