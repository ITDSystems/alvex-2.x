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

/**
 * FileUpload component.
 *
 * Checks if Flash is installed or not and uses either the FlashUpload or
 * HtmlUpload component.
 *
 * A multi file upload scenario could look like:
 *
 * var fileUpload = Alvex.getFileUploadInstance();
 * var multiUploadConfig =
 * {
 *    siteId: siteId,
 *    containerId: doclibContainerId,
 *    path: docLibUploadPath,
 *    filter: [],
 *    mode: fileUpload.MODE_MULTI_UPLOAD,
 * }
 * this.fileUpload.show(multiUploadConfig);
 *
 * If flash is installed it would use the FlashUpload component in multi upload mode
 * If flash isn't installed it would use the HtmlUpload in single upload mode instead.
 *
 * @namespace Alvex.component
 * @class Alvex.FileUpload
 * @extends Alvex.component.Base
 */
(function()
{
   /**
    * FileUpload constructor.
    *
    * FileUpload is considered a singleton so constructor should be treated as private,
    * please use Alvex.getFileUploadInstance() instead.
    *
    * @param {string} htmlId The HTML id of the parent element
    * @return {Alvex.FileUpload} The new FileUpload instance
    * @constructor
    * @private
    */
   Alvex.FileUpload = function(instanceId)
   {
      var instance = Alfresco.util.ComponentManager.get(instanceId);
      if (instance !== null)
      {
         throw new Error("An instance of Alvex.FileUpload already exists.");
      }

      Alvex.FileUpload.superclass.constructor.call(this, "Alvex.FileUpload", instanceId);

      return this;
   };

   YAHOO.extend(Alvex.FileUpload, Alfresco.component.Base,
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
          * Adobe Flash enable/disable flag (overrides client-side detection)
          * 
          * @property adobeFlashEnabled
          * @type boolean
          * @default true
          */
         adobeFlashEnabled: true,

         /**
          * Class name of Flash Uploader
          *
          * @property flashUploader
          * @type string
          * @default "Alfresco.FlashUpload"
          */
         flashUploader: "Alfresco.FlashUpload",

         /**
          * Class name of HTML Uploader
          *
          * @property flashUploader
          * @type string
          * @default "Alfresco.HtmlUpload"
          */
         htmlUploader: "Alfresco.HtmlUpload",
         
         /**
          * Class name of Drag-and-drop Uploader - also supports HTML5 file selection upload
          * 
          * @property dndUploader
          * @type string
          * @default "Alfresco.DNDUpload"
          */
         dndUploader: "Alfresco.DNDUpload"
      },
      
      /**
       * The uploader instance
       *
       * @property uploader
       * @type Alfresco.FlashUpload or Alfresco.HtmlUpload
       */
      uploader: null,

      /**
       * Shows uploader in single upload mode.
       *
       * @property MODE_SINGLE_UPLOAD
       * @static
       * @type int
       */
      MODE_SINGLE_UPLOAD: 1,

      /**
       * Shows uploader in single update mode.
       *
       * @property MODE_SINGLE_UPDATE
       * @static
       * @type int
       */
      MODE_SINGLE_UPDATE: 2,

      /**
       * Shows uploader in multi upload mode.
       *
       * @property MODE_MULTI_UPLOAD
       * @static
       * @type int
       */
      MODE_MULTI_UPLOAD: 3,

      /**
       * The default config for the gui state for the uploader.
       * The user can override these properties in the show() method to use the
       * uploader for both single & multi uploads and single updates.
       *
       * @property defaultShowConfig
       * @type object
       */
      defaultShowConfig:
      {
         siteId: null,
         containerId: null,
         destination: null,
         uploadDirectory: null,
         updateNodeRef: null,
         updateFilename: null,
         mode: this.MODE_MULTI_UPLOAD,
         filter: [],
         onFileUploadComplete: null,
         overwrite: false,
         thumbnails: null,
         htmlUploadURL: null,
         flashUploadURL: 'api/alvex/upload',
         username: null
      },

      /**
       * The merged result of the defaultShowConfig and the config passed in
       * to the show method.
       *
       * @property defaultShowConfig
       * @type object
       */
      showConfig: {},

      /**
       * Show can be called multiple times and will display the uploader dialog
       * in different ways depending on the config parameter.
       *
       * @method show
       * @param config {object} describes how the upload dialog should be displayed
       * The config object is in the form of:
       * {
       *    siteId: {string},        // site to upload file(s) to
       *    containerId: {string},   // container to upload file(s) to (i.e. a doclib id)
       *    destination: {string},   // destination nodeRef to upload to if not using site & container
       *    uploadPath: {string},    // directory path inside the component to where the uploaded file(s) should be save
       *    updateNodeRef: {string}, // nodeRef to the document that should be updated
       *    updateFilename: {string},// The name of the file that should be updated, used to display the tip
       *    mode: {int},             // MODE_SINGLE_UPLOAD, MODE_MULTI_UPLOAD or MODE_SINGLE_UPDATE
       *    filter: {array},         // limits what kind of files the user can select in the OS file selector
       *    onFileUploadComplete: null, // Callback after upload
       *    overwrite: false         // If true and in mode MODE_XXX_UPLOAD it tells
       *                             // the backend to overwrite a versionable file with the existing name
       *                             // If false and in mode MODE_XXX_UPLOAD it tells
       *                             // the backend to append a number to the versionable filename to avoid
       *                             // an overwrite and a new version
       *    htmlUploadURL: null,     // Overrides default url to post the file to if the html version is used
       *    flashUploadURL: null,    // Overrides default url to post the files to if the flash version is used
       *    username: null           // If a file should be associated with a user
       * }
       */
      show: function FU_show(config)
      {
         // Merge the supplied config with default config and check mandatory properties
         this.showConfig = YAHOO.lang.merge(this.defaultShowConfig, config);

         // If HTML5 isn't supported and flash isn't installed multi upload mode isn't supported
         if (!this.hasRequiredFlashPlayer && !this.browserSupportsHTML5 
                   && this.showConfig.mode == this.MODE_MULTI_UPLOAD)
         {
            this.showConfig.mode = this.MODE_SINGLE_UPLOAD;
         }

         if (this.showConfig.uploadURL)
         {
            // Do nothing
         }
         else if (this.hasRequiredFlashPlayer || this.browserSupportsHTML5)
         {
            this.showConfig.uploadURL = this.showConfig.flashUploadURL;
         }
         else
         {
            this.showConfig.uploadURL = this.showConfig.htmlUploadURL;
            this.showConfig.adobeFlashEnabled = this.options.adobeFlashEnabled && this.canAccessSession;
         }

         // Let the uploader instance show itself
         this.uploader.show(this.showConfig);
      },

      getReady: function()
      {
         // Only create a new instance the first time or if the user changed his mind using flash.
         if (this.uploader === null || (this.uploader.name == this.options.flashUploader && !this.options.adobeFlashEnabled))
         {
            // Determine minimum required Flash capability
            this.hasRequiredFlashPlayer = this.options.adobeFlashEnabled && !Alfresco.util.getVar("noflash") && Alfresco.util.hasRequiredFlashPlayer(9, 0, 45);

            // Firefox can not use flash uploader over SSL
            var isSSL = ( location.protocol == "https:" );
            var isFF = ( YAHOO.env.ua.gecko > 0 );
            this.browserAndProtoOk = !( isSSL && isFF );

            /**
             * Due to a Flash Player bug (https://bugs.adobe.com/jira/browse/FP-1044) only IE browsers
             * pick up the session from the browser, therefore the flash uploader is passed the session id
             * using javascript when instantiated so uploads can pass authenticatication details in all browsers.
             * If the server has been configured to use "httponly" cookies it will not be possible to access the
             * jsessionid using javascript and we must therefore fallback to the normal uploader for all non IE browsers.
             */
            if (this.hasRequiredFlashPlayer)
            {
               // If the session is available
               this.canAccessSession = ( YAHOO.env.ua.ie > 0 ) 
                                     || ( (YAHOO.util.Cookie.get("JSESSIONID") || "").length > 0 );
               this.flashAvailable = this.canAccessSession && this.browserAndProtoOk;
            }
            else
            {
               this.flashAvailable = false;
            }

            // Check to see whether the browser supports the HTML5 file upload API...
            this.browserSupportsHTML5 = (window.File && window.FileList);
            
            // Create the appropriate uploader component
            var uploadType;
            if (this.browserSupportsHTML5)
            {
               uploadType = this.options.dndUploader;
            }
            else if (this.flashAvailable)
            {
               uploadType = this.options.flashUploader;
            }
            else
            {
               // Report issue
               // We suppose that 'browserSupportsHTML5' is just 'false' and we have nothing to do about it.
               // Different types of Flash issues are handled in this block.
               var errorMsg;
               // Check for FF issue first, since there is no value in installing Flash if it will not work anycase.
               if( !this.browserAndProtoOk )
                  errorMsg = this.msg("message.error.firefoxFlashBug");
               // Check if flash plugin is installed
               else if( !this.hasRequiredFlashPlayer )
                  errorMsg = this.msg("message.error.neitherHTML5norFlash");
               // Check if this configuration issue
               else if( !this.canAccessSession )
                  errorMsg = this.msg("message.error.flashCanNotAccessSession");
               // Something strange happens
               else
                  errorMsg = this.msg("message.uploaderUnavailable");
               Alfresco.util.PopupManager.displayPrompt(
               {
                  title: this.msg("message.uploaderUnavailable"),
                  text: errorMsg
               });
               // Exit
               return false;
            }
            var uploadInstance = Alfresco.util.ComponentManager.findFirst(uploadType);
            // Workaround - patch flash uploader on the fly to set 1 concurrent upload.
            // We need this because otherwise we have issues with concurrent target folder creation.
            if( uploadType == this.options.flashUploader )
            {
               uploadInstance.onUploadButtonClick = function()
               {
                  if (this.state === this.STATE_BROWSING)
                  {
                     // Change the stat to uploading state and adjust the gui
                     var length = this.widgets.dataTable.getRecordSet().getLength();
                     if (length > 0)
                     {
                        this.state = this.STATE_UPLOADING;
                        this.widgets.uploadButton.set("disabled", true);
                        this.minorVersion.disabled = true;
                        this.majorVersion.disabled = true;
                        this.description.disabled = true;
                        this.uploader.disable();
                        this._updateStatus();
                     }
                     // And start uploading from the queue
                     this._uploadFromQueue(1);
                  }
               };	  
            }
            
            if (uploadInstance)
            {
               this.uploader = uploadInstance;
            }
            else
            {
               throw new Error("No instance of uploader type '" + uploadType + "' exists.");            
            }
         }

         // Workaround for workflow start page
         this.uploader.onReady();
         return true;
      },

      hide: function FU_hide()
      {
         if (this.uploader === null)
         {
            // If the uploader doesn't exist then there's nothing to hide!
         }
         else
         {
            this.uploader.hide();
         }
      }
   });
})();

Alvex.getFileUploadInstance = function()
{
   var instanceId = "alvex-fileupload-instance";
   return Alfresco.util.ComponentManager.get(instanceId) || new Alvex.FileUpload(instanceId);
};