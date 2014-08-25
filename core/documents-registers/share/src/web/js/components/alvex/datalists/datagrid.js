/**
 * Copyright (C) 2005-2010 Alfresco Software Limited.
 * Copyright (C) 2012-2014 ITD Systems LLC.
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
if (typeof Alvex == "undefined" || !Alvex)
{
	var Alvex = {};
}
 
/**
 * Data Lists: DataGrid component.
 * 
 * @namespace Alvex
 * @class Alvex.DataGrid
 */
(function()
{
   /**
   * YUI Library aliases
   */
   var Dom = YAHOO.util.Dom,
       Event = YAHOO.util.Event,
       KeyListener = YAHOO.util.KeyListener,
       Selector = YAHOO.util.Selector,
       Bubbling = YAHOO.Bubbling;

   /**
    * Alfresco Slingshot aliases
    */
   var $html = Alfresco.util.encodeHTML,
      $links = Alfresco.util.activateLinks,
      $combine = Alfresco.util.combinePaths;

   var $func = Alvex.util.getFunctionByName;
   var $hasEventInterest = Alfresco.util.hasEventInterest; 

   /**
    * DataGrid constructor.
    * 
    * @param htmlId {String} The HTML id of the parent element
    * @return {Alvex.DataGrid} The new DataGrid instance
    * @constructor
    */
   Alvex.DataGrid = function(htmlId)
   {
      Alvex.DataGrid.superclass.constructor.call(this, "Alvex.DataGrid", htmlId, ["button", "container", "datasource", "datatable", "paginator", "animation", "history"]);
      this.eventGroup = htmlId;

      // Initialise prototype properties
      this.datalistMeta = {};
      this.datalistColumns = {};
      this.datalistColumnsConstraints = {};
      this.dataRequestFields = [];
      this.dataResponseFields = [];
      this.currentPage = 1;
      this.totalRecords = 0;
      this.showingMoreActions = false;
      this.hideMoreActionsFn = null;
      this.workflowsAvailable = false;
      this.currentFilter =
      {
         filterId: "all",
         filterData: ""
      };
      this.selectedItems = {};
      this.afterDataGridUpdate = [];
      this.savedSearch = {};

	  // Datagrid cell renderers
	  this.defaultRenderersNames = {};
	  this.defaultRenderersNames["default"] = "Alvex.DatagridTextRenderer";
	  this.defaultRenderersNames["text"] = "Alvex.DatagridTextRenderer";
	  this.defaultRenderersNames["mltext"] = "Alvex.DatagridTextRenderer";
	  this.defaultRenderersNames["date"] = "Alvex.DatagridDateRenderer";
	  this.defaultRenderersNames["datetime"] = "Alvex.DatagridDateRenderer";
	  this.defaultRenderersNames["boolean"] = "Alvex.DatagridBoolRenderer";
	  this.defaultRenderersNames["cm:person"] = "Alvex.DatagridPersonRenderer";
	  this.defaultRenderersNames["association"] = "Alvex.DatagridAssocRenderer";

      /**
       * Decoupled event listeners
       */
      Bubbling.on("activeDataListChanged", this.onActiveDataListChanged, this);
      Bubbling.on("changeFilter", this.onChangeFilter, this);
      Bubbling.on("filterChanged", this.onFilterChanged, this);
      Bubbling.on("dataListDetailsUpdated", this.onDataListDetailsUpdated, this);
      Bubbling.on("dataItemCreated", this.onDataItemCreated, this);
      Bubbling.on("dataItemUpdated", this.onDataItemUpdated, this);
      Bubbling.on("dataItemsDeleted", this.onDataItemsDeleted, this);
      Bubbling.on("dataItemsDuplicated", this.onDataGridRefresh, this);
      // Alvex specific listener
      Bubbling.on("resizeNotification", this.onDataGridResize, this);

      /* Deferred list population until DOM ready */
      this.deferredListPopulation = new Alfresco.util.Deferred(["onReady", "onActiveDataListChanged"],
      {
         fn: this.populateDataGrid,
         scope: this
      });

      return this;
   };

   /**
    * Extend from Alfresco.component.Base
    */
   YAHOO.extend(Alvex.DataGrid, Alfresco.component.Base);

   /**
    * Augment prototype with Common Actions module
    */
   // TODO: do not use this augment, see comments in datagrid-actions.js for details
   // YAHOO.lang.augmentProto(Alvex.DataGrid, Alfresco.service.DataListActions);
   YAHOO.lang.augmentProto(Alvex.DataGrid, Alvex.DataGridSearch);

   /**
    * Augment prototype with main class implementation, ensuring overwrite is enabled
    */
   YAHOO.lang.augmentObject(Alvex.DataGrid.prototype,
   {
      /**
       * Object container for initialization options
       *
       * @property options
       * @type object
       */
      options:
      {
         /**
          * If datagrid works on separate page or inside popup form.
          * 
          * @property pageMode
          * @type bool
          * @default true
          */
         pageMode: true,
         
         waitListChangeEvent: true,
         
         /**
          * Current siteId.
          * 
          * @property siteId
          * @type string
          * @default ""
          */
         siteId: "",

         /**
          * ContainerId representing root container.
          *
          * @property containerId
          * @type string
          * @default "dataLists"
          */
         containerId: "dataLists",

         /**
          * Flag indicating whether pagination is available or not.
          * 
          * @property usePagination
          * @type boolean
          * @default false
          */
         usePagination: false,

         /**
          * Initial page to show on load (otherwise taken from URL hash).
          * 
          * @property initialPage
          * @type int
          */
         initialPage: 1,

         /**
          * Number of items per page
          * 
          * @property pageSize
          * @type int
          */
         pageSize: 25,

         /**
          * Initial filter to show on load.
          * 
          * @property initialFilter
          * @type object
          */
         initialFilter: {},

         /**
          * Delay time value for "More Actions" popup, in milliseconds
          *
          * @property actionsPopupTimeout
          * @type int
          * @default 500
          */
         actionsPopupTimeout: 500,

         /**
          * Delay before showing "loading" message for slow data requests
          *
          * @property loadingMessageDelay
          * @type int
          * @default 1000
          */
         loadingMessageDelay: 1000,

         /**
          * How many actions to display before the "More..." container
          *
          * @property splitActionsAt
          * @type int
          * @default 2
          */
         splitActionsAt: 2
      },

      /**
       * Current page being browsed.
       * 
       * @property currentPage
       * @type int
       * @default 1
       */
      currentPage: null,
      
      /**
       * Total number of records (documents + folders) in the currentPath.
       * 
       * @property totalRecords
       * @type int
       * @default 0
       */
      totalRecords: null,

      /**
       * Current filter to filter document list.
       * 
       * @property currentFilter
       * @type object
       */
      currentFilter: null,

      /**
       * Object literal of selected states for visible items (indexed by nodeRef).
       * 
       * @property selectedItems
       * @type object
       */
      selectedItems: null,

      /**
       * Current actions menu being shown
       * 
       * @property currentActionsMenu
       * @type object
       * @default null
       */
      currentActionsMenu: null,

      /**
       * Whether "More Actions" pop-up is currently visible.
       * 
       * @property showingMoreActions
       * @type boolean
       * @default false
       */
      showingMoreActions: null,

      /**
       * Deferred actions menu element when showing "More Actions" pop-up.
       * 
       * @property deferredActionsMenu
       * @type object
       * @default null
       */
      deferredActionsMenu: null,

      /**
       * Deferred function calls for after a data grid update
       *
       * @property afterDataGridUpdate
       * @type array
       */
      afterDataGridUpdate: null,

      /**
       * Data List metadata retrieved from the Repository
       *
       * @param datalistMeta
       * @type Object
       */
      datalistMeta: null,

      /**
       * Data List columns from Form configuration
       *
       * @param datalistColumns
       * @type Object
       */
      datalistColumns: null,

      /**
       * Fields sent in the data request
       *
       * @param dataRequestFields
       * @type Object
       */
      dataRequestFields: null,

      /**
       * Fields returned from the data request
       *
       * @param dataResponseFields
       * @type Object
       */
      dataResponseFields: null,
	  
	  //
	  DATASOURCE_METHOD: "",
	  ITEM_KEY: "",
	  DEFAULT_ACTION: "onActionView",
      
	  // Functions that should be defined on DataGrid create
      getColumnsConfigUrl: null,
	  getPrefsStoreId: null,
	  getDataSource: null,
      _buildDataGridParams: null,
	  getSearchFormUrl: null,
      
      /**
       * DataTable Cell Renderers
       */

      /**
       * Returns selector custom datacell formatter
       *
       * @method fnRenderCellSelected
       */
      fnRenderCellSelected: function DataGrid_fnRenderCellSelected()
      {
         var scope = this;
         
         /**
          * Selector custom datacell formatter
          *
          * @method renderCellSelected
          * @param elCell {object}
          * @param oRecord {object}
          * @param oColumn {object}
          * @param oData {object|string}
          */
         return function DataGrid_renderCellSelected(elCell, oRecord, oColumn, oData)
         {
            Dom.setStyle(elCell, "width", oColumn.width + "px");
            Dom.setStyle(elCell.parentNode, "width", oColumn.width + "px");

            elCell.innerHTML = '<input id="checkbox-' + oRecord.getId() + '" type="checkbox" name="fileChecked" value="'+ oData + '"' + (scope.selectedItems[oData] ? ' checked="checked">' : '>');
         };
      },

      /**
       * Returns actions custom datacell formatter
       *
       * @method fnRenderCellActions
       */
      fnRenderCellActions: function DataGrid_fnRenderCellActions()
      {
         var scope = this;
         
         /**
          * Actions custom datacell formatter
          *
          * @method renderCellActions
          * @param elCell {object}
          * @param oRecord {object}
          * @param oColumn {object}
          * @param oData {object|string}
          */
         return function DataGrid_renderCellActions(elCell, oRecord, oColumn, oData)
         {
            Dom.setStyle(elCell, "width", oColumn.width + "px");
            Dom.setStyle(elCell.parentNode, "width", oColumn.width + "px");

            elCell.innerHTML = '<div id="' + scope.id + '-actions-' + oRecord.getId() + '" class="hidden"></div>';
         };
      },
      
      /**
       * Return data type-specific formatter
       *
       * @method getCellFormatter
       * @return {function} Function to render read-only value
       */
      getCellFormatter: function DataGrid_getCellFormatter(type, datatype, rendererName)
      {
         if(typeof $func(rendererName) === "function")
            return $func(rendererName);
         
         if(typeof $func(this.defaultRenderersNames[datatype]) === "function")
            return $func(this.defaultRenderersNames[datatype]);

         if( type === "association" )
            return $func(this.defaultRenderersNames["association"]);
         else
            return $func(this.defaultRenderersNames["default"]);
      },

      /**
       * Return data type-specific sorter
       *
       * @method getSortFunction
       * @return {function} Function to sort column by
       */
      getSortFunction: function DataGrid_getSortFunction()
      {
         /**
          * Data Type custom sorter
          *
          * @method sortFunction
          * @param a {object} Sort record a
          * @param b {object} Sort record b
          * @param desc {boolean} Ascending/descending flag
          * @param field {String} Field to sort by
          */
         return function DataGrid_sortFunction(a, b, desc, field)
         {
            var fieldA = a.getData().itemData[field],
               fieldB = b.getData().itemData[field];

            if (YAHOO.lang.isArray(fieldA))
            {
               fieldA = fieldA[0];
            }
            if (YAHOO.lang.isArray(fieldB))
            {
               fieldB = fieldB[0];
            }

            // Deal with empty values
            if (!YAHOO.lang.isValue(fieldA))
            {
               return (!YAHOO.lang.isValue(fieldB)) ? 0 : 1;
            }
            else if (!YAHOO.lang.isValue(fieldB))
            {
               return -1;
            }
            
            var valA = fieldA.value,
               valB = fieldB.value;

            if (valA.indexOf && valA.indexOf("workspace://SpacesStore") == 0)
            {
               valA = fieldA.displayValue;
               valB = fieldB.displayValue;
            }

            return YAHOO.util.Sort.compare(valA, valB, desc);
         };
      },
      
      onActionClick: function(linkElement, item)
      {
         var me = this;
         var owner = Bubbling.getOwnerByTagName(linkElement, "div");
         if (owner !== null)
         {
            if(owner.title === "onActionShowMore")
            {
               me.onActionShowMore(item, owner);
               return;
            }
            var handler = $func(owner.title);
            if (typeof handler === "function")
            {
               handler.call(me, item, owner);
            }
            else
            {
               window.location = linkElement.href;
            }
         }
      },

      /**
       * Fired by YUI when parent element is available for scripting
       *
       * @method onReady
       */
      onReady: function DataGrid_onReady()
      {
         var me = this;
         
         // Item Select menu button
         this.widgets.itemSelect = Alfresco.util.createYUIButton(this, "itemSelect-button", this.onItemSelect,
         {
            type: "menu", 
            menu: "itemSelect-menu",
            disabled: true
         });

         // search button needs to be "submit" type
         this.widgets.searchButton = Alfresco.util.createYUIButton(this, "search-button", null,
         {
            type: "submit"
         });
		 
         this.createConfigurePageWidgets();
         
         // Hook action events
         var fnActionHandler = function DataGrid_fnActionHandler(layer, args)
         {
            var linkElement = args[1].anchor;
			var item = me.widgets.dataTable.getRecord(args[1].target.offsetParent).getData();
			args[1].stop = true;
            me.onActionClick(linkElement, item);
            return true;
         };
         Bubbling.addDefaultAction(this.id + "-action-link", fnActionHandler);
         Bubbling.addDefaultAction(this.id + "-show-more", fnActionHandler);

         // Hook filter change events
         var fnChangeFilterHandler = function DataGrid_fnChangeFilterHandler(layer, args)
         {
            var owner = args[1].anchor;
            if (owner !== null)
            {
               var filter = owner.rel,
                  filters,
                  filterObj = {};
               if (filter && filter !== "")
               {
                  args[1].stop = true;
                  filters = filter.split("|");
                  filterObj =
                  {
                     eventGroup: this,
                     filterOwner: window.unescape(filters[0] || ""),
                     filterId: window.unescape(filters[1] || ""),
                     filterData: window.unescape(filters[2] || ""),
                     filterDisplay: window.unescape(filters[3] || "")
                  };
                  Alfresco.logger.debug("DL_fnChangeFilterHandler", "changeFilter =>", filterObj);
                  Bubbling.fire("changeFilter", filterObj);
               }
            }
            return true;
         };
         Bubbling.addDefaultAction("filter-change", fnChangeFilterHandler);

         // DataList Actions module
         this.modules.actions = new Alfresco.module.DataListActions();

         // Reference to Data Grid component (required by actions module)
         this.modules.dataGrid = this;
         
         // Assume no list chosen for now
         //Dom.removeClass(this.id + "-selectListMessage", "hidden");

         this.deferredListPopulation.fulfil("onReady");
         if( !this.options.waitListChangeEvent )
            this.deferredListPopulation.fulfil("onActiveDataListChanged");

         // Finally show the component body here to prevent UI artifacts on YUI button decoration
         //Dom.setStyle(this.id + "-body", "visibility", "visible");
      },
	  
      /**
       * Fired by YUI when History Manager is initialised and available for scripting.
       * Component initialisation, including instantiation of YUI widgets and event listener binding.
       *
       * @method onHistoryManagerReady
       */
      onHistoryManagerReady: function DataGrid_onHistoryManagerReady()
      {
         // Fire changeFilter event for first-time population
         Alfresco.logger.debug("DataGrid_onHistoryManagerReady", "changeFilter =>", this.options.initialFilter);
         Bubbling.fire("changeFilter", YAHOO.lang.merge(
         {
            eventGroup: this,
            datagridFirstTimeNav: true
         }, this.options.initialFilter));
      },

      /**
       * Display an error message pop-up
       *
       * @private
       * @method _onDataListFailure
       * @param response {Object} Server response object from Ajax request wrapper
       * @param message {Object} Object literal of the format:
       *    <pre>
       *       title: Dialog title string
       *       text: Dialog body message
       *    </pre>
       */
      _onDataListFailure: function DataGrid__onDataListFailure(p_response, p_message)
      {
         Alfresco.util.PopupManager.displayPrompt(
         {
            title: p_message.title,
            text: p_message.text,
            modal: true,
            buttons: [
            {
               text: this.msg("button.ok"),
               handler: function DataGrid__onDataListFailure_OK()
               {
                  this.destroy();
               },
               isDefault: true
            }]
         });
         
      },
      
      /**
       * Renders Data List metadata, i.e. title and description
       *
       * @method renderDataListMeta
       */
      renderDataListMeta: function DataGrid_renderDataListMeta()
      {
         if (!YAHOO.lang.isObject(this.datalistMeta))
         {
            return;
         }
         
         Alfresco.util.populateHTML(
            [ this.id + "-title", $html(this.datalistMeta.title) ],
            [ this.id + "-listType", $links($html("("+this.datalistMeta.itemTypeTitle+")", true)) ],
            [ this.id + "-description", $links($html(this.datalistMeta.description, true)) ]
         );
      },

      /**
       * Retrieves the Data List from the Repository
       *
       * @method populateDataGrid
       */
      populateDataGrid: function DataGrid_populateDataGrid()
      {
         if (!YAHOO.lang.isObject(this.datalistMeta))
         {
            return;
         }
         
         this.renderDataListMeta();
         
         var url = this.getColumnsConfigUrl(this.datalistMeta);
         // Query the visible columns for this list's item type
         Alfresco.util.Ajax.jsonGet(
         {
            url: url,
            successCallback:
            {
               fn: this.onDatalistAvailableColumns,
               scope: this
            },
            failureCallback:
            {
               fn: this._onDataListFailure,
               obj:
               {
                  title: this.msg("message.error.columns.title"),
                  text: this.msg("message.error.columns.description")
               },
               scope: this
            }
         });

      },

      /**
       * Data List column definitions returned from the Repository
       *
       * @method onDatalistAvailableColumns
       * @param response {Object} Ajax data structure
       */
      onDatalistAvailableColumns: function DataGrid_onDatalistAvailableColumns(response)
      {
			this.allAvailableColumns = response.json.columns;
			
			this.services.preferences = new Alfresco.service.Preferences();
			this.services.preferences.request(this.getPrefsStoreId(this.datalistMeta),
			{
				successCallback:
				{
					fn: this.onDatalistVisibleColumns,
					scope: this
				}
			});
	  },
	  
	  // TODO: rework asap
	  
	  onDatalistVisibleColumns: function(p_response)
	  {
		  var data = Alfresco.util.findValueByDotNotation(p_response.json, this.getPrefsStoreId(this.datalistMeta), "");
		  var savedColumnsStr = (data !== null ? data.split(',') : []);
		  
         this.datalistColumns = [];
		 
		 if( savedColumnsStr.length > 0 )
		 {
			// ?
			savedColumnsStr = savedColumnsStr.sort();
			var savedColumns = [];
			for(var c in savedColumnsStr)
			{
				var col = savedColumnsStr[c].split('$');
				savedColumns.push(col[1]);
			}
			for(var sc = 0; sc < savedColumns.length; sc++)
			{
			   for(var c = 0; c < this.allAvailableColumns.length; c++)
			   {
				  var col = this.allAvailableColumns[c];
				  if(col.name === savedColumns[sc])
				     this.datalistColumns.push(col);
			   }
			}
		 }
		 else
		 {
			for(var c = 0; c < this.allAvailableColumns.length; c++)
			{
			   var col = this.allAvailableColumns[c];
			   if(col.showByDefault)
				  this.datalistColumns.push(col);
			}
		 }
		 
		 this.processColumnsPreferences();
		 
         // Set-up YUI History Managers and Paginator
         if( this.options.pageMode )
            this._setupHistoryManagers();
         // DataSource set-up and event registration
         this._setupDataSource();
         // DataTable set-up and event registration
         this._setupDataTable();
         // Hide "no list" message
         Dom.addClass(this.id + "-selectListMessage", "hidden");
         // Enable item select menu
         this.widgets.itemSelect.set("disabled", false);

         // Continue only when History Manager fires its onReady event
		 if( this.options.pageMode )
         {
            YAHOO.util.History.onReady(this.onHistoryManagerReady, this, true);
         }
         else
         {
            this.options.initialFilter =
               {
                  eventGroup: this,
                  filterId: "all",
                  filterData: ""
               };
            Bubbling.fire("changeFilter", YAHOO.lang.merge(
            {
               datagridFirstTimeNav: true
            }, this.options.initialFilter));
         }
      },

      /**
       * History Manager set-up and event registration
       *
       * @method _setupHistoryManagers
       */
      _setupHistoryManagers: function DataGrid__setupHistoryManagers()
      {
         /**
          * YUI History - filter
          */
         var bookmarkedFilter = YAHOO.util.History.getBookmarkedState("filter");
         bookmarkedFilter = bookmarkedFilter === null ? "all" : (YAHOO.env.ua.gecko > 0) ? bookmarkedFilter : window.escape(bookmarkedFilter);

         try
         {
            while (bookmarkedFilter != (bookmarkedFilter = decodeURIComponent(bookmarkedFilter))){}
         }
         catch (e1)
         {
            // Catch "malformed URI sequence" exception
         }
         
         var fnDecodeBookmarkedFilter = function DataGrid_fnDecodeBookmarkedFilter(strFilter)
         {
            var filters = strFilter.split("|"),
               filterObj =
               {
                  filterId: window.unescape(filters[0] || ""),
                  filterData: window.unescape(filters[1] || "")
               };
            
            filterObj.filterOwner = Alfresco.util.FilterManager.getOwner(filterObj.filterId);
            return filterObj;
         };
         
         this.options.initialFilter = fnDecodeBookmarkedFilter(bookmarkedFilter);

         // Register History Manager filter update callback
         YAHOO.util.History.register("filter", bookmarkedFilter, function DataGrid_onHistoryManagerFilterChanged(newFilter)
         {
            Alfresco.logger.debug("HistoryManager: filter changed:" + newFilter);
            // Firefox fix
            if (YAHOO.env.ua.gecko > 0)
            {
               newFilter = window.unescape(newFilter);
               Alfresco.logger.debug("HistoryManager: filter (after Firefox fix):" + newFilter);
            }
            
            this._updateDataGrid.call(this,
            {
               filter: fnDecodeBookmarkedFilter(newFilter)
            });
         }, null, this);


         /**
          * YUI History - page
          */
         var me = this;
         var handlePagination = function DataGrid_handlePagination(state, me)
         {
            me.widgets.paginator.setState(state);
            YAHOO.util.History.navigate("page", String(state.page));
         };

         if (this.options.usePagination)
         {
            var bookmarkedPage = YAHOO.util.History.getBookmarkedState("page") || "1";
            while (bookmarkedPage != (bookmarkedPage = decodeURIComponent(bookmarkedPage))){}
            this.currentPage = parseInt(bookmarkedPage || this.options.initialPage, 10);

            // Register History Manager page update callback
            YAHOO.util.History.register("page", bookmarkedPage, function DataGrid_onHistoryManagerPageChanged(newPage)
            {
               Alfresco.logger.debug("HistoryManager: page changed:" + newPage);
               me.widgets.paginator.setPage(parseInt(newPage, 10));
               this.currentPage = parseInt(newPage, 10);
            }, null, this);

            // YUI Paginator definition
            this.widgets.paginator = new YAHOO.widget.Paginator(
            {
               containers: [this.id + "-paginator", this.id + "-paginatorBottom"],
               rowsPerPage: this.options.pageSize,
               initialPage: this.currentPage,
               template: this.msg("pagination.template"),
               pageReportTemplate: this.msg("pagination.template.page-report"),
               previousPageLinkLabel: this.msg("pagination.previousPageLinkLabel"),
               nextPageLinkLabel: this.msg("pagination.nextPageLinkLabel")
            });
            
            this.widgets.paginator.subscribe("changeRequest", handlePagination, this);
            
            // Display the bottom paginator bar
            Dom.setStyle(this.id + "-datagridBarBottom", "display", "block");
         }

         // Initialize the browser history management library
         try
         {
             YAHOO.util.History.initialize("yui-history-field", "yui-history-iframe");
         }
         catch (e2)
         {
            /*
             * The only exception that gets thrown here is when the browser is
             * not supported (Opera, or not A-grade)
             */
            Alfresco.logger.error(this.name + ": Couldn't initialize HistoryManager.", e2);
            this.onHistoryManagerReady();
         }
      },

      /**
       * DataSource set-up and event registration
       *
       * @method _setupDataSource
       * @protected
       */
      _setupDataSource: function DataGrid__setupDataSource()
      {
         this.dataRequestFields = [];
         this.dataResponseFields = [];
         
         for (var i = 0, ii = this.datalistColumns.length; i < ii; i++)
         {
            var column = this.datalistColumns[i],
               columnName = column.name.replace(":", "_"),
               fieldLookup = (column.type == "property" ? "prop" : "assoc") + "_" + columnName;
            
            this.dataRequestFields.push(columnName);
            this.dataResponseFields.push(fieldLookup);
            this.datalistColumns[fieldLookup] = column;
         }
         
         // DataSource definition
         this.widgets.dataSource = this.getDataSource(this.datalistMeta);

         // Intercept data returned from data webscript to extract custom metadata
         this.widgets.dataSource.doBeforeCallback = function DataGrid_doBeforeCallback(oRequest, oFullResponse, oParsedResponse)
         {
			 
            // Convert numerical-only fields into Int for correct sorting
            if( oParsedResponse.results.length > 0 )
            {
               for( var field in oParsedResponse.results[0].itemData )
               {
                  if( ! oParsedResponse.results[0].itemData[field].value )
                     continue;
                  
                  var type = typeof oParsedResponse.results[0].itemData[field].value;
                  if( type !== "string" )
                     continue;
                  
                  var convert = true;
                  for( var i in oParsedResponse.results )
                  {
                     var value = ( oParsedResponse.results[i].itemData[field] 
                                       ? oParsedResponse.results[i].itemData[field].value : undefined );
                     var date = Alfresco.util.fromISO8601(value);
                     if( value && 
                          ( ! value.match(/^[0-9]+/g) || (date !== null) ) )
                     {
                        convert = false;
                        break;
                     }
                  }
                  
                  if(convert)
                  {
                     for( var i in oParsedResponse.results )
                     {
                        var value = ( oParsedResponse.results[i].itemData[field] 
                                       ? oParsedResponse.results[i].itemData[field].value.replace(/[^0-9]/g,'.') : undefined );
                        if( value && value !== "" )
                           oParsedResponse.results[i].itemData[field].value = parseFloat(value);
                     }
                  }
               }
            }
            
            // Container userAccess event
			if( oFullResponse.metadata && oFullResponse.metadata.parent )
			{
				var permissions = oFullResponse.metadata.parent.permissions;
				if (permissions && permissions.userAccess)
				{
				   Bubbling.fire("userAccess",
				   {
					  userAccess: permissions.userAccess
				   });
				}
			}
            
            return oParsedResponse;
         };
      },

      /**
       * DataTable set-up and event registration
       *
       * @method _setupDataTable
       * @protected
       */
      _setupDataTable: function DataGrid__setupDataTable(columns)
      {
         // YUI DataTable column definitions
         var columnDefinitions =
         [
            { key: this.ITEM_KEY, label: "", sortable: false, formatter: this.fnRenderCellSelected(), width: 16 }
         ];

         var column;
         var initialSortBy = "prop_alvexdt_id";
         var initialSortOrder = YAHOO.widget.DataTable.CLASS_ASC;
         for (var i = 0, ii = this.datalistColumns.length; i < ii; i++)
         {
            column = this.datalistColumns[i];
            // get initial sorting set in share config
            if( column.isSortKey )
            {
               initialSortBy = column.formsName;
               if( column.sortOrder )
               {
                  initialSortOrder = ( column.sortOrder.toLowerCase() === "asc" 
                               ? YAHOO.widget.DataTable.CLASS_ASC : YAHOO.widget.DataTable.CLASS_DESC );
			   }
			}
            
            var label = (column.label ? column.label : this.msg(column["label-id"]));
            var width = column.width;
            var cDef = {
               key: this.dataResponseFields[i],
               label: label,
               sortable: true,
               sortOptions:
               {
                  field: column.formsName,
                  sortFunction: this.getSortFunction()
               },
               formatter: this.getCellFormatter(column.type, column.dataType, column.renderer),
               resizable: true
            };
            if ( width > 0 )
               cDef.width = width;
            else
               cDef.minWidth = 1000;
            columnDefinitions.push(cDef);
         }

         // Add actions as last column
         columnDefinitions.push(
            { key: "actions", label: ""/*this.msg("label.column.actions")*/, sortable: false, formatter: this.fnRenderCellActions(), width: 90 }
         );

         // DataTable definition
         var me = this;
         this.widgets.dataTable = new YAHOO.widget.DataTable(this.id + "-grid", columnDefinitions, this.widgets.dataSource,
         {
            renderLoopSize: this.options.usePagination ? 16 : 32,
            initialLoad: false,
            dynamicData: false,
            "MSG_EMPTY": this.msg("message.empty"),
            "MSG_ERROR": this.msg("message.error"),
            sortedBy: {
               "key": initialSortBy,
               "dir": initialSortOrder
            },
            paginator: this.widgets.paginator
         });

         if( this.widgets.dataTable.getColumn(initialSortBy) !== null )
            me.currentSort =
            {
               oColumn: this.widgets.dataTable.getColumn(initialSortBy),
               sSortDir: initialSortOrder
            };

         // Update totalRecords with value from server
         this.widgets.dataTable.handleDataReturnPayload = function DataGrid_handleDataReturnPayload(oRequest, oResponse, oPayload)
         {
            me.totalRecords = oResponse.meta.totalRecords;
            oResponse.meta.pagination = 
            {
               rowsPerPage: me.options.pageSize,
               recordOffset: (me.currentPage - 1) * me.options.pageSize
            };
            return oResponse.meta;
         };

         // Override abstract function within DataTable to set custom error message
         this.widgets.dataTable.doBeforeLoadData = function DataGrid_doBeforeLoadData(sRequest, oResponse, oPayload)
         {
            if (oResponse.error)
            {
               try
               {
                  var response = YAHOO.lang.JSON.parse(oResponse.responseText);
                  me.widgets.dataTable.set("MSG_ERROR", response.message);
               }
               catch(e)
               {
                  me._setDefaultDataTableErrors(me.widgets.dataTable);
               }
            }

            // We don't get an renderEvent for an empty recordSet, but we'd like one anyway
            if (oResponse.results.length === 0)
            {
               this.fireEvent("renderEvent",
               {
                  type: "renderEvent"
               });
            }

            // Must return true to have the "Loading..." message replaced by the error message
            return true;
         };

         // Override default function so the "Loading..." message is suppressed
         this.widgets.dataTable.doBeforeSortColumn = function DataGrid_doBeforeSortColumn(oColumn, sSortDir)
         {
            me.currentSort =
            {
               oColumn: oColumn,
               sSortDir: sSortDir
            };
            return true;
         };

         // File checked handler
         this.widgets.dataTable.subscribe("checkboxClickEvent", function(e)
         { 
            var id = e.target.value; 
            this.selectedItems[id] = e.target.checked;
            Bubbling.fire("selectedItemsChanged");
         }, this, true);

         // Before render event handler
         this.widgets.dataTable.subscribe("beforeRenderEvent", function()
         {
            if (me.currentSort)
            {
                // Is there a custom sort handler function defined?
               var oColumn = me.currentSort.oColumn,
                  sSortDir = me.currentSort.sSortDir,
                  sortFnc = (oColumn.sortOptions && YAHOO.lang.isFunction(oColumn.sortOptions.sortFunction)) ?
                        // Custom sort function
                        oColumn.sortOptions.sortFunction : null;
                   
               // Sort the Records
               if (sSortDir || sortFnc)
               {
                  // Default sort function if necessary
                  sortFnc = sortFnc || this.get("sortFunction");
                  // Get the field to sort
                  var sField = (oColumn.sortOptions && oColumn.sortOptions.field) ? oColumn.sortOptions.field : oColumn.field;

                  // Sort the Records        
                  this._oRecordSet.sortRecords(sortFnc, ((sSortDir == YAHOO.widget.DataTable.CLASS_DESC) ? true : false), sField);
               }
            }
         }, this.widgets.dataTable, true);

         // Rendering complete event handler
         this.widgets.dataTable.subscribe("renderEvent", function()
         {
            Alfresco.logger.debug("DataTable renderEvent");
            
            // IE6 fix for long filename rendering issue
            if (YAHOO.env.ua.ie < 7)
            {
               var ie6fix = this.widgets.dataTable.getTableEl().parentNode;
               ie6fix.className = ie6fix.className;
            }

            // Deferred functions specified?
            for (var i = 0, j = this.afterDataGridUpdate.length; i < j; i++)
            {
               this.afterDataGridUpdate[i].call(this);
            }
            this.afterDataGridUpdate = [];
         }, this, true);

         this.widgets.dataTable.subscribe("postRenderEvent", function()
         {
            var url = this.getSearchFormUrl(this.datalistMeta);
            // Query create form - it gives us complete content model including constraints
            Alfresco.util.Ajax.jsonGet(
            {
               url: url,
               
               successCallback:
               {
                  fn: this.renderSearch,
                  scope: this
               },
               failureCallback:
               {
                  fn: this._onDataListFailure,
                  obj:
                  {
                     title: this.msg("message.error.columns.title"),
                     text: this.msg("message.error.columns.description")
                  },
                  scope: this
               }
            });

         }, this, true);

         // Enable row highlighting
         this.widgets.dataTable.subscribe("rowMouseoverEvent", this.onEventHighlightRow, this, true);
         this.widgets.dataTable.subscribe("rowMouseoutEvent", this.onEventUnhighlightRow, this, true);

         this.widgets.dataTable.on('rowDblclickEvent',function(aArgs) {
            var theTarget = aArgs.target;
            var theRecord = this.getRecord(theTarget);
            var actionSetEl = theTarget.childNodes[theTarget.childNodes.length-1];
            var viewLinkDivs = YAHOO.util.Selector.query("div." + me.DEFAULT_ACTION, actionSetEl);
            if( viewLinkDivs.length > 0 )
            {
               var viewLinkEl = YAHOO.util.Selector.query("a", viewLinkDivs[0])[0];
               me.onActionClick(viewLinkEl, theRecord.getData());
            }
         });
      },

      /**
       * Multi-item select button click handler
       *
       * @method onItemSelect
       * @param sType {string} Event type, e.g. "click"
       * @param aArgs {array} Arguments array, [0] = DomEvent, [1] = EventTarget
       * @param p_obj {object} Object passed back from subscribe method
       */
      onItemSelect: function DataGrid_onItemSelect(sType, aArgs, p_obj)
      {
         var domEvent = aArgs[0],
            eventTarget = aArgs[1];

         // Select based upon the className of the clicked item
         this.selectItems(Alfresco.util.findEventClass(eventTarget));
         Event.preventDefault(domEvent);
      },

      /**
       * Custom event handler to highlight row.
       *
       * @method onEventHighlightRow
       * @param oArgs.event {HTMLEvent} Event object.
       * @param oArgs.target {HTMLElement} Target element.
       */
      onEventHighlightRow: function DataGrid_onEventHighlightRow(oArgs)
      {
         // elActions is the element id of the active table cell where we'll inject the actions
         var elActions = Dom.get(this.id + "-actions-" + oArgs.target.id);

         // Inject the correct action elements into the actionsId element
         if (elActions && elActions.firstChild === null)
         {
            // Call through to get the row highlighted by YUI
            this.widgets.dataTable.onEventHighlightRow.call(this.widgets.dataTable, oArgs);

            // Clone the actionSet template node from the DOM
            var record = this.widgets.dataTable.getRecord(oArgs.target.id),
               clone = Dom.get(this.id + "-actionSet").cloneNode(true);
            
            // Generate an id
            clone.id = elActions.id + "_a";

            // Simple view by default
            Dom.addClass(clone, "simple");
            
            // Trim the items in the clone depending on the user's access
            var userAccess = record.getData("permissions").userAccess,
               actionLabels = record.getData("actionLabels") || {};
            
            // Inject the current filterId to allow filter-scoped actions
            userAccess["filter-" + this.currentFilter.filterId] = true;
            userAccess["start-workflow"] = (this.options.workflowsAvailable == "true");
            
            // Remove any actions the user doesn't have permission for
            var actions = YAHOO.util.Selector.query("div", clone),
               action, aTag, spanTag, actionPermissions, aP, i, ii, j, jj;

            for (i = 0, ii = actions.length; i < ii; i++)
            {
               action = actions[i];
               aTag = action.firstChild;
               if( aTag.href[aTag.href.length-1] === '=')
                  aTag.href += record.getData(this.ITEM_KEY);
               spanTag = aTag.firstChild;
               if (spanTag && actionLabels[action.className])
               {
                  spanTag.innerHTML = $html(actionLabels[action.className]);
               }
               
               if (aTag.rel !== "")
               {
                  actionPermissions = aTag.rel.split(",");
                  for (j = 0, jj = actionPermissions.length; j < jj; j++)
                  {
                     aP = actionPermissions[j];
                     // Support "negative" permissions
                     if ((aP.charAt(0) == "~") ? !!userAccess[aP.substring(1)] : !userAccess[aP])
                     {
                        clone.removeChild(action);
                        break;
                     }
                  }
               }
            }
            
            // Need the "More >" container?
            var splitAt = this.options.splitActionsAt;
            actions = YAHOO.util.Selector.query("div", clone);
            if (actions.length > splitAt)
            {
               var moreContainer = Dom.get(this.id + "-moreActions").cloneNode(true);
               var containerDivs = YAHOO.util.Selector.query("div", moreContainer);
               // Insert the two necessary DIVs before the splitAt action item
               Dom.insertBefore(containerDivs[0], actions[splitAt]);
               Dom.insertBefore(containerDivs[1], actions[splitAt]);
               // Now make action items after the split, children of the 2nd DIV
               var index, moreActions = actions.slice(splitAt);
               for (index in moreActions)
               {
                  if (moreActions.hasOwnProperty(index))
                  {
                     containerDivs[1].appendChild(moreActions[index]);
                  }
               }
            }
            
            elActions.appendChild(clone);
         }
         
         if (this.showingMoreActions)
         {
            this.deferredActionsMenu = elActions;
         }
         else if (!Dom.hasClass(document.body, "masked") || this.options.pageMode == false)
         {
            this.currentActionsMenu = elActions;
            // Show the actions
            Dom.removeClass(elActions, "hidden");
            this.deferredActionsMenu = null;
         }
      },

      /**
       * Custom event handler to unhighlight row.
       *
       * @method onEventUnhighlightRow
       * @param oArgs.event {HTMLEvent} Event object.
       * @param oArgs.target {HTMLElement} Target element.
       */
      onEventUnhighlightRow: function DataGrid_onEventUnhighlightRow(oArgs)
      {
         // Call through to get the row unhighlighted by YUI
         this.widgets.dataTable.onEventUnhighlightRow.call(this.widgets.dataTable, oArgs);

         var elActions = Dom.get(this.id + "-actions-" + (oArgs.target.id));

         // Don't hide unless the More Actions drop-down is showing, or a dialog mask is present
         if (!this.showingMoreActions || Dom.hasClass(document.body, "masked"))
         {
            if (this.hideMoreActionsFn)
            {
               this.hideMoreActionsFn.call(this);
            }
            // Just hide the action links, rather than removing them from the DOM
            Dom.addClass(elActions, "hidden");
            this.deferredActionsMenu = null;
         }
      },

      /**
       * Show more actions pop-up.
       *
       * @method onActionShowMore
       * @param record {object} Object literal representing DL item to be actioned
       * @param elMore {element} DOM Element of "More Actions" link
       */
      onActionShowMore: function DataGrid_onActionShowMore(record, elMore)
      {
         // Fix "More Actions" hover style
         Dom.addClass(elMore.firstChild, "highlighted");

         // Get the pop-up div, sibling of the "More Actions" link
         var elMoreActions = Dom.getNextSibling(elMore);
         Dom.removeClass(elMoreActions, "hidden");
         this.hideMoreActionsFn = function()
         {
            this.hideMoreActionsFn = null;

            Dom.removeClass(elMore.firstChild, "highlighted");
            Dom.addClass(elMoreActions, "hidden");
         };
      },

      /**
       * Public functions
       *
       * Functions designed to be called form external sources
       */

      /**
       * Public function to get array of selected items
       *
       * @method getSelectedItems
       * @return {Array} Currently selected items
       */
      getSelectedItems: function DataGrid_getSelectedItems()
      {
         var items = [],
            recordSet = this.widgets.dataTable.getRecordSet(),
            aPageRecords = this.widgets.paginator.getPageRecords(),
            startRecord = aPageRecords[0],
            endRecord = aPageRecords[1],
            record;
         
         for (var i = startRecord; i <= endRecord; i++)
         {
            record = recordSet.getRecord(i);
            if (this.selectedItems[record.getData(this.ITEM_KEY)])
            {
               items.push(record.getData());
            }
         }
         
         return items;
      },
      
      /**
       * Public function to select items by specified groups
       *
       * @method selectItems
       * @param p_selectType {string} Can be one of the following:
       * <pre>
       * selectAll - all items
       * selectNone - deselect all
       * selectInvert - invert selection
       * </pre>
       */
      selectItems: function DataGrid_selectItems(p_selectType)
      {
         var recordSet = this.widgets.dataTable.getRecordSet(),
            checks = Selector.query('input[type="checkbox"]', this.widgets.dataTable.getTbodyEl()),
            aPageRecords = this.widgets.paginator.getPageRecords(),
            startRecord = aPageRecords[0],
            len = checks.length,
            record, i, fnCheck;

         switch (p_selectType)
         {
            case "selectAll":
               fnCheck = function(assetType, isChecked)
               {
                  return true;
               };
               break;
            
            case "selectNone":
               fnCheck = function(assetType, isChecked)
               {
                  return false;
               };
               break;

            case "selectInvert":
               fnCheck = function(assetType, isChecked)
               {
                  return !isChecked;
               };
               break;

            default:
               fnCheck = function(assetType, isChecked)
               {
                  return isChecked;
               };
         }

         for (i = 0; i < len; i++)
         {
            record = recordSet.getRecord(i + startRecord);
            this.selectedItems[record.getData(this.ITEM_KEY)] = checks[i].checked = fnCheck(record.getData("type"), checks[i].checked);
         }
         
         Bubbling.fire("selectedItemsChanged");
      },


      /**
       * BUBBLING LIBRARY EVENT HANDLERS FOR PAGE EVENTS
       * Disconnected event handlers for inter-component event notification
       */

      /**
       * Current DataList changed event handler
       *
       * @method onActiveDataListChanged
       * @param layer {object} Event fired (unused)
       * @param args {array} Event parameters (unused)
       */
      onActiveDataListChanged: function DataGrid_onActiveDataListChanged(layer, args)
      {
         if( args[1].eventGroup !== "*" && !$hasEventInterest(this, args) )
            return;
         
         var obj = args[1];
         if ((obj !== null) && (obj.dataList !== null))
         {
            this.datalistMeta = obj.dataList;
            // Could happen more than once, so check return value of fulfil()
            if (!this.deferredListPopulation.fulfil("onActiveDataListChanged"))
            {
               this.populateDataGrid();
            }
         }
      },

      /**
       * Data List modified event handler
       *
       * @method onDataListDetailsUpdated
       * @param layer {object} Event fired (unused)
       * @param args {array} Event parameters (unused)
       */
      onDataListDetailsUpdated: function DataGrid_onDataListDetailsUpdated(layer, args)
      {
         var obj = args[1];
         if ((obj !== null) && (obj.dataList !== null))
         {
            this.dataListMeta = obj.dataList;
            this.renderDataListMeta();
         }
      },

      /**
       * DataGrid Refresh Required event handler
       *
       * @method onDataGridRefresh
       * @param layer {object} Event fired (unused)
       * @param args {array} Event parameters (unused)
       */
      onDataGridRefresh: function DataGrid_onDataGridRefresh(layer, args)
      {
         this._updateDataGrid.call(this,
         {
            page: this.currentPage
         });
      },

      /**
       * DataList View change filter request event handler
       *
       * @method onChangeFilter
       * @param layer {object} Event fired (unused)
       * @param args {array} Event parameters (new filterId)
       */
      onChangeFilter: function DataGrid_onChangeFilter(layer, args)
      {
         if( args[1].eventGroup !== "*" && !$hasEventInterest(this, args) )
            return;
         
         var obj = args[1];
         if ((obj !== null) && (obj.filterId !== null))
         {
            // Should be a filter in the arguments
            var filter = Alfresco.util.cleanBubblingObject(obj),
               strFilter = YAHOO.lang.substitute("{filterId}|{filterData}", filter, function(p_key, p_value, p_meta)
               {
                  return typeof p_value == "undefined" ? "" : window.escape(p_value);
               }),
               aFilters = strFilter.split("|");
            
            // Remove trailing blank entry
            if (aFilters[1].length === 0)
            {
               strFilter = aFilters[0];
            }

            Alfresco.logger.debug("DataGrid_onChangeFilter: ", filter);
            
            var objNav =
            {
               filter: strFilter
            };
            
            // Initial navigation won't fire the History event
            if (obj.datagridFirstTimeNav)
            {
               this._updateDataGrid.call(this,
               {
                  filter: filter,
                  page: this.currentPage
               });
            }
            else
            {
               if (this.options.usePagination)
               {
                  this.currentPage = 1;
                  objNav.page = "1";
               }

               Alfresco.logger.debug("DataGrid_onChangeFilter: objNav = ", objNav);
               YAHOO.util.History.multiNavigate(objNav);
            }
         }
      },

      /**
       * DataGrid View Filter changed event handler
       *
       * @method onFilterChanged
       * @param layer {object} Event fired (unused)
       * @param args {array} Event parameters (new filterId)
       */
      onFilterChanged: function DataGrid_onFilterChanged(layer, args)
      {
         var obj = args[1];
         if ((obj !== null) && (obj.filterId !== null))
         {
            obj.filterOwner = obj.filterOwner || Alfresco.util.FilterManager.getOwner(obj.filterId);

            // Should be a filterId in the arguments
            this.currentFilter = Alfresco.util.cleanBubblingObject(obj);
            Alfresco.logger.debug("DL_onFilterChanged: ", this.currentFilter);
         }
      },

      /**
       * Data Item created event handler
       *
       * @method onDataItemCreated
       * @param layer {object} Event fired
       * @param args {array} Event parameters (depends on event type)
       */
      onDataItemCreated: function DataGrid_onDataItemCreated(layer, args)
      {
         // WA for using with not-only-records
         this._updateDataGrid();
         return;
         var obj = args[1];
         if (obj && (obj.nodeRef !== null))
         {
            var nodeRef = new Alfresco.util.NodeRef(obj.nodeRef);
            // Reload the node's metadata
            Alfresco.util.Ajax.jsonPost(
            {
               url: Alfresco.constants.PROXY_URI + "slingshot/datalists/item/node/" + nodeRef.uri,
               dataObj: this._buildDataGridParams(),
               successCallback:
               {
                  fn: function DataGrid_onDataItemCreated_refreshSuccess(response)
                  {
                     var item = response.json.item;
                     var fnAfterUpdate = function DataGrid_onDataItemCreated_refreshSuccess_fnAfterUpdate()
                     {
                        var recordFound = this._findRecordByParameter(item.nodeRef, "nodeRef");
                        if (recordFound !== null)
                        {
                           var el = this.widgets.dataTable.getTrEl(recordFound);
                           Alfresco.util.Anim.pulse(el);
                        }
                     };
                     this.afterDataGridUpdate.push(fnAfterUpdate);
                     this.widgets.dataTable.addRow(item);
                  },
                  scope: this
               },
               failureCallback:
               {
                  fn: function DataGrid_onDataItemCreated_refreshFailure(response)
                  {
                     Alfresco.util.PopupManager.displayMessage(
                     {
                        text: this.msg("message.create.refresh.failure")
                     });
                  },
                  scope: this
               }
            });
         }
      },

      /**
       * Data Item updated event handler
       *
       * @method onDataItemUpdated
       * @param layer {object} Event fired
       * @param args {array} Event parameters (depends on event type)
       */
      onDataItemUpdated: function DataGrid_onDataItemUpdated(layer, args)
      {
         var obj = args[1];
         if (obj && (obj.item !== null))
         {
            var recordFound = this._findRecordByParameter(obj.item.nodeRef, "nodeRef");
            if (recordFound !== null)
            {
               this.widgets.dataTable.updateRow(recordFound, obj.item);
               var el = this.widgets.dataTable.getTrEl(recordFound);
               Alfresco.util.Anim.pulse(el);
            }
         }
      },

      /**
       * Data Items deleted event handler
       *
       * @method onDataItemsDeleted
       * @param layer {object} Event fired
       * @param args {array} Event parameters (depends on event type)
       */
      onDataItemsDeleted: function DataGrid_onDataItemsDeleted(layer, args)
      {
         var obj = args[1];
         if (obj && (obj.items !== null))
         {
            var recordFound, el,
               fnCallback = function(record)
               {
                  return function DataGrid_onDataItemsDeleted_anim()
                  {
                     this.widgets.dataTable.deleteRow(record);
                  };
               };
            
            for (var i = 0, ii = obj.items.length; i < ii; i++)
            {
               recordFound = this._findRecordByParameter(obj.items[i].nodeRef, "nodeRef");
               if (recordFound !== null)
               {
                  el = this.widgets.dataTable.getTrEl(recordFound);
                  Alfresco.util.Anim.fadeOut(el,
                  {
                     callback: fnCallback(recordFound),
                     scope: this
                  });
               }
            }
         }
      },


      /**
       * PRIVATE FUNCTIONS
       */

      /**
       * Resets the YUI DataTable errors to our custom messages
       * NOTE: Scope could be YAHOO.widget.DataTable, so can't use "this"
       *
       * @method _setDefaultDataTableErrors
       * @private
       * @param dataTable {object} Instance of the DataTable
       */
      _setDefaultDataTableErrors: function DataGrid__setDefaultDataTableErrors(dataTable)
      {
         var msg = Alfresco.util.message;
         dataTable.set("MSG_EMPTY", msg("message.empty", "Alvex.DataGrid"));
         dataTable.set("MSG_ERROR", msg("message.error", "Alvex.DataGrid"));
      },

      /**
       * Updates all Data Grid data by calling repository webscript with current list details
       *
       * @method _updateDataGrid
       * @private
       * @param p_obj.filter {object} Optional filter to navigate with
       */
      _updateDataGrid: function DataGrid__updateDataGrid(p_obj)
      {
         p_obj = p_obj || {};
         Alfresco.logger.debug("DataGrid__updateDataGrid: ", p_obj.filter);
         var successFilter = YAHOO.lang.merge({}, p_obj.filter !== undefined ? p_obj.filter : this.currentFilter),
            loadingMessage = null,
            timerShowLoadingMessage = null,
            me = this,
            params =
            {
               filter: successFilter
            };
         
         // Clear the current document list if the data webscript is taking too long
         var fnShowLoadingMessage = function DataGrid_fnShowLoadingMessage()
         {
            Alfresco.logger.debug("DataGrid__uDG_fnShowLoadingMessage: slow data webscript detected.");
            // Check the timer still exists. This is to prevent IE firing the event after we cancelled it. Which is "useful".
            if (timerShowLoadingMessage)
            {
               loadingMessage = Alfresco.util.PopupManager.displayMessage(
               {
                  displayTime: 0,
                  text: '<span class="wait">' + $html(this.msg("message.loading")) + '</span>',
                  noEscape: true
               });
               
               if (YAHOO.env.ua.ie > 0)
               {
                  this.loadingMessageShowing = true;
               }
               else
               {
                  loadingMessage.showEvent.subscribe(function()
                  {
                     this.loadingMessageShowing = true;
                  }, this, true);
               }
            }
         };
         
         // Reset the custom error messages
         this._setDefaultDataTableErrors(this.widgets.dataTable);
         
         // More Actions menu no longer relevant
         this.showingMoreActions = false;
         
         // Slow data webscript message
         this.loadingMessageShowing = false;
         timerShowLoadingMessage = YAHOO.lang.later(this.options.loadingMessageDelay, this, fnShowLoadingMessage);
         
         var destroyLoaderMessage = function DataGrid__uDG_destroyLoaderMessage()
         {
            if (timerShowLoadingMessage)
            {
               // Stop the "slow loading" timed function
               timerShowLoadingMessage.cancel();
               timerShowLoadingMessage = null;
            }

            if (loadingMessage)
            {
               if (this.loadingMessageShowing)
               {
                  // Safe to destroy
                  loadingMessage.destroy();
                  loadingMessage = null;
               }
               else
               {
                  // Wait and try again later. Scope doesn't get set correctly with "this"
                  YAHOO.lang.later(100, me, destroyLoaderMessage);
               }
            }
         };
         
         var successHandler = function DataGrid__uDG_successHandler(sRequest, oResponse, oPayload)
         {
            destroyLoaderMessage();
            // Updating the DotaGrid may change the item selection
            var fnAfterUpdate = function DataGrid__uDG_sH_fnAfterUpdate()
            {
               Bubbling.fire("selectedFilesChanged");
            };
            this.afterDataGridUpdate.push(fnAfterUpdate);
            
            Alfresco.logger.debug("currentFilter was:", this.currentFilter, "now:", successFilter);
            this.currentFilter = successFilter;
            this.currentPage = p_obj.page || 1;
            Bubbling.fire("filterChanged", successFilter);
            this.widgets.dataTable.onDataReturnReplaceRows.call(this.widgets.dataTable, sRequest, oResponse, oPayload);
         };
         
         var failureHandler = function DataGrid__uDG_failureHandler(sRequest, oResponse)
         {
            destroyLoaderMessage();
            // Clear out deferred functions
            this.afterDataGridUpdate = [];

            if (oResponse.status == 401)
            {
               // Our session has likely timed-out, so refresh to offer the login page
               window.location.reload(true);
            }
            else
            {
               try
               {
                  var response = YAHOO.lang.JSON.parse(oResponse.responseText);
                  this.widgets.dataTable.set("MSG_ERROR", response.message);
                  this.widgets.dataTable.showTableMessage(response.message, YAHOO.widget.DataTable.CLASS_ERROR);
                  if (oResponse.status == 404)
                  {
                     // Site or container not found - deactivate controls
                     Bubbling.fire("deactivateAllControls");
                  }
               }
               catch(e)
               {
                  this._setDefaultDataTableErrors(this.widgets.dataTable);
               }
            }
         };
         
         // Update the DataSource
         var requestParams = this._buildDataGridParams(params);
		 if( this.DATASOURCE_METHOD === "POST" )
			 requestParams = YAHOO.lang.JSON.stringify(requestParams);
         Alfresco.logger.debug("DataSource requestParams: ", requestParams);

         // TODO: No-cache? - add to URL retrieved from DataSource
         // "&noCache=" + new Date().getTime();
         if (Alfresco.util.CSRFPolicy && Alfresco.util.CSRFPolicy.isFilterEnabled())
         {
            this.widgets.dataSource.connMgr.initHeader(Alfresco.util.CSRFPolicy.getHeader(), Alfresco.util.CSRFPolicy.getToken(), false);
         }
         this.widgets.dataSource.sendRequest(requestParams,
         {
            success: successHandler,
            failure: failureHandler,
            scope: this
         });
      },

      /**
       * Searches the current recordSet for a record with the given parameter value
       *
       * @method _findRecordByParameter
       * @private
       * @param p_value {string} Value to find
       * @param p_parameter {string} Parameter to look for the value in
       */
      _findRecordByParameter: function DataGrid__findRecordByParameter(p_value, p_parameter)
      {
        var recordSet = this.widgets.dataTable.getRecordSet();
        for (var i = 0, j = recordSet.getLength(); i < j; i++)
        {
           if (recordSet.getRecord(i).getData(p_parameter) == p_value)
           {
              return recordSet.getRecord(i);
           }
        }
        return null;
      },
	  
		// TODO: move this code out of datagrid
		
		createConfigurePageWidgets: function()
		{
			this.widgets.configurePageButton = Alfresco.util.createYUIButton(this, "configurePage-button", this.onConfigurePageButtonClick, {});
			
			var dialogId = this.id + '-conf-dialog';
			
			this.widgets.configurePageDialogOk = new YAHOO.widget.Button(dialogId + '-ok',
						{ onclick: { fn: this.onConfigureOk, obj: null, scope: this } });
			this.widgets.configurePageDialogCancel = new YAHOO.widget.Button(dialogId + '-cancel',
						{ onclick: { fn: this.onConfigureCancel, obj: null, scope: this } });
			
			this.widgets.configurePageDialog = Alfresco.util.createYUIPanel(dialogId, { width: "800px" });
			this.widgets.configurePageDialog.hideEvent.subscribe(this.onConfigureCancel, null, this);
		},
		
		onConfigurePageButtonClick: function(event, p_obj)
		{
			Event.preventDefault(event);
			var me = this;
			
			if( ! this.widgets.configurePageDialog )
				return;
			
			// Enable esc listener
			if (!this.widgets.configurePageDialogEscapeListener)
			{
				this.widgets.configurePageDialogEscapeListener = new KeyListener(
					this.id + "-conf-dialog",
					{
						keys: KeyListener.KEY.ESCAPE
					},
					{
						fn: function(eventName, keyEvent)
						{
							this.onConfigureCancel();
							Event.stopEvent(keyEvent[1]);
						},
						scope: this,
						correctScope: true
					});
			}
			this.widgets.configurePageDialogEscapeListener.enable();

			// Show the dialog
			this.widgets.configurePageDialog.show();
			Dom.removeClass(this.id + "-conf-dialog", "hidden");
			this.widgets.configurePageDialog.center();
		},
		
		processColumnsPreferences: function(p_response)
		{
			//var data = p_response.json
			
			this.widgets.availListEl = Dom.get(this.id + "-conf-dialog-column-ul-0");
			this.widgets.usedListEl = Dom.get(this.id + "-conf-dialog-column-ul-1");

			this.widgets.availListEl.innerHTML = '';
			this.widgets.usedListEl.innerHTML = '';
			
			for(var k in this.datalistColumns )
			{
				for(var c in this.allAvailableColumns)
				{
					if(this.allAvailableColumns[c].name !== this.datalistColumns[k].name)
						continue;
					var el = this.createColumnDND(this.allAvailableColumns[c]);
					this.widgets.usedListEl.appendChild(el);
				}
			}
			for(var c in this.allAvailableColumns)
			{
				var used = false;
				for(var k in this.datalistColumns )
					if(this.allAvailableColumns[c].name === this.datalistColumns[k].name)
						used = true;
				if( !used )
				{
					var el = this.createColumnDND(this.allAvailableColumns[c]);
					this.widgets.availListEl.appendChild(el);
				}
			}
			
			this.createDNDArea();
		},
		
		createDNDArea: function()
		{
			this.widgets.availListEl = Dom.get(this.id + "-conf-dialog-column-ul-0");
			this.widgets.usedListEl = Dom.get(this.id + "-conf-dialog-column-ul-1");
			this.widgets.shadowEl = Dom.get(this.id + "-conf-dialog-dashlet-li-shadow");

			var dndConfig =
			{
				shadow: this.widgets.shadowEl,
				draggables: [
					{
						container: this.widgets.availListEl,
						groups: [Alfresco.util.DragAndDrop.GROUP_MOVE],
						cssClass: "availableDashlet",
					},
					{
						container: this.widgets.usedListEl,
						groups: [Alfresco.util.DragAndDrop.GROUP_MOVE],
						cssClass: "usedDashlet",
					}
				],
				targets: [
					{
						container: this.widgets.availListEl,
						group: Alfresco.util.DragAndDrop.GROUP_MOVE
					},
					{
						container: this.widgets.usedListEl,
						group: Alfresco.util.DragAndDrop.GROUP_MOVE
					}
				]
			};
			var dnd = new Alfresco.util.DragAndDrop(dndConfig);
		},
		
		createColumnDND: function(column)
		{
			var li= document.createElement("li");
			li.className = 'tableColumn';
			var a = document.createElement('a');
			a.href = "#";
			var img = document.createElement('img');
			img.className = "dnd-draggable";
			img.src = Alfresco.constants.URL_CONTEXT + "res/yui/assets/skins/default/transparent.gif";
			img.alt = '';
			var span = document.createElement('span');
			span.innerHTML = (column.label ? column.label : this.msg(column["label-id"]));
			var div = document.createElement('div');
			div.className = "dnd-draggable";
			div.title = this.msg("dnd.help.message");
			var hidden = document.createElement('input');
			hidden.type = "hidden";
			hidden.name = "columnid";
			hidden.value = column.name;

			a.appendChild(img);
			li.appendChild(a);
			li.appendChild(span);
			li.appendChild(div);
			li.appendChild(hidden);
			return li;
		},

		onConfigureCancel: function(e, p_obj)
		{
			this.widgets.configurePageDialogEscapeListener.disable();
			this.widgets.configurePageDialog.hide();
			if (e) {
				Event.preventDefault(e);
			}
		},
				
		onConfigureOk: function(e, p_obj)
		{
			var result = [];
			
			var ul = Dom.get(this.id + "-conf-dialog-column-ul-1");
			var lis = Dom.getElementsByClassName("tableColumn", "li", ul);
			for (var j = 0; j < lis.length; j++)
			{
				var li = lis[j];
				if(Dom.hasClass(li, "dnd-shadow"))
					continue;
				var id = Selector.query("input[type=hidden][name=columnid]", li, true).value
				result.push(j + '$' + id);
			}
			
			this.services.preferences.set(this.getPrefsStoreId(this.datalistMeta), result.join(','), 
				{
					successCallback: {
						fn: this.onPreferencesSaved,
						scope: this
					}
				});
			
			this.widgets.configurePageDialogEscapeListener.disable();
			this.widgets.configurePageDialog.hide();
			if (e) {
				Event.preventDefault(e);
			}
		},
				
		onPreferencesSaved: function()
		{
			YAHOO.Bubbling.fire("datagridPrefsUpdated");
			this.populateDataGrid();
		}
	  
   }, true);
})();
