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
	
	Alvex.ClassifiersConfig= function(htmlId)
	{
		Alvex.ClassifiersConfig.superclass.constructor.call(this, "Alvex.ClassifiersConfig", htmlId);
		YAHOO.Bubbling.on("formContentReady", this.onFormContentReady, this);
		return this;
	};

	YAHOO.extend(Alvex.ClassifiersConfig, Alfresco.component.Base,
	{
		options:
		{
			initialized: false,
			disabled: false,
			currentClassifiers: [],
			availableInternalClassifiers: [],
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
			// Determine what options we use for classifiers
			var options = Dom.get( this.id + '-options' ).value.split(',');
			var i = options.length;
			while (i--) {
				if (options[i] == 'int')
					this.options.useInternal = true;
				if (options[i] == 'ext')
					this.options.useExternal = true;
			}

			// Currently attached classifiers
			var curClassifiersRefs = Dom.get( this.id ).value;

			var dlMeta = Alfresco.util.ComponentManager.findFirst("Alvex.DataGrid").datalistMeta;

			Alvex.util.processAjaxQueue({
				queue: [
				// Get fields where we can use classifiers
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
								if( resp.json.fields[f].control == "/alvex-classifier-select.ftl" )
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
				// Get currently configured classifiers
				{
					url: Alfresco.constants.PROXY_URI + "api/alvex/classifier-config?refs=" + curClassifiersRefs,
					method: Alfresco.util.Ajax.GET,
					responseContentType: Alfresco.util.Ajax.JSON,
					requestContentType: Alfresco.util.Ajax.JSON,
					dataObj: null,
					successCallback:
					{
						fn: function (resp)
						{
							this.options.currentClassifiers = resp.json.classifiers;
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
							this.options.availableInternalClassifiers = resp.json.dls;
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
					+ '<strong>' + this.msg("alvex.classifiers.config.field") + '</strong></div>'
				+ '<div style="float:left;width:15em;">' 
					+ '<strong>' + this.msg("alvex.classifiers.config.classifier") + '</strong></div>'
				+ '<div style="float:left;width:15em;">' 
					+ '<strong>' + this.msg("alvex.classifiers.config.column") + '</strong></div>'
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
				selectEl.options.add( new Option( this.msg("alvex.classifiers.config.noClassifier"), '__none' ) );
				if( this.options.useExternal )
				{
					selectEl.options.add( new Option( this.msg("alvex.classifiers.config.externalClassifier"), '__external' ) );
				}
				for(var a in this.options.availableInternalClassifiers)
				{
					var meta = this.options.availableInternalClassifiers[a];
					selectEl.options.add( new Option( meta.siteTitle + ' / ' + meta.listTitle , a ) );
				}
			}

			for(var fieldNum in this.options.targetFields)
			{
				var name = this.options.targetFields[fieldNum].name;
				var val = '__none';
				var column = '';
				for( var c in this.options.currentClassifiers )
				{
					if( this.options.currentClassifiers[c].dlField == name )
						for( var a in this.options.availableInternalClassifiers )
							if( this.options.availableInternalClassifiers[a].nodeRef 
									== this.options.currentClassifiers[c].clRef )
							{
								val = a;
								column = this.options.currentClassifiers[c].clField;
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

		onSelect1Change: function( field, classifierId, column )
		{
			if( classifierId == '__none' ) {
				this.removeClassifier( field );
			} else if ( classifierId == '__external' ) {
				this.configureExternalClassifier( field );
			} else {
				this.configureInternalClassifier( field, classifierId, column );
			}
		},

		removeClassifier: function( field )
		{
			var dlMeta = Alfresco.util.ComponentManager.findFirst("Alvex.DataGrid").datalistMeta;
			var req = {};
			req.data = { 'dlRef': dlMeta.nodeRef, 'dlField': field, 
					'type': 'internal', 'classifierRef': '', 'classifierField': '' };
			this.sendSaveClassifierReq( req );

			var selectEl = Dom.get( this.id + '-2-' + field );
			Dom.addClass( selectEl, "hidden" );
		},

		configureInternalClassifier: function( field, classifierId, column )
		{
			var classifier = this.options.availableInternalClassifiers[classifierId];
			Alfresco.util.Ajax.jsonGet(
			{
				url: Alfresco.constants.URL_SERVICECONTEXT + "components/data-lists/config/columns?itemType=" + classifier.itemType,
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
							me.onSelect2Change(fieldName, obj.classifier, this.value);
						};
					},
					obj: { "classifier" : classifier },
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

		configureExternalClassifier: function( field )
		{
			var selectEl = Dom.get( this.id + '-2-' + field );
			Dom.addClass( selectEl, "hidden" );
		},

		onSelect2Change: function( field, classifier, columnName )
		{
			if( columnName == "" )
				return;

			var dlMeta = Alfresco.util.ComponentManager.findFirst("Alvex.DataGrid").datalistMeta;
			var req = {};
			req.data = { 'dlRef': dlMeta.nodeRef, 'dlField': field, 
					'type': 'internal', 'classifierRef': classifier.nodeRef, 'classifierField': columnName };
			this.sendSaveClassifierReq( req );
		},

		sendSaveClassifierReq: function(req)
		{
			Alfresco.util.Ajax.jsonPost(
			{
				url: Alfresco.constants.PROXY_URI + "api/alvex/classifier-config",
				dataObj: req,
				successCallback:
				{
					fn: function(resp)
					{
						Alfresco.util.PopupManager.displayMessage({ text: this.msg("alvex.classifiers.config.updated") });
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
