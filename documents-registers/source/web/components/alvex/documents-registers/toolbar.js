/**
 * Copyright (C) 2005-2010 Alfresco Software Limited.
 *
 * This file is part of Alfresco
 *
 * Alfresco is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Alfresco is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Alfresco. If not, see <http://www.gnu.org/licenses/>.
 */

// Ensure root object exists
if (typeof Alvex == "undefined" || !Alvex)
{
	var Alvex = {};
}

/**
 * Data Lists: Toolbar component.
 * 
 * Displays a list of Toolbar
 * 
 * @namespace Alfresco
 * @class Alvex.MeetingsToolbar
 */
(function()
{
   /**
    * YUI Library aliases
    */
   var Dom = YAHOO.util.Dom,
      Event = YAHOO.util.Event;

   /**
    * Toolbar constructor.
    * 
    * @param htmlId {String} The HTML id of the parent element
    * @return {Alvex.MeetingsToolbar} The new Toolbar instance
    * @constructor
    */
   Alvex.DocumentsRegistersToolbar = function(htmlId)
   {
      Alvex.DocumentsRegistersToolbar.superclass.constructor.call(this, "Alvex.DocumentsRegistersToolbar", htmlId, ["button", "container"]);

      // Decoupled event listeners
      YAHOO.Bubbling.on("userAccess", this.onUserAccess, this);
      
      return this;
   };
   
   /**
    * Extend from Alfresco.component.Base
    */
   YAHOO.extend(Alvex.DocumentsRegistersToolbar, Alfresco.component.Base,
   {
      /**
       * Object container for initialization options
       *
       * @property options
       * @type object
       */
      options:
      {
      },

      /**
       * Fired by YUI when parent element is available for scripting.
       *
       * @method onReady
       */
      onReady: function DataListToolbar_onReady()
      {
         if( Dom.get( this.id + '-countersConfig' ) )
         {
            this.widgets.countersConfigButton = Alfresco.util.createYUIButton(this, "countersConfig", this.onCountersConfig,
            {
               disabled: true,
               value: "create"
            });
         }
		 
         // Reference to Data Grid component
         this.modules.dataGrid = Alfresco.util.ComponentManager.findFirst("Alvex.DataGrid");
      },

      onCountersConfig: function()
      {
         if( !this.modules.dataGrid )
            this.modules.dataGrid = Alfresco.util.ComponentManager.findFirst("Alvex.DataGrid");
         
         var datalistMeta = this.modules.dataGrid.datalistMeta;
         var dlNodeRef = datalistMeta.nodeRef;
         
         // Intercept before dialog show
         var doBeforeDialogShow = function(p_form, p_dialog)
         {
            Alfresco.util.populateHTML(
                  [ p_dialog.id + "-dialogTitle", this.msg("label.register-edit.title") ],
                  [ p_dialog.id + "-dialogHeader", '' ]
            );
         };

         var templateUrl = YAHOO.lang.substitute(Alfresco.constants.URL_SERVICECONTEXT 
             + "components/form?itemKind={itemKind}&itemId={itemId}&mode={mode}&submitType={submitType}&showCancelButton=true",
         {
            itemKind: "node",
            itemId: dlNodeRef,
            mode: "edit",
            submitType: "json"
         });
         
         // Using Forms Service, so always create new instance
         var countersConfigDialog = new Alfresco.module.SimpleDialog(this.id + "-countersConfig");

         countersConfigDialog.setOptions(
         {
            width: "50em",
            templateUrl: templateUrl,
            actionUrl: null,
            destroyOnHide: true,
            doBeforeDialogShow:
            {
               fn: doBeforeDialogShow,
               scope: this
            },
            onSuccess:
            {
               fn: function(response)
               {
                  Alfresco.util.PopupManager.displayMessage(
                  {
                     text: this.msg("message.register.updated")
                  });
               },
               scope: this
            },
            onFailure:
            {
               fn: function(response)
               {
                  Alfresco.util.PopupManager.displayMessage(
                  {
                     text: this.msg("message.register.updateFailed")
                  });
               },
               scope: this
            }
         }).show();
      },
      
      /**
       * User Access event handler
       *
       * @method onUserAccess
       * @param layer {object} Event fired
       * @param args {array} Event parameters (depends on event type)
       */
      onUserAccess: function DataListToolbar_onUserAccess(layer, args)
      {
         var obj = args[1];
         if (obj && obj.userAccess)
         {
            var widget, widgetPermissions, index, orPermissions, orMatch;
            for (index in this.widgets)
            {
               if (this.widgets.hasOwnProperty(index))
               {
                  widget = this.widgets[index];
                  // Skip if this action specifies "no-access-check"
                  if (widget.get("srcelement").className != "no-access-check")
                  {
                     // Default to disabled: must be enabled via permission
                     widget.set("disabled", false);
                     if (typeof widget.get("value") == "string")
                     {
                        // Comma-separation indicates "AND"
                        widgetPermissions = widget.get("value").split(",");
                        for (var i = 0, ii = widgetPermissions.length; i < ii; i++)
                        {
                           // Pipe-separation is a special case and indicates an "OR" match. The matched permission is stored in "activePermission" on the widget.
                           if (widgetPermissions[i].indexOf("|") !== -1)
                           {
                              orMatch = false;
                              orPermissions = widgetPermissions[i].split("|");
                              for (var j = 0, jj = orPermissions.length; j < jj; j++)
                              {
                                 if (obj.userAccess[orPermissions[j]])
                                 {
                                    orMatch = true;
                                    widget.set("activePermission", orPermissions[j], true);
                                    break;
                                 }
                              }
                              if (!orMatch)
                              {
                                 widget.set("disabled", true);
                                 break;
                              }
                           }
                           else if (!obj.userAccess[widgetPermissions[i]])
                           {
                              widget.set("disabled", true);
                              break;
                           }
                        }
                     }
                  }
               }
            }
         }
      }  
   });
})();