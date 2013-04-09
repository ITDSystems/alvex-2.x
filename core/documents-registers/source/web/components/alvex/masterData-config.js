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
			availableInternalMasterData: [],
			targetFields: [],
			useInternal: false,
			useExternal: false
		},

		onReady: function SiteChooser_onReady()
		{
			// Workaround for strange bug when onReady is not called
			if( this.options.initialized )
				return;
			this.options.initialized = true;
			this.render();
		},

		onFormContentReady: function SiteChooser_onFormContentReady()
		{
			// Workaround for strange bug when onReady is not called
			if( this.options.initialized )
				return;
			this.options.initialized = true;
			this.render();
		},

		render: function()
		{
			// Determine what options we use for masterData
			var options = Dom.get( this.id + '-options' ).value.split(',');
			var i = options.length;
			while (i--) {
				if (options[i] == 'int')
					this.options.useInternal = true;
				if (options[i] == 'ext')
					this.options.useExternal = true;
			}

			// Currently attached masterData
			var curMasterDataRefs = Dom.get( this.id ).value;

			var dlMeta = Alfresco.util.ComponentManager.findFirst("Alvex.DataGrid").datalistMeta;

			Alvex.util.processAjaxQueue({
				queue: [
				// Get fields where we can use masterData
				{
					url: Alfresco.constants.URL_SERVICECONTEXT + "components/alvex/form.json?" 
						+ "itemKind=type&itemId=" + dlMeta.itemType + "&mode=create",
					method: Alfresco.util.Ajax.GET,
					responseContentType: Alfresco.util.Ajax.JSON,
					requestContentType: Alfresco.util.Ajax.JSON,
					dataObj: null,
					successCallback:
					{
						fn: function (resp)
						{
							this.options.targetFields = [];
							for( var f in resp.json.fields )
								if( resp.json.fields[f].control == "/alvex-masterData-select.ftl" )
									this.options.targetFields.push(resp.json.fields[f]);
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
					url: Alfresco.constants.PROXY_URI + "api/alvex/masterData-config?refs=" + curMasterDataRefs,
					method: Alfresco.util.Ajax.GET,
					responseContentType: Alfresco.util.Ajax.JSON,
					requestContentType: Alfresco.util.Ajax.JSON,
					dataObj: null,
					successCallback:
					{
						fn: function (resp)
						{
							this.options.currentMasterData = resp.json.masterData;
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
				// Get all available datalists
				{
					url: Alfresco.constants.PROXY_URI + "api/alvex/datalists/list-all",
					method: Alfresco.util.Ajax.GET,
					responseContentType: Alfresco.util.Ajax.JSON,
					requestContentType: Alfresco.util.Ajax.JSON,
					dataObj: null,
					successCallback:
					{
						fn: function (resp)
						{
							this.options.availableInternalMasterData = resp.json.dls;
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
				+ '<div style="float:left;width:15em;">' 
					+ '<strong>' + this.msg("alvex.masterData.config.masterData") + '</strong></div>'
				+ '<div style="float:left;width:15em;">' 
					+ '<strong>' + this.msg("alvex.masterData.config.column") + '</strong></div>'
				+ '</div>';
			for(var f in this.options.targetFields)
			{
				var name = this.options.targetFields[f].name;
				el.innerHTML += '<div style="padding:10px;height:1.5em;">' 
					+ '<div style="float:left;width:14em;text-align:right;margin-right:1em;">' 
						+ this.options.targetFields[f].label + ':</div>'
					+ '<div style="float:left;width:15em;">' 
						+ '<select style="width:14em;" id="' + this.id + '-1-' + name + '" name="-"></select></div>'
					+ '<div style="float:left;width:15em;">' 
						+ '<select style="width:14em;" class="hidden" id="' + this.id + '-2-' + name + '" name="-"></select></div>'
					+ '</div>';
				var selectEl = Dom.get( this.id + '-1-' + name );
				selectEl.options.add( new Option( this.msg("alvex.masterData.config.noMasterData"), '__none' ) );
				if( this.options.useExternal )
				{
					selectEl.options.add( new Option( this.msg("alvex.masterData.config.externalMasterData"), '__external' ) );
				}
				for(var a in this.options.availableInternalMasterData)
				{
					var meta = this.options.availableInternalMasterData[a];
					selectEl.options.add( new Option( meta.siteTitle + ' / ' + meta.listTitle , a ) );
				}
			}

			for(var fieldNum in this.options.targetFields)
			{
				var name = this.options.targetFields[fieldNum].name;
				var val = '__none';
				var column = '';
				for( var c in this.options.currentMasterData )
				{
					if( this.options.currentMasterData[c].dlField == name )
						for( var a in this.options.availableInternalMasterData )
							if( this.options.availableInternalMasterData[a].nodeRef 
									== this.options.currentMasterData[c].clRef )
							{
								val = a;
								column = this.options.currentMasterData[c].clField;
							}
				}

				Dom.get( this.id + '-1-' + name ).value = val;
				if( val != '__none' )
					this.onSelect1Change(name, val, column);

				Dom.get( this.id + '-1-' + name ).onchange = function(ev)
				{
					var field = this.id.replace(me.id + '-1-','');
					me.onSelect1Change(field, this.value);
				};
			}
		},

		onSelect1Change: function( field, masterDataId, column )
		{
			if( masterDataId == '__none' ) {
				this.removeMasterData( field );
			} else if ( masterDataId == '__external' ) {
				this.configureExternalMasterData( field );
			} else {
				this.configureInternalMasterData( field, masterDataId, column );
			}
		},

		removeMasterData: function( field )
		{
			var dlMeta = Alfresco.util.ComponentManager.findFirst("Alvex.DataGrid").datalistMeta;
			var req = {};
			req.data = { 'dlRef': dlMeta.nodeRef, 'dlField': field, 
					'type': 'internal', 'masterDataRef': '', 'masterDataField': '' };
			this.sendSaveMasterDataReq( req );

			var selectEl = Dom.get( this.id + '-2-' + field );
			Dom.addClass( selectEl, "hidden" );
		},

		configureInternalMasterData: function( field, masterDataId, column )
		{
			var masterData = this.options.availableInternalMasterData[masterDataId];
			Alfresco.util.Ajax.jsonGet(
			{
				url: Alfresco.constants.URL_SERVICECONTEXT + "components/data-lists/config/columns?itemType=" + masterData.itemType,
				successCallback:
				{
					fn: function (resp, obj)
					{
						var me = this;
						var selectEl = Dom.get( this.id + '-2-' + field );
						selectEl.options.length = 0;
						selectEl.options.add( new Option('', '') );
						for( var c in resp.json.columns )
							if( resp.json.columns[c].dataType == "text" )
								selectEl.options.add( 
									new Option( resp.json.columns[c].label, resp.json.columns[c].name ) );
						if( column && column != '' )
							Dom.get( this.id + '-2-' + field ).value = column;
						Dom.removeClass( selectEl, "hidden" );
						Dom.get( this.id + '-2-' + field ).onchange = function(ev)
						{
							var fieldName = this.id.replace(me.id + '-2-','');
							me.onSelect2Change(fieldName, obj.masterData, this.value);
						};
					},
					obj: { "masterData" : masterData },
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
		},

		configureExternalMasterData: function( field )
		{
			var selectEl = Dom.get( this.id + '-2-' + field );
			Dom.addClass( selectEl, "hidden" );
		},

		onSelect2Change: function( field, masterData, columnName )
		{
			if( columnName == "" )
				return;

			var dlMeta = Alfresco.util.ComponentManager.findFirst("Alvex.DataGrid").datalistMeta;
			var req = {};
			req.data = { 'dlRef': dlMeta.nodeRef, 'dlField': field, 
					'type': 'internal', 'masterDataRef': masterData.nodeRef, 'masterDataField': columnName };
			this.sendSaveMasterDataReq( req );
		},

		sendSaveMasterDataReq: function(req)
		{
			Alfresco.util.Ajax.jsonPost(
			{
				url: Alfresco.constants.PROXY_URI + "api/alvex/masterData-config",
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
