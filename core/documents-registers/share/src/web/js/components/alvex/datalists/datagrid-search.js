/**
 * Copyright (C) 2014 ITD Systems LLC.
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
if (typeof Alvex === "undefined" || !Alvex)
{
   var Alvex = {};
}

/**
 * Data Lists: DataGrid component.
 * 
 * @namespace Alvex
 * @class Alvex.DataGridSearch
 */
(function()
{
   var $html = Alfresco.util.encodeHTML;
   var $func = Alvex.util.getFunctionByName;
   
   /**
    * Alfresco.service.DataListActions implementation
    */
   Alvex.DataGridSearch = {};
   Alvex.DataGridSearch.prototype =
   {
      defaultSearchRenderersNames: {},
	  
      /**
       * Render search form
       */
      renderSearch: function DataGrid_renderSearch(response)
      {
         // TODO - move it out of renderSearch() and make configurable
         this.defaultSearchRenderersNames["default"] = "Alvex.DatagridTextSearchRenderer";
         this.defaultSearchRenderersNames["text"] = "Alvex.DatagridTextSearchRenderer";
         this.defaultSearchRenderersNames["mltext"] = "Alvex.DatagridTextSearchRenderer";
         this.defaultSearchRenderersNames["select"] = "Alvex.DatagridSelectSearchRenderer";
         this.defaultSearchRenderersNames["date"] = "Alvex.DatagridDateRangeSearchRenderer";
         this.defaultSearchRenderersNames["datetime"] = "Alvex.DatagridDateRangeSearchRenderer";
         this.defaultSearchRenderersNames["cm:person"] = "Alvex.DatagridTextSearchRenderer";
         this.defaultSearchRenderersNames["association"] = "Alvex.DatagridTextSearchRenderer";

         if( ! Dom.get(this.id + '-search') )
            return;

         if( !this.datalistColumns.length || this.datalistColumns.length === 0 )
            return;

         // Get constraints for fields in question
         // WA: very-very long form description to parse
         var text = response.serverResponse.responseText;
         var constraints = text.replace(/[\s\S]*fieldConstraints:/, "").replace(/\}\)\.setMessages\([\s\S]*/, "");
         var json = eval('(' + constraints + ')');
         for(var i in json)
            this.datalistColumnsConstraints[ json[i].fieldId.replace(/^tmp_/,"") ] = json[i];

         // Clear everything
         if( this.widgets.searchForm )
            delete this.widgets.searchForm;
         Dom.get(this.id + '-search').innerHTML = '';

         // Render table to hold search field
         var outerEl = this.widgets.dataTable.getColumn('nodeRef').getThEl();
         var width = Number(outerEl.offsetWidth) - 4;
         var row = '<td id="' + this.id + '-search-span-' + 'nodeRef' + '" class="datagrid-search-field" ' 
                   + 'style="min-width:' + width + 'px;">&nbsp;</td>';

         for( var col = 0; col < this.datalistColumns.length; col++ )
         {
            var key = this.dataResponseFields[col];
            outerEl = this.widgets.dataTable.getColumn(key).getThEl();
            width = Number(outerEl.offsetWidth) - 4;
            row += '<td id="' + this.id + '-search-span-' + key + '" class="datagrid-search-field" ' 
                   + ' style="min-width:' + width + 'px;"></td>';
         }
         row += '<td id="' + this.id + '-search-span-' + 'actions' + '" style="min-width:90px;" class="datagrid-search-field">' 
                  + '<span class="small-btn" id="' + this.id + '-search-span-' + 'actions-search' + '"></span>'
                  + '<span class="small-btn" id="' + this.id + '-search-span-' + 'actions-clear' + '"></span>'
                  + '</td>';
         Dom.get(this.id + "-search").innerHTML = row;

         // Render search fields themselves
         for( var col = 0; col < this.datalistColumns.length; col++ )
         {
            var key = this.dataResponseFields[col];
            
            var datalistColumn = this.datalistColumns[col];
            var renderer = null;
            var datatype = "";
            var availableOptions = null;

            // List constraint is a special case, set custom datatype value
            if( this.datalistColumnsConstraints[key] 
                 && ( this.datalistColumnsConstraints[key].handler === Alfresco.forms.validation.inList ) )
            {
               datatype = "select";
               availableOptions = this.datalistColumnsConstraints[key].params.allowedValues;
            // Other cases - just determine datatype
            } else {
               datatype = datalistColumn.dataType.toLowerCase();
            }

            // Find available renderer
            if(typeof $func(this.defaultSearchRenderersNames[datatype]) === "function")
               renderer = $func(this.defaultSearchRenderersNames[datatype]);
            else if( datalistColumn.type === "association" )
               renderer = $func(this.defaultSearchRenderersNames["association"]);
            else
               renderer = $func(this.defaultSearchRenderersNames["default"]);

            // Get current value of this field from saved search
            var curValue = this.savedSearch[key] ? this.savedSearch[key] : "";

            // Render field
            var searchFieldHtmlId = this.id + '-search-span-' + key; 
            renderer.call(this, searchFieldHtmlId, key, curValue, availableOptions);
         }

         var me = this;
         // Create search form inlined buttons
         var oSearchButton = new YAHOO.widget.Button({ type: "submit", label: '<span class="datagrid-search-button"></span>', 
                                                        container: this.id + '-search-span-' + 'actions-search' });

         var oClearButton = new YAHOO.widget.Button({ type: "push", label: '<span class="datagrid-clear-search-button"></span>', 
                                                        container: this.id + '-search-span-' + 'actions-clear',
                                                        onclick: { fn: me.clearSearch, scope: me } });

         // Call search when any search field changes
         for( var col = 0; col < this.datalistColumns.length; col++ )
         {
            var key = this.dataResponseFields[col];
            var el = Dom.get( key + '-search' );
            if( el !== null )
            {
               el.onchange = function()
                  {
                     me.doSearch( { "dataObj": me.widgets.searchForm._buildAjaxForSubmit( Dom.get(me.id + "-search-form") ) } );
                  };
            }
         }

         // Create search form on the fly to handle search submissions with 'native' tools
         this.widgets.searchForm = new Alfresco.forms.Form(this.id + "-search-form");
         this.widgets.searchForm.doBeforeAjaxRequest = 
            {
               fn: me.doSearch,
               scope: me
            };
         this.widgets.searchForm.setSubmitElements(me.widgets.searchButton);
         this.widgets.searchForm.setAJAXSubmit(true,
         {
            successCallback:
            {
               fn: me.onSuccess,
               scope: me
            },
            failureCallback:
            {
               fn: me.onFailure,
               scope: me
            }
         });
         this.widgets.searchForm.setSubmitAsJSON(true);
         this.widgets.searchForm.init();
      },

      clearSearch: function()
      {
         this.savedSearch = {};
         this._updateDataGrid({ filter: { filterId: "all", filterData: "" } });
      },

      onDataGridResize: function()
      {
         this.resizeSearch();
      },

      resizeSearch: function()
      {
         for( var col = 0; col < this.datalistColumns.length; col++ )
         {
            var key = this.dataResponseFields[col];
            var outerEl = this.widgets.dataTable.getColumn(key).getThEl();
            var outerWidth = outerEl.offsetWidth;
            var el = Dom.get( this.id + '-search-span-' + key );
            el.style.minWidth = (Number(outerWidth)-4) + 'px';
         }
      },

      doSearch: function(config, object)
      {
         config.url = Alfresco.constants.PROXY_URI
                 + "api/alvex/datalists/search/node/" + Alfresco.util.NodeRef( this.datalistMeta.nodeRef ).uri;
         config.dataObj.fields = this.dataRequestFields;
         config.dataObj.filter = {filterId: "search", filterData: "", searchFields: { props: {}, assocs: {} }};
         for(var i in config.dataObj) {
            if( i.match(/^prop_/) ) {
               this.savedSearch[i] = config.dataObj[i].replace('"','\\"');
               config.dataObj.filter.searchFields.props[i.replace(/^prop_/, '')] = config.dataObj[i];
            } else if( i.match(/^assoc_/) ) {
               this.savedSearch[i] = config.dataObj[i].replace('"','\\"');
               config.dataObj.filter.searchFields.assocs[i.replace(/^assoc_/, '')] = config.dataObj[i];
            }
         }
         this._updateDataGrid(config.dataObj);
         // Prevent extra submission - everything should be handled by dataSource in _updateDataGrid call
         return false;
      }
   };
})();
