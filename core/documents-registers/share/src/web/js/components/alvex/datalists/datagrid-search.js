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
		
         Dom.removeClass(this.id + "-search-container", "hidden");

         // Get constraints for fields in question
         for(var i in response.json.fields)
         {
            var field = response.json.fields[i];
            this.datalistColumnsConstraints[ "prop_" + field.name.replace(":","_") ] = field.allowedValues;
		 }

         // Clear everything
         if( this.widgets.searchForm )
            delete this.widgets.searchForm;
         Dom.get(this.id + '-search').innerHTML = '';

         // Render table to hold search field
         var outerEl = this.widgets.dataTable.getColumn(this.ITEM_KEY).getThEl();
         var width = Number(outerEl.offsetWidth) - 4;
         var row = '<td id="' + this.id + '-search-span-' + 'nodeRef' + '-c" class="datagrid-search-field" ' 
                   + 'style="min-width:' + width + 'px;">&nbsp;</td>';

         for( var col = 0; col < this.datalistColumns.length; col++ )
         {
            var key = this.dataResponseFields[col];
            outerEl = this.widgets.dataTable.getColumn(key).getThEl();
            width = Number(outerEl.offsetWidth) - 4;
            row += '<td id="' + this.id + '-search-span-' + key + '-c" class="datagrid-search-field" ' 
                   + ' style="min-width:' + width + 'px;"></td>';
         }
         row += '<td id="' + this.id + '-search-span-' + 'actions' + '-c" style="min-width:90px;" class="datagrid-search-field">' 
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
            if( this.datalistColumnsConstraints[key] )
            {
               datatype = "select";
               availableOptions = this.datalistColumnsConstraints[key];
            // Other cases - just determine datatype
            } else {
               datatype = datalistColumn.dataType.toLowerCase();
            }

            // Find available renderer
            if(typeof $func(this.defaultSearchRenderersNames[datatype]) === "function")
               renderer = $func(this.defaultSearchRenderersNames[datatype]);
            else if( datalistColumn.type === "association" )
               renderer = $func(this.defaultSearchRenderersNames["association"]);
            else if( datatype === "ghost" )
               renderer = Alvex.DatagridEmptySearchRenderer;
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
         var oSearchButton = new YAHOO.widget.Button({ type: "push", label: '<span class="datagrid-search-button"></span>', 
                                                        container: this.id + '-search-span-' + 'actions-search', 
														onclick: { fn: me.doSearch, scope: me } });

         var oClearButton = new YAHOO.widget.Button({ type: "push", label: '<span class="datagrid-clear-search-button"></span>', 
                                                        container: this.id + '-search-span-' + 'actions-clear',
                                                        onclick: { fn: me.clearSearch, scope: me } });

         // Call search when any search field changes
         for( var col = 0; col < this.datalistColumns.length; col++ )
         {
            var key = this.dataResponseFields[col];
			var searchFieldHtmlId = this.id + '-search-span-' + key; 
            var el = Dom.get( searchFieldHtmlId );
            if( el !== null )
            {
               el.onchange = function()
                  {
                     me.doSearch();
                  };
            }
         }
      },

      clearSearch: function()
      {
         this.savedSearch = {};
         this._updateDataGrid({ filter: { eventGroup: this, filterId: "all", filterData: "" } });
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

      doSearch: function(layer, args)
      {
         var config = {};
         config.dataObj = {};
         config.dataObj.fields = this.dataRequestFields;
         config.dataObj.filter = {eventGroup: this, filterId: "search", filterData: "", searchFields: { props: {}, assocs: {} }};
         for( var col = 0; col < this.datalistColumns.length; col++ )
         {
            var key = this.dataResponseFields[col];
            var type = this.datalistColumns[key].dataType;
            if( type === "ghost" )
               continue;
			var searchFieldHtmlId = this.id + '-search-span-' + key; 
            var val = Dom.get(searchFieldHtmlId).value;
            if( key.match(/^prop_/) ) {
               this.savedSearch[key] = val.replace('"','\\"');
               config.dataObj.filter.searchFields.props[key.replace(/^prop_/, '')] = val;
            } else if( key.match(/^assoc_/) ) {
               this.savedSearch[key] = val.replace('"','\\"');
               config.dataObj.filter.searchFields.assocs[key.replace(/^assoc_/, '')] = val;
            }
         }
         this._updateDataGrid(config.dataObj);
         // Prevent extra submission - everything should be handled by dataSource in _updateDataGrid call
         return false;
      }
   };
})();
