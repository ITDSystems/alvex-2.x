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

if (typeof Alvex == "undefined" || !Alvex)
{
	var Alvex = {};
}


/**
 * ObjectFinder component.
 * 
 * @namespace Alfresco
 * @class Alvex.DocRegObjectFinder
 */
(function()
{
   /**
    * YUI Library aliases
    */
   var Dom = YAHOO.util.Dom,
      Event = YAHOO.util.Event,
      KeyListener = YAHOO.util.KeyListener;

   /**
    * Alfresco Slingshot aliases
    */
   var $html = Alfresco.util.encodeHTML,
      $hasEventInterest = Alfresco.util.hasEventInterest,
      $combine = Alfresco.util.combinePaths;
   
   /**
    * ObjectFinder constructor.
    * 
    * @param {String} htmlId The HTML id of the parent element
    * @param {String} currentValueHtmlId The HTML id of the parent element
    * @return {Alvex.DocRegObjectFinder} The new ObjectFinder instance
    * @constructor
    */
   Alvex.DocRegObjectFinder = function(htmlId, currentValueHtmlId)
   {
      Alvex.DocRegObjectFinder.superclass.constructor.call(this, "Alvex.DocRegObjectFinder", htmlId, ["button", "menu", "container", "resize", "datasource", "datatable"]);
      this.currentValueHtmlId = currentValueHtmlId;
      this.eventGroup = htmlId;
      this.pickerId = htmlId;
	  YAHOO.Bubbling.on("siteChanged", this.onSiteChanged, this);
	  YAHOO.Bubbling.on("regChanged", this.onRegChanged, this);
	  YAHOO.Bubbling.on("newRegItemAttached", this.onNewRegItemAttached, this);
      return this;
   };
   
   YAHOO.extend(Alvex.DocRegObjectFinder, Alfresco.component.Base,
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
          * The type of the item to find
          *
          * @property itemType
          * @type string
          */
         itemType: "cm:content",

         /**
          * Multiple Select mode flag
          * 
          * @property multipleSelectMode
          * @type boolean
          * @default false
          */
         multipleSelectMode: true,
         
         /**
          * Flag to determine whether the picker is in disabled mode
          *
          * @property disabled
          * @type boolean
          * @default false
          */
         disabled: false,
         
         /**
          * Flag to indicate whether the field is mandatory
          *
          * @property mandatory
          * @type boolean
          * @default false
          */
         mandatory: false
         
      },

      /**
       * Single selected item, for when in single select mode
       * 
       * @property singleSelectedItem
       * @type string
       */
      singleSelectedItem: null,

      /**
       * Selected items. Keeps a list of selected items for correct Add button state.
       * 
       * @property selectedItems
       * @type object
       */
      selectedItems: null,

      /**
       * Fired by YUI when parent element is available for scripting.
       * Component initialisation, including instantiation of YUI widgets and event listener binding.
       *
       * @method onReady
       */
      onReady: function()
      {
         if (!this.options.disabled)
		 {
			 this.widgets.addButton =  new YAHOO.widget.Button(
							this.id + "-addFilesButton", 
							{ onclick: { fn: this.showPicker, obj: null, scope: this } }
					);
			this.widgets.ok = Alfresco.util.createYUIButton(this, "ok", this.onOK);
            this.widgets.cancel = Alfresco.util.createYUIButton(this, "cancel", this.onCancel);
            
            this.widgets.dialog = Alfresco.util.createYUIPanel(this.pickerId, { });
			Dom.removeClass(this.pickerId, "hidden");
            this.widgets.dialog.hideEvent.subscribe(this.onCancel, null, this);
		 }
       },

	   showPicker: function()
	   {
		   if( ! this.widgets.dialog )
				return;
			this.widgets.addButton.set("disabled", true);
			
			// Enable esc listener
			if (!this.widgets.escapeListener)
			{
				this.widgets.escapeListener = new KeyListener(this.pickerId,
				{
					keys: KeyListener.KEY.ESCAPE
				},
				{
					fn: function(eventName, keyEvent)
					{
						this.onCancel();
						Event.stopEvent(keyEvent[1]);
					},
					scope: this,
					correctScope: true
				});
			}
			this.widgets.escapeListener.enable();
		   this.widgets.dialog.show();
		   
		   if( ! this.widgets.siteMenu )
		   {
				this.widgets.siteMenu = new YAHOO.widget.Button(this.pickerId + "-site-selector",
				 { 
					type: "menu", 
					menu: this.pickerId + "-site-selector-menu",
					lazyloadmenu: false
				 });
		   };
			
			if( ! this.widgets.regsMenu )
		   {
				this.widgets.regsMenu = new YAHOO.widget.Button(this.pickerId + "-reg-selector",
				{ 
				   type: "menu", 
				   menu: this.pickerId + "-reg-selector-menu",
				   lazyloadmenu: false
				});
		   };
		   
            Alfresco.util.Ajax.jsonRequest({
               url: Alfresco.constants.PROXY_URI + "api/people/" + encodeURIComponent(Alfresco.constants.USERNAME) + "/sites?roles=user",
               method:Alfresco.util.Ajax.GET,
               successCallback:
               {
                  fn:function(resp)
                  {
                     var availableSites = [];
                     var allSites = resp.json;
                     for(var s in allSites)
                     {
                        if( ( allSites[s].sitePreset === "documents-register-dashboard" )
                              && ( (allSites[s].siteRole === "SiteCollaborator") || (allSites[s].siteRole === "SiteManager") )	)
                        {
                           availableSites.push( {
							   "type": allSites[s].sitePreset,
							   "name": allSites[s].title,
							   "nodeRef": allSites[s].node.replace(/\/alfresco\/s\/api\/node\/workspace\//,'workspace:\/\/')
						   });
                        }
                     }
					 this.processMenuUpdate(this.widgets.siteMenu, this.msg("alvex.uploader.chooseDocRegSite"), availableSites, "siteChanged");
                  },
                  scope: this
               }
            });

	   },
	   
	   processMenuUpdate: function(navButton, defaultLabel, availableOptions, eventName)
	   {
		   var me = this;
			navButton.set("label", defaultLabel);

			var navMenu = navButton.getMenu();
			navMenu.clearContent();
			
			for (var i = 0; i < availableOptions.length; i++)
			{
				var item = availableOptions[i];
				var menuItem = new YAHOO.widget.MenuItem(item.name,
				{
					value: item.nodeRef
				});
				menuItem.cfg.addProperty("label",
				{
					value: item.name
				 });
				 navMenu.addItem(menuItem, 0);
			  }
			  navMenu.render();

			navMenu.subscribe("click", function (p_sType, p_aArgs)
			{
			   var menuItem = p_aArgs[1];
			   if (menuItem)
			   {
				  YAHOO.Bubbling.fire(eventName,
				  {
					 eventGroup: me,
					 label: menuItem.cfg.getProperty("label"),
					 type: menuItem.cfg.getProperty("type"),
					 nodeRef: menuItem.value
				  });
			   }
			});
	   },
	   
	   onSiteChanged: function(layer, args)
	   {
         if ($hasEventInterest(this, args))
         {
            var obj = args[1];
            if (obj && obj.label)
            {
               this.widgets.siteMenu.set("label", obj.label);
            Alfresco.util.Ajax.jsonRequest({
               url: Alfresco.constants.PROXY_URI + "api/alvex/documents-registers/site-registries?siteRef=" + obj.nodeRef,
               method:Alfresco.util.Ajax.GET,
               successCallback:
               {
                  fn:function(resp)
                  {
					  Dom.removeClass(this.pickerId + "-reg-selector", "hidden");
					  this.regs = resp.json.data.items;
                     this.processMenuUpdate(this.widgets.regsMenu, this.msg("alvex.uploader.chooseDocReg"), resp.json.data.items, "regChanged");
                  },
                  scope: this
               }
            });
            }
         }
	   },
	   
	   onRegChanged: function(layer, args)
	   {
         if ($hasEventInterest(this, args))
         {
            var obj = args[1];
			var me = this;
            if (obj && obj.label)
            {
               this.widgets.regsMenu.set("label", obj.label);
			   for( var i = 0; i < this.regs.length; i++ )
			   {
				   var item = this.regs[i];
				   if(item.nodeRef === obj.nodeRef)
				   {
						YAHOO.Bubbling.fire("activeDataListChanged",
						   {
							  eventGroup: me,
							  dataList: {
								  "title": "",
								  "description": "",
								  "itemTypeTitle": "",
								  "itemType": item.type,
								  "nodeRef": item.nodeRef
							  }
						   });
				   }
			   }
			}
		 }
	   },

	   onOK: function()
	   {
		   Dom.addClass(this.pickerId + "-reg-selector", "hidden");
		   this.widgets.escapeListener.disable();
			this.widgets.dialog.hide();
			if( this.widgets.addButton )
				this.widgets.addButton.set("disabled", false);
	   },

	   onCancel: function()
	   {
		   Dom.addClass(this.pickerId + "-reg-selector", "hidden");
		   this.widgets.escapeListener.disable();
			this.widgets.dialog.hide();
			if( this.widgets.addButton )
				this.widgets.addButton.set("disabled", false);
	   },

	   onNewRegItemAttached: function(layer, args)
	   {
         if ($hasEventInterest(this, args))
         {
            var obj = args[1];
			Dom.get(this.currentValueHtmlId).value = obj.item;
            // inform the forms runtime that the control value has been updated (if field is mandatory)
            if (this.options.mandatory)
            {
               YAHOO.Bubbling.fire("mandatoryControlValueUpdated", this);
            }

            YAHOO.Bubbling.fire("formValueChanged",
            {
               eventGroup: this
            });
		}
       }
   });
})();