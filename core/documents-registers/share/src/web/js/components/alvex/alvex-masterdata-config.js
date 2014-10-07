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
	var Dom = YAHOO.util.Dom;
	var $html = Alfresco.util.encodeHTML;
	
	Alvex.MasterDataConfig= function(htmlId)
	{
		Alvex.MasterDataConfig.superclass.constructor.call(this, "Alvex.MasterDataConfig", htmlId);
		YAHOO.Bubbling.on("formContentReady", this.onFormContentReady, this);
		return this;
	};

	YAHOO.extend(Alvex.MasterDataConfig, Alfresco.component.Base,
	{
		options:
		{
			initialized: false,
			disabled: false,
			currentMasterData: [],
			availableMasterData: [],
			targetFields: []
		},

		onReady: function()
		{
			// Workaround for strange bug when onReady is not called
			if( this.options.initialized )
				return;
			this.options.initialized = true;
			this.render();
		},

		onFormContentReady: function()
		{
			// Workaround for strange bug when onReady is not called
			if( this.options.initialized )
				return;
			this.options.initialized = true;
			this.render();
		},

		render: function()
		{
			var dlMeta = Alfresco.util.ComponentManager.findFirst("Alvex.DataGrid").datalistMeta;

			Alvex.util.processAjaxQueue({
				queue: [
				// Get fields where we can use masterData
				{
					url: Alfresco.constants.URL_SERVICECONTEXT 
						+ "alvex/components/data-lists/config/columns?itemType="
						+ encodeURIComponent(dlMeta.itemType),
					method: Alfresco.util.Ajax.GET,
					responseContentType: Alfresco.util.Ajax.JSON,
					requestContentType: Alfresco.util.Ajax.JSON,
					dataObj: null,
					successCallback:
					{
						fn: function (resp)
						{
							this.options.targetFields = [];
							for( var f in resp.json.columns )
								if( resp.json.columns[f].dataType === "text" 
										&& resp.json.columns[f].name !== "alvexdt:id" )
								{
									this.options.targetFields.push(resp.json.columns[f]);
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
				},
				// Get currently configured masterData
				{
					url: Alfresco.constants.PROXY_URI + "api/alvex/masterdata/attached?contRef=" 
							+ encodeURIComponent(dlMeta.nodeRef),
					method: Alfresco.util.Ajax.GET,
					responseContentType: Alfresco.util.Ajax.JSON,
					requestContentType: Alfresco.util.Ajax.JSON,
					dataObj: null,
					successCallback:
					{
						fn: function (resp)
						{
							this.options.currentMasterData = resp.json.config;
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
				},
				// Get all available master data sources
				{
					url: Alfresco.constants.PROXY_URI + "api/alvex/masterdata/sources",
					method: Alfresco.util.Ajax.GET,
					responseContentType: Alfresco.util.Ajax.JSON,
					requestContentType: Alfresco.util.Ajax.JSON,
					dataObj: null,
					successCallback:
					{
						fn: function (resp)
						{
							this.options.availableMasterData = resp.json.dataSources;
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
				}
				],
				doneCallback:
				{
					fn: this.createFields,
					scope: this
				}
			});

		},

		createFields: function()
		{
			var me = this;
			var el = Dom.get( this.id + '-view' );
			el.innerHTML += '<div style="padding:10px;height:1.5em;">' 
				+ '<div style="float:left;width:14em;text-align:right;margin-right:1em;">' 
					+ '<strong>' + this.msg("alvex.masterData.config.field") + '</strong></div>'
				+ '<div style="float:left;width:21em;">' 
					+ '<strong>' + this.msg("alvex.masterData.config.masterData") + '</strong></div>'
				+ '</div>';
			// Create selectors
			for(var f in this.options.targetFields)
			{
				var name = this.options.targetFields[f].name;
				el.innerHTML += '<div style="padding:10px;height:1.5em;">' 
					+ '<div style="float:left;width:14em;text-align:right;margin-right:1em;">' 
						+ this.options.targetFields[f].label + ':</div>'
					+ '<div style="float:left;width:14em;">' 
						+ '<select style="width:14em;" id="' + this.id + '-1-' + name + '" name="-"></select></div>';
				el.innerHTML += '</div>';
				var selectEl = Dom.get( this.id + '-1-' + name );
				selectEl.options.add( new Option( this.msg("alvex.masterData.config.noMasterData"), '' ) );
				for(var a in this.options.availableMasterData)
				{
					var meta = this.options.availableMasterData[a];
					selectEl.options.add( new Option( meta.name + ' (' + meta.type + ')' , meta.name ) );
				}
			}
			// Show current selection
			for(var c in this.options.currentMasterData)
			{
				var name = this.options.currentMasterData[c].field;
				var val = this.options.currentMasterData[c].datasource;
				Dom.get( this.id + '-1-' + name ).value = val;
			}
			// Attach actions
			for(var fieldNum in this.options.targetFields)
			{
				var name = this.options.targetFields[fieldNum].name;
				Dom.get( this.id + '-1-' + name ).onchange = function(ev)
				{
					var field = this.id.replace(me.id + '-1-','');
					me.onSelectChange(field, this.value);
				};
			}
		},

		onSelectChange: function( field, masterDataSourceName )
		{
			var dlMeta = Alfresco.util.ComponentManager.findFirst("Alvex.DataGrid").datalistMeta;
			var req = { 
				'contRef': dlMeta.nodeRef, 
				'field': field
			};
			var apiUrl = null;
			if(masterDataSourceName && masterDataSourceName != "")
			{
				apiUrl = Alfresco.constants.PROXY_URI 
					+ "api/alvex/masterdata/sources/" 
					+ encodeURIComponent(masterDataSourceName) + "/attach";
			} else {
				apiUrl = Alfresco.constants.PROXY_URI 
					+ "api/alvex/masterdata/sources/detach";
			}
			Alfresco.util.Ajax.jsonPost(
			{
				url: apiUrl,
				dataObj: req,
				successCallback:
				{
					fn: function(resp)
					{
						Alfresco.util.PopupManager.displayMessage({ text: this.msg("alvex.masterData.config.updated") });
					},
					scope: this
				},
				failureCallback:
				{
					fn: function(resp)
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
