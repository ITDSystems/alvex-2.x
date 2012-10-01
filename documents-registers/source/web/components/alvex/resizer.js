// Ensure root object exists
if (typeof Alvex == "undefined" || !Alvex)
{
	var Alvex = {};
}

/**
 * Alfresco Resizer.
 *
 * @namespace Alfresco.widget
 * @class Alvex.Resizer
 */
(function()
{
   /**
    * YUI Library aliases
    */
   var Dom = YAHOO.util.Dom;

   /**
    * Resizer constructor.
    *
    * @return {Alvex.Resizer} The new Alvex.Resizer instance
    * @constructor
    */
   Alvex.Resizer = function Resizer_constructor(p_name)
   {
      // Load YUI Components
      Alfresco.util.YUILoaderHelper.require(["resize"], this.onComponentsLoaded, this);

      this.name = p_name;

      // Initialise prototype properties
      this.widgets = {};

      return this;
   };

   Alvex.Resizer.prototype =
   {
      /**
       * Minimum Filter Panel height.
       *
       * @property MIN_FILTER_PANEL_HEIGHT
       * @type int
       */
      MIN_FILTER_PANEL_HEIGHT: 200,

      /**
       * Minimum Filter Panel width.
       *
       * @property MIN_FILTER_PANEL_WIDTH
       * @type int
       */
      MIN_FILTER_PANEL_WIDTH: 140,

      /**
       * Default Filter Panel width.
       *
       * @property DEFAULT_FILTER_PANEL_WIDTH
       * @type int
       */
      DEFAULT_FILTER_PANEL_WIDTH: 160,

      /**
       * Maximum Filter Panel width.
       *
       * @property MAX_FILTER_PANEL_WIDTH
       * @type int
       */
      MAX_FILTER_PANEL_WIDTH: 500,

      /**
       * Object container for storing YUI widget instances.
       *
       * @property widgets
       * @type object
       */
      widgets: null,

      /**
       * Object container for initialisation options
       *
       * @property options
       * @type object
       */
      options:
      {
         /**
          * DOM ID of left-hand container DIV
          *
          * @property divLeft
          * @type string
          * @default "alf-filters"
          */
         divLeft: "alf-filters",
   
         /**
          * DOM ID of right-hand container DIV
          *
          * @property divRight
          * @type string
          * @default "alf-content"
          */
         divRight: "alf-content",
   
         /**
          * Used to monitor document length
          *
          * @property documentHeight
          * @type int
          */
         documentHeight: -1,
         
         /**
          * Optional initial width of the resizer
          * 
          * @property initialWidth
          * @type int
          */
         initialWidth: null
      },
      /**
       * Fired by YUILoaderHelper when required component script files have
       * been loaded into the browser.
       *
       * @method onComponentsLoaded
       */
      onComponentsLoaded: function Resizer_onComponentsLoaded()
      {
         YAHOO.util.Event.onDOMReady(this.onReady, this, true);
      },

      /**
       * Fired by YUI when parent element is available for scripting.
       * Template initialisation, including instantiation of YUI widgets and event listener binding.
       *
       * @method onReady
       */
      onReady: function Resizer_onReady()
      {
         // Horizontal Resizer
         this.widgets.horizResize = new YAHOO.util.Resize(this.options.divLeft,
         {
            handles: ["r"],
            minWidth: this.MIN_FILTER_PANEL_WIDTH,
            maxWidth: this.MAX_FILTER_PANEL_WIDTH
         });

         // Before and End resize event handlers
         this.widgets.horizResize.on("beforeResize", function(eventTarget)
         {
            this.onResize(eventTarget.width);
         }, this, true);
         this.widgets.horizResize.on("endResize", function(eventTarget)
         {
            this.onResize(eventTarget.width);
         }, this, true);

         // Recalculate the vertical size on a browser window resize event
         YAHOO.util.Event.on(window, "resize", function(e)
         {
            this.onResize();
         }, this, true);

         // Monitor the document height for ajax updates
         this.options.documentHeight = Dom.getXY("alf-ft")[1];

         YAHOO.lang.later(1000, this, function()
         {
            var h = Dom.getXY("alf-ft")[1];
            if (Math.abs(this.options.documentHeight - h) > 4)
            {
               this.options.documentHeight = h;
               this.onResize();
            }
         }, null, true);

         // Initial size
         var width = (this.options.initialWidth ? this.options.initialWidth : this.DEFAULT_FILTER_PANEL_WIDTH);
         if (YAHOO.env.ua.ie > 0)
         {
            this.widgets.horizResize.resize(null, this.widgets.horizResize.get("element").offsetHeight, width, 0, 0, true);
         }
         else
         {
            this.widgets.horizResize.resize(null, this.widgets.horizResize.get("height"), width, 0, 0, true);
         }

         this.onResize(width);
      },

      /**
       * Fired by via resize event listener.
       *
       * @method onResize
       */
      onResize: function Resizer_onResize(width)
      {
         var cn = Dom.get(this.options.divLeft).childNodes,
            handle = cn[cn.length - 1];

         Dom.setStyle(this.options.divLeft, "height", "auto");
         Dom.setStyle(handle, "height", "");

         var h = Dom.getXY("alf-ft")[1] - Dom.getXY("alf-hd")[1] - Dom.get("alf-hd").offsetHeight;

         if (YAHOO.env.ua.ie === 6)
         {
            var hd = Dom.get("alf-hd"), tmpHeight = 0;
            for (var i = 0, il = hd.childNodes.length; i < il; i++)
            {
               tmpHeight += hd.childNodes[i].offsetHeight;
            }
            h = Dom.get("alf-ft").parentNode.offsetTop - tmpHeight;
         }
         if (h < this.MIN_FILTER_PANEL_HEIGHT)
         {
            h = this.MIN_FILTER_PANEL_HEIGHT;
         }

         Dom.setStyle(handle, "height", h + "px");

         if (width !== undefined)
         {
            // 8px breathing space for resize gripper
            Dom.setStyle(this.options.divRight, "margin-left", 8 + width + "px");
         }

         // Callback
         this.onResizeNotification();
      },

      /**
       * Fired after the onResize event
       * This needs overriding at the component level.
       *
       * @method onResizeNotification
       */
      onResizeNotification: function Resizer_onResizeNotification()
      {
         YAHOO.Bubbling.fire("resizeNotification");
      },
            
      /**
       * Set multiple initialization options at once.
       *
       * @method setOptions
       * @param obj {object} Object literal specifying a set of options
       * @return {Alvex.Resizer} returns 'this' for method chaining
       */
      setOptions: function Resizer_setOptions(obj)
      {
         this.options = YAHOO.lang.merge(this.options, obj);
         return this;
      }
   };
})();
