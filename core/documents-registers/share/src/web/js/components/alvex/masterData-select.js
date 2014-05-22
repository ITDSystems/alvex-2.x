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
	
	Alvex.MasterDataSelect= function(htmlId)
	{
		Alvex.MasterDataSelect.superclass.constructor.call(this, "Alvex.MasterDataSelect", htmlId);
		YAHOO.Bubbling.on("formContentReady", this.onFormContentReady, this);
		return this;
	};

	YAHOO.extend(Alvex.MasterDataSelect, Alfresco.component.Base,
	{
		options:
		{
			initialized: false,
			disabled: false,
			style: "",
			styleClass: "",
			url: '',
			root: '',
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
			if( (this.options.url == '') && (this.options.label == '') && (this.options.value == '') )
				this.loadFromRepo();
			else if( (this.options.url != '') && (this.options.label != '') && (this.options.value != '') )
				this.loadFromURL();
			else
				return;
		},

		loadFromRepo: function()
		{
			var fieldName = this.options.field;
			var formEl = Alvex.util.getFormElement(this.id);
			var destInput = Dom.get( formEl.id + '-destination' );
			var parentNodeRef = ( destInput != null ? destInput.value : null );
			var action = formEl.action;
			var curentNodeRef = null;
			if( action.match('api\/node\/') )
				curentNodeRef = action.replace(/.*api\/node\//,'').replace(/\/formprocessor/,'').replace(/\//,':\/\/');

			var url = null;
			if(parentNodeRef)
				url = Alfresco.constants.PROXY_URI + "api/alvex/masterData-config?dlRef=" + parentNodeRef + "&fieldName=" + fieldName;
			else if(curentNodeRef)
				url = Alfresco.constants.PROXY_URI + "api/alvex/masterData-config?itemRef=" + curentNodeRef + "&fieldName=" + fieldName;
			else
				return;
			
			Alfresco.util.Ajax.jsonRequest({
				url: url,
				method: Alfresco.util.Ajax.GET,
				dataObj: null,
				successCallback:
				{
					fn: function (resp)
					{
						if( resp.json.masterData && resp.json.masterData.length > 0 )
						{
							if( resp.json.masterData[0].type == "internal" )
							{
								this.options.url = Alfresco.constants.PROXY_URI 
									+ "api/alvex/datalists/items?dlRef=" + resp.json.masterData[0].clRef;
								this.options.root = '';
								this.options.label = resp.json.masterData[0].clField.replace(/.*:/,'');
								this.options.value = resp.json.masterData[0].clField.replace(/.*:/,'');
							}
						}
						this.loadFromURL();
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
		},

		renderTextField: function()
		{
			var selectEl = Dom.get( this.id + '-cntrl' );
			var parent = selectEl.parentNode;
			parent.removeChild( selectEl );

			var hiddenEl = Dom.get( this.id );
			var value = hiddenEl.value;
			parent = hiddenEl.parentNode;
			parent.removeChild( hiddenEl );

			if( !this.options.disabled )
			{
				var input = document.createElement( 'input' );
				input.type = 'text';
				input.id = this.id;
				input.name = this.options.field;
				input.value = value;
				input.setAttribute('tabindex', "0");
				input.setAttribute('style', (this.options.style ? this.options.style : 'width: 12em;'));
				input.className = this.options.styleClass;
				parent.appendChild( input );
			} else {
				var div = document.createElement( 'div' );
				div.id = this.id;
				div.setAttribute('style', (this.options.style ? this.options.style : 'width: 12em;'));
				div.className = this.options.styleClass;
				parent.appendChild( div );
				Dom.get( this.id ).innerHTML = value;
			}

			var me = this;
			Dom.get( me.id ).onchange = function()
			{
				YAHOO.Bubbling.fire("mandatoryControlValueUpdated", me);
			};
		},

		loadFromURL: function()
		{
			if( !this.options.url || this.options.url == '' )
			{
				this.renderTextField();
				return;
			}

			Alfresco.util.Ajax.jsonRequest({
				url: this.options.url,
				method: Alfresco.util.Ajax.GET,
				dataObj: null,
				successCallback:
				{
					fn: function (resp)
					{
						var me = this;
						var curValue = Dom.get( this.id ).value;
						var curLabel = "";

						var path = this.options.root.split('.');
						var opts = (resp.json ? resp.json 
									: Alfresco.util.parseJSON(resp.serverResponse.responseText));
						for( var p in path )
							if( path[p] != '' )
								opts = opts[path[p]];

						var optsMap = {};
						for(var r in opts)
							optsMap[ opts[r][this.options.value] ] = opts[r][this.options.label];

						opts.length = 0;
						for( var o in optsMap )
						{
							var opt = {};
							opt[this.options.value] = o;
							opt[this.options.label] = optsMap[o];
							opts.push( opt );
						}

						for(var r in opts) {
							if( opts[r][this.options.value] == curValue )
								curLabel = opts[r][this.options.label];
						}

						if(this.options.disabled) {
							Dom.get( this.id + '-cntrl' ).innerHTML = (curLabel != '' ? curLabel : curValue);
						} else {
							var selectEl = Dom.get( this.id + '-cntrl' );
							selectEl.options.add( new Option( '', '' ) );
							for(var r in opts) {
								selectEl.options.add( 
									new Option(
										opts[r][this.options.label], 
										opts[r][this.options.value]
									)
								);
							}
							selectEl.value = curValue;
							selectEl.onchange = function()
								{
									Dom.get( me.id ).value = this.value;
									YAHOO.Bubbling.fire("mandatoryControlValueUpdated", me);
								};
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
