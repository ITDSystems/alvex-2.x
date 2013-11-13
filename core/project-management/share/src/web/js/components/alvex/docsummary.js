/**
 * Copyright (C) 2005-2010 Alfresco Software Limited.
 * Copyright (C) 2013 ITD Systems, LLC.
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

if (typeof Alvex == "undefined" || !Alvex)
{
   var Alvex = {};
}

/**
 * Dashboard DocSummary component.
 *
 * @namespace Alfresco
 * @class Alfresco.dashlet.DocSummary
 */
(function()
{
   /**
    * YUI Library aliases
    */
   var Dom = YAHOO.util.Dom,
      Event = YAHOO.util.Event,
      Selector = YAHOO.util.Selector;

   /**
    * Dashboard DocSummary constructor.
    *
    * @param {String} htmlId The HTML id of the parent element
    * @return {Alfresco.dashlet.DocSummary} The new component instance
    * @constructor
    */
   Alvex.DocSummary = function DocSummary_constructor(htmlId)
   {
      return Alvex.DocSummary.superclass.constructor.call(this, htmlId);
   };

   YAHOO.extend(Alvex.DocSummary, Alfresco.component.SimpleDocList,
   {

      /**
       * Preferences
       */
      PREFERENCES_DOCSUMMARY_DASHLET: "",
      PREFERENCES_DOCSUMMARY_DASHLET_FILTER: "",
      PREFERENCES_DOCSUMMARY_DASHLET_RANGE: "",
      PREFERENCES_DOCSUMMARY_DASHLET_VIEW: "",
      /**
       * Fired by YUI when parent element is available for scripting
       * @method onReady
       */
      onReady: function DocSummary_onReady()
      {
         this.PREFERENCES_DOCSUMMARY_DASHLET = "com.alvexcore.docsummary.dashlet";
         this.PREFERENCES_DOCSUMMARY_DASHLET_FILTER = this.PREFERENCES_DOCSUMMARY_DASHLET + ".filter";
         this.PREFERENCES_DOCSUMMARY_DASHLET_RANGE = this.PREFERENCES_DOCSUMMARY_DASHLET + ".range";
         this.PREFERENCES_DOCSUMMARY_DASHLET_VIEW = this.PREFERENCES_DOCSUMMARY_DASHLET + ".simpleView";
		 
		// Load preferences (after which the appropriate tasks will be displayed)
		this.services.preferences.request(this.PREFERENCES_DOCSUMMARY_DASHLET,
		{
			successCallback:
			{
				fn: this.onPreferencesLoaded,
				scope: this
			}
		});
	  },

      onPreferencesLoaded: function(p_response)
      {
         // Select the preferred options for UI
         this.options.filter = Alfresco.util.findValueByDotNotation(p_response.json, this.PREFERENCES_DOCSUMMARY_DASHLET_FILTER, "all");
		 this.options.range = Alfresco.util.findValueByDotNotation(p_response.json, this.PREFERENCES_DOCSUMMARY_DASHLET_RANGE, "7");
		 this.options.simpleView = Alfresco.util.findValueByDotNotation(p_response.json, this.PREFERENCES_DOCSUMMARY_DASHLET_VIEW, false);
         // Create Dropdown filter
         this.widgets.filter = Alfresco.util.createYUIButton(this, "filters", this.onFilterChange,
         {
            type: "menu",
            menu: "filters-menu",
            lazyloadmenu: false
         });

         // Select the preferred filter in the ui
         var filter = this.options.validFilters[0].type;
         for (var i=0; i<this.options.validFilters.length; i++)
         {
            if (this.options.filter === this.options.validFilters[i].type)
            {
               filter = this.options.filter;
               break;
            }
         }
         this.widgets.filter.set("label", this.msg("filter." + filter));
         this.widgets.filter.value = filter;

         // Create Dropdown range filter
         this.widgets.range = Alfresco.util.createYUIButton(this, "range", this.onRangeChange,
         {
            type: "menu",
            menu: "range-menu",
            lazyloadmenu: false
         });

         // Select the preferred range in the ui
         var range = this.options.validRanges[0].type;
         for (var i=0; i<this.options.validRanges.length; i++)
         {
            if (this.options.range === this.options.validRanges[i].type)
            {
               range = this.options.range;
               break;
            }
         }
         this.widgets.range.set("label", this.msg("range." + range));
         this.widgets.range.value = range;

         // Detailed/Simple List button
         this.widgets.simpleDetailed = new YAHOO.widget.ButtonGroup(this.id + "-simpleDetailed");
         if (this.widgets.simpleDetailed !== null)
         {
            this.widgets.simpleDetailed.check(this.options.simpleView ? 0 : 1);
            this.widgets.simpleDetailed.on("checkedButtonChange", this.onSimpleDetailed, this.widgets.simpleDetailed, this);
         }

         // Display the toolbar now that we have selected the filter
         Dom.removeClass(Selector.query(".toolbar div", this.id, true), "hidden");

         // DataTable can now be rendered
         Alvex.DocSummary.superclass.onReady.apply(this, arguments);
      },

      /**
       * Generate base webscript url.
       *
       * @method getWebscriptUrl
       * @override
       */
      getWebscriptUrl: function SimpleDocList_getWebscriptUrl()
      {
         return Alfresco.constants.PROXY_URI + "slingshot/doclib/doclist/documents/site/" + Alfresco.constants.SITE + "/documentLibrary?max=50";
      },

      /**
       * Calculate webscript parameters
       *
       * @method getParameters
       * @override
       */
      getParameters: function MyDocuments_getParameters()
      {
         return "filter=" + this.widgets.filter.value + "&days=" + this.widgets.range.value;
      },

      /**
       * Generate base webscript url.
       *
       * @method getWebscriptUrl
       * @override
       */
      getWebscriptUrl: function SimpleDocList_getWebscriptUrl()
      {
         return Alfresco.constants.PROXY_URI + "slingshot/doclib/doclist/documents/site/" + Alfresco.constants.SITE + "/documentLibrary?max=50";
      },

      /**
       * Filter Change menu handler
       *
       * @method onFilterChange
       * @param p_sType {string} The event
       * @param p_aArgs {array}
       */
      onFilterChange: function MyDocuments_onFilterChange(p_sType, p_aArgs)
      {
         var menuItem = p_aArgs[1];
         if (menuItem)
         {
            this.widgets.filter.set("label", menuItem.cfg.getProperty("text"));
            this.widgets.filter.value = menuItem.value;

            this.services.preferences.set(this.PREFERENCES_DOCSUMMARY_DASHLET_FILTER, this.widgets.filter.value);

            this.reloadDataTable();
         }
      },

      /**
       * Range Change menu handler
       *
       * @method onRangeChange
       * @param p_sType {string} The event
       * @param p_aArgs {array}
       */
      onRangeChange: function MyDocuments_onRangeChange(p_sType, p_aArgs)
      {
         var menuItem = p_aArgs[1];
         if (menuItem)
         {
            this.widgets.range.set("label", menuItem.cfg.getProperty("text"));
            this.widgets.range.value = menuItem.value;

            this.services.preferences.set(this.PREFERENCES_DOCSUMMARY_DASHLET_RANGE, this.widgets.range.value);

            this.reloadDataTable();
         }
      },

      /**
       * Show/Hide detailed list buttongroup click handler
       *
       * @method onSimpleDetailed
       * @param e {object} DomEvent
       * @param p_obj {object} Object passed back from addListener method
       */
      onSimpleDetailed: function DocSummary_onSimpleDetailed(e, p_obj)
      {
         this.options.simpleView = e.newValue.index === 0;
         this.services.preferences.set(this.PREFERENCES_DOCSUMMARY_DASHLET_VIEW, this.options.simpleView);
         if (e)
         {
            Event.preventDefault(e);
         }

         this.reloadDataTable();
      }
   });
})();
