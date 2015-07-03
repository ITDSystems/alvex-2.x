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
	var Dom = YAHOO.util.Dom,
		Event = YAHOO.util.Event,
		KeyListener = YAHOO.util.KeyListener;
	var $html = Alfresco.util.encodeHTML;

	Alvex.Uploader = function(htmlId)
	{
		Alvex.Uploader.superclass.constructor.call(this, "Alvex.Uploader", htmlId);
		YAHOO.Bubbling.on("formValueChanged", this.onExistingItemAttach, this);
		YAHOO.Bubbling.on("formContentReady", this.onFormContentReady, this);
		YAHOO.Bubbling.on("formContainerDestroyed", this.onFormDestroyed, this);
		YAHOO.Bubbling.on("uploaderDiscoveryReq", this.onDiscoveryRequest, this);
		YAHOO.Bubbling.on("uploaderDiscoveryResp", this.onDiscoveryResponse, this);
		YAHOO.Bubbling.on("uploaderAddFilesReq", this.onAddFilesRequest, this);
		YAHOO.Bubbling.on("uploaderSetTargetSite", this.onSetTargetSite, this);

		return this;
	};

	YAHOO.extend(Alvex.Uploader, Alfresco.component.Base,
	{
		options:
		{
			// File list itself
			files: [],
			// Form mode
			mode: null,
			multipleSelectMode: true,
			// Uploader itself
			uploader: null,
			// Data table to show files
			dataTable: null,
			dataSource: null,
			// If control is in disabled mode
			disabled: false,
			adobeFlashEnabled: true,
			// Picker object from standard file picker to attach existing files
			picker: null,
			regPicker: null,
			packageItemActionGroup: '',
			pickerRoot: '',
			allowedExtensions: '',
			destination: '',
			createUploadDirectory: '',
			createUploadDirectoryHierarchy: '',
			contentType: '',
			viewType: "normal",
			init: false,
			oldItemsProcessed: false,
			isInRelatedWorkflowForm: false,
			uploaderId: null,
			parentUploaderId: null,
			// Target site where we should upload content
			siteId: null
		},
		
		ATTACH_FROM_LOCAL_DISK: 1,
		ATTACH_FROM_REPO: 2,
		
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
			mode: null,
			siteId: null,
			containerId: null,
			destination: null,
			uploadDirectory: null,
			updateNodeRef: null,
			updateFilename: null,
			filter: [],
			onFileUploadComplete: null,
			overwrite: false,
			thumbnails: null,
			htmlUploadURL: null,
			flashUploadURL: null,
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
		
		onDiscoveryRequest: function(ev, param)
		{
			if (param[1].split(',').indexOf(this.options.uploaderId) != -1)
				YAHOO.Bubbling.fire('uploaderDiscoveryResp', this.id);
		},
		
		onDiscoveryResponse: function(ev, param)
		{
			if (this.id != param[1])
			{
				this.initUiWithFiles( true, Dom.get(param[1]+'-cntrl-current').value.split(',') );
				// FIXME this is an ugly hack to not process an event few times
				YAHOO.Bubbling.unsubscribe("uploaderDiscoveryResp", this.onDiscoveryResponse, this);
			}
		},
		
		onSetTargetSite: function(ev, param)
		{
			this.options.siteId = param[1];
		},
		
		onAddFilesRequest: function(ev, param)
		{
			if (this.options.uploaderId == param[1].uploader)
			{
				var existingFiles = Dom.get(this.id + "-cntrl-current").value.split(',');
				var files = Alvex.util.diffArrays(param[1].files.split(','), existingFiles)
				this.initUiWithFiles(true, files);
			}
		},
		
		onFormDestroyed: function(layer, args)
		{
			YAHOO.Bubbling.unsubscribe("formValueChanged", this.onExistingItemAttach, this);
			YAHOO.Bubbling.unsubscribe("formContentReady", this.onFormContentReady, this);
			YAHOO.Bubbling.unsubscribe("formContainerDestroyed", this.onFormDestroyed, this);
			YAHOO.Bubbling.unsubscribe("uploaderDiscoveryReq", this.onDiscoveryRequest, this);
			YAHOO.Bubbling.unsubscribe("uploaderDiscoveryResp", this.onDiscoveryResponse, this);
			YAHOO.Bubbling.unsubscribe("uploaderAddFilesReq", this.onAddFilesRequest, this);
			YAHOO.Bubbling.unsubscribe("uploaderSetTargetSite", this.onSetTargetSite, this);
		},
		
		onReady: function Uploader_init()
		{
			// WA
			if( this.options.regPicker && this.options.regPicker !== null )
				this.options.regPicker.onReady();
			// We don't init by onReady event for edit and create forms 
			//		because it causes init BEFORE form is ready
			// In this case flash layer is generated in some strange place and it does not work
			// We do init by onReady event for view forms 
			//		because it's the only event for them and we don't need flash layer for view forms
			if( !this.options.init && (this.options.mode == 'view') )
				this.init();
		},
		
		onFormContentReady: function Uploader_onFormContentReady()
		{
			if( !this.options.init )
				this.init();
		},
		
		init: function ()
		{
			this.options.init = true;
			if( !this.options.siteId || this.options.siteId == '' )
				this.options.siteId = (Alfresco.constants.SITE != '' ? Alfresco.constants.SITE : null);
			if( !this.options.disabled )
				this.createUploader();
			this.checkParentUploader();
			this.initUI();
			if (this.options.parentUploaderId)
				YAHOO.Bubbling.fire('uploaderDiscoveryReq', this.options.parentUploaderId);
		},
		
		// Check parent-child relations between uploaders in related workflows
		checkParentUploader: function ()
		{
			// Find if we work in base workflow form or in related workflow popup dialog
			this.options.isInRelatedWorkflowForm = Alvex.util.isInRelatedWorkflowForm(this.id);
			// If relation was configured manually - just exis
			if( (this.options.uploaderId != null) || (this.options.parentUploaderId != null) )
				return;
			// If nothing was configured - set defaults
			if( this.options.isInRelatedWorkflowForm ) {
				this.options.parentUploaderId = '*';
			} else {
				this.options.uploaderId = '*';
			}
		},
		
		showUploadDialog: function()
		{
			var config = {
				destination: this.options.destination,
				uploadDirectory: this.getUploadDirectory(),
				createUploadDirectory: this.options.createUploadDirectory,
				siteId: this.options.siteId,
				containerId: 'documentLibrary',
				contentType: this.options.contentType,
				uploadURL: 'api/alvex/upload',
                mode: (this.options.multipleSelectMode ? this.uploader.MODE_MULTI_UPLOAD : this.uploader.MODE_SINGLE_UPLOAD),
                onFileUploadComplete: {
					fn: this.onUploadSuccess,
					scope: this
				}
			};
			this.showConfig = YAHOO.lang.merge(this.defaultShowConfig, config);
			this.uploader.show(this.showConfig);
		},
		
		onUploadSuccess: function(result)
		{
			for( var i = 0; i < result.successful.length; i++ )
			{
				var file = result.successful[i];
				this.options.files.push({
						name: file.fileName,
						nodeRef: file.nodeRef,
						modifier: Alfresco.constants.USERNAME,
						modified: new Date(),
						allowDelete: true,
						type: this.ATTACH_FROM_LOCAL_DISK
					});
				// Simply add to *-added because the file was just uploaded and can not be in *-removed
				this.addRefToControl( this.id + "-cntrl-added", file.nodeRef );
				// Update these fields to ensure current value will be correct any case 
				//	(think about intersection with default picker that clears fieldHtmlId)
				this.addRefToControl( this.id + "-cntrl-current", file.nodeRef );
				this.addRefToControl( this.id, file.nodeRef );

			}
			this.update();
		},
		
		createUploader: function Uploader_createUploader()
		{
			if( (!this.options.disabled) && (Dom.get(this.id + "-cntrl-addFilesButton") != null) )
			{
				this.addFilesButton = new YAHOO.widget.Button(this.id + "-cntrl-addFilesButton", 
								{ onclick: { fn: this.showUploadDialog, obj: null, scope: this } });
				this.uploader = Alvex.getFileUploadInstance().setOptions(
				{
					// We ignore flash disable option for the moment,
					// since it is the only available transport for IE.
					// adobeFlashEnabled: this.options.adobeFlashEnabled
					adobeFlashEnabled: true
				});
				var isReady = this.uploader.getReady();
				if( !isReady && this.addFilesButton )
					this.addFilesButton.set("disabled", true);
			}
		},
		
		// This function creates datatable and inits its state
		initUI: function Uploader_initUI()
		{
			if( Dom.get(this.id + "-cntrl-dataTableContainer") != null)
			{
				// Add table template to UI.
				this.createDataTable();

				// Usually UI events regarding existing packageItems are triggered by picker. But:
				//    (a) if it is forbidden to add new items - there is no picker,
				//    (b) if there is no files - picker does not trigger event,
				//    (c) in form.mode == 'view' picker does not trigger event.
				// In this case we should cover it, process existing files and set 'started' state manually.
				// Otherwise 'onExistingItemAttach' will go crazy on the first run because 'started' state is not set.
				if( !(this.options.picker) || (Dom.get(this.id).value == '') || (this.options.disabled) )
					this.attachOldItems();

				// Remember initial value
				Dom.get(this.id + "-cntrl-initial").value = Dom.get( this.id ).value;
			}
		},
		
		// This function is called when existing files from repo are attached with standard picker
		onExistingItemAttach: function Uploader_onExistingItemAttach(layer, args)
		{
			// Skip 'formValueChanged' from all form components except our 'embedded' picker
			// TODO: rewrite with $hasEventInterest
			var pickerId = args[1].eventGroup.pickerId;
			if( !(pickerId) || (pickerId != this.id + '-cntrl-picker' && pickerId != this.id + '-reg-cntrl-picker' 
								&& pickerId != this.id + '-cntrl' && pickerId != this.id + '-reg-cntrl') )
				return;

			var picker = null;
			var el = null;
			// TODO: rewrite with $hasEventInterest
			if( pickerId === this.id + '-cntrl-picker'
					|| pickerId === this.id + '-cntrl')
			{
				picker = this.options.picker;
				el = Dom.get( this.id );
			}
			// TODO: rewrite with $hasEventInterest
			else if( pickerId === this.id + '-reg-cntrl-picker' 
					|| pickerId === this.id + '-reg-cntrl')
			{
				picker = this.options.regPicker;
				el = Dom.get( this.id + '-reg' );
			}
			// Clear standard picker state
			if( picker )
			{
				picker.selectedItems = {}; 
				picker.singleSelectedItem = null;
				//YAHOO.Bubbling.fire("parentChanged",
				//{
				//	eventGroup: this.options.picker,
				//	label: '',
				//	nodeRef: this.options.pickerRoot
				//});
			}

			// Handle 'valueChange' that happens on form load
			if( !this.options.oldItemsProcessed )
			{
				// We need this complex condition to ensure we call attachOldItems only once
				// for any enabled / disabled picker combination
				if( ( this.options.picker && (pickerId === this.id + '-cntrl-picker') ) 
						|| ( !this.options.picker && (pickerId === this.id + '-reg-cntrl-picker') ) )
				{
					this.attachOldItems();
				}
				return;
			}

			// Process newly attached files
			var items = el.value.split(',');
			var curItems = Dom.get( this.id + "-cntrl-current" ).value.split(',');
			var newItems = [];
			for( var i in items )
			{
				var isNew = true;
				for( var j in curItems )
					if( items[i] == curItems[j] )
						isNew = false;
				if( isNew )
				{
					newItems.push( items[i] );
				}
			}
			// Add new files to control and UI
			this.addFilesFromRepo( newItems );
		},

		attachOldItems: function ()
		{
			if ( (this.options.packageItemActionGroup == "remove_package_item_actions")
					|| (this.options.packageItemActionGroup == "edit_and_remove_package_item_actions")
					|| (this.options.packageItemActionGroup == "start_package_item_actions") ) {
				this.initUiWithFiles( true, Dom.get(this.id).value.split(',') );
			} else if (this.options.packageItemActionGroup != "") {
				this.initUiWithFiles( false, Dom.get(this.id).value.split(',') );
			}
			this.options.oldItemsProcessed = true;
		},
		
		// Not nice, really. Rethink it.
		getUploadDirectory: function Uploader_getUploadDirectory()
		{
			var uploadDirectory = this.options.uploadDirectory;
			var createHierarchy = this.options.createUploadDirectoryHierarchy;

			if(createHierarchy === 'true') {
				var cur_date = new Date();
				var year = cur_date.getFullYear();

				var month = cur_date.getMonth() + 1;
				if(month < 10) { month = "0" + month; }

				var day = cur_date.getDate();
				if(day < 10) { day = "0" + day; }

				var hours = cur_date.getHours();
				if(hours < 10) { hours = "0" + hours; }

				var mins = cur_date.getMinutes();
				if(mins < 10) { mins = "0" + mins; }

				var secs = cur_date.getSeconds();
				if(secs < 10) { secs = "0" + secs; }

				var userName = Alfresco.constants.USERNAME;

				// Use hierarchy to avoid too many files in one flat folder that slows down everything
				uploadDirectory += '/' + year + '/' + month + '/' + day + '/' 
							+ hours + '-' + mins + '-' + secs + '--' + userName;
			}

			return uploadDirectory;
		},
		
		activateWorkflowButtons: function Uploader_activateWorkflowButtons()
		{
			YAHOO.Bubbling.fire("mandatoryControlValueUpdated", this);
		},
		
		addFilesFromRepo: function(nodeRefs)
		{
			var req = {};
			req['items'] = nodeRefs;
			req['itemValueType'] = 'nodeRef';
			
			Alfresco.util.Ajax.jsonRequest({
				url: Alfresco.constants.PROXY_URI + "api/alvex/forms/picker/items",
				method:Alfresco.util.Ajax.POST,
				dataObj: req,
				successCallback:
				{
					fn:function(resp)
					{
						for( var i = 0; i < resp.json.data.items.length; i++ )
						{
							var file = resp.json.data.items[i];
							
							// Check for duplicates
							var existing = false;
							for( var j = 0; j < this.options.files.length; j++ )
							{
								if(this.options.files[j].nodeRef === file.nodeRef)
									existing = true;
							}
							if(existing)
								continue;
							
							this.options.files.push({
								name: file.name,
								nodeRef: file.nodeRef,
								modifier: file.modifier,
								modified: ( file.modified && file.modified != null
											? Alfresco.util.fromISO8601(file.modified) : new Date() ),
								allowDelete: true,
								isMetadataOnly: /\/dataLists\//.test(file.displayPath),
								type: this.ATTACH_FROM_REPO
							});
							// Simply add to *-added because the file was just uploaded and can not be in *-removed
							// FIXME - think about the following case:
							// 	- Document was auto-generated in workflow transition
							// 	- The next stage allows editing document package
							// 	- Picker triggers events, items go into *-added and copies are created
							// See commit of Thu Sep 19 23:20:56 2013 for details
							this.addRefToControl( this.id + "-cntrl-added", file.nodeRef );
							// Update current field to ensure current value will be correct any case 
							this.addRefToControl( this.id + "-cntrl-current", file.nodeRef );
						}
						// WA for intersection with default picker that clears fieldHtmlId
						Dom.get(this.id).value = Dom.get(this.id + "-cntrl-current").value;
						this.update();
					},
					scope: this
				}
			});
		},
		
		sortNewestFirst: function(a,b)
		{
			if (a.modified == undefined || b.modified == undefined || a.created == undefined || b.created == undefined)
				return 0;

			if (a.modified < b.modified)
				return 1;
			if (a.modified > b.modified)
				return -1;
			if (a.created < b.created)
				return 1;
			if (a.created > b.created)
				return -1;
			return 0;
		},

		// Gets the list of existing files uploaded on other workflow stages and adds them to the list
		initUiWithFiles: function (_allowDelete, fileRefs)
		{
			var req = {};
			req['items'] = fileRefs;
			req['itemValueType'] = 'nodeRef';
			
			Alfresco.util.Ajax.jsonRequest({
				url: Alfresco.constants.PROXY_URI + "api/alvex/forms/picker/items",
				method:Alfresco.util.Ajax.POST,
				dataObj: req,
				successCallback:
				{
					fn:function(resp)
					{
						var files = resp.json.data.items;
						files.sort(this.sortNewestFirst);
						for( var i = 0; i < files.length; i++ )
						{
							var file = files[i];
							this.options.files.push({
								name: file.name,
								nodeRef: file.nodeRef,
								modifier: file.modifier,
								modified: ( file.modified && file.modified != null
											? Alfresco.util.fromISO8601(file.modified) : new Date() ),
								allowDelete: _allowDelete,
								isMetadataOnly: /\/dataLists\//.test(file.displayPath),
								type: this.ATTACH_FROM_REPO
							});
							// Update current field to ensure current value will be correct any case 
							this.addRefToControl( this.id + "-cntrl-current", file.nodeRef );
						}
						// WA for intersection with default picker that clears fieldHtmlId
						Dom.get(this.id).value = Dom.get(this.id + "-cntrl-current").value;
						this.update();
					},
					scope: this
				}
			});
		},
		
		// Creates new datatable
		createDataTable: function Uploader_createDataTable()
		{
			var me = this;
			
			// Hook action events
			var fnActionHandler = function fnActionHandler(layer, args)
			{
				var owner = YAHOO.Bubbling.getOwnerByTagName(args[1].anchor, "div");
				if (owner !== null)
				{
					if (typeof me[owner.className] == "function")
					{
						args[1].stop = true;
						var asset = me.options.dataTable.getRecord(args[1].target.offsetParent).getData();
						me[owner.className].call(me, asset, owner);
					}
				}
				return true;
			};
			YAHOO.Bubbling.addDefaultAction(this.id + "-action-link", fnActionHandler, true);

			var nameColWidth, statusColWidth, actionsColWidth;
			if( this.options.viewType === "mini" )
			{
				nameColWidth = 300;
				statusColWidth = 100;
				actionsColWidth = 100;
			}
			else if( this.options.viewType === "micro" )
			{
				nameColWidth = 200;
				statusColWidth = 60;
				actionsColWidth = 75;
			}
			else
			{
				nameColWidth = 200;
				statusColWidth = 200;
				actionsColWidth = 100;
			}

			var columnDefs =
				[
					{
						key: "name", label: this.msg("alvex.uploader.filename"), 
						sortable: false, resizeable: true, width: nameColWidth,
						formatter: this.formatNameField
					},
					{
						key: "nodeRef", label: '', 
						sortable: false, resizeable: true, width: statusColWidth,
						formatter: this.formatStatusField
					},
					{
						key: "", label: '', 
						sortable: false, resizeable: true, width: actionsColWidth,
						formatter: this.formatActionsField
					}
				];
			
			this.options.dataSource = new YAHOO.util.DataSource(this.options.files);
			this.options.dataSource.responseType = YAHOO.util.DataSource.TYPE_JSARRAY;
			this.options.dataSource.responseSchema = {
				fields: ["name", "nodeRef", "modifier", "modified", "allowDelete", "isMetadataOnly", "type"]
			};
			
			this.options.dataTable = new YAHOO.widget.DataTable(this.id + "-cntrl-dataTableContainer",
					columnDefs, this.options.dataSource, {
						selectionMode:"single",
						renderLoopSize: 32,
						MSG_EMPTY: this.msg('alvex.uploader.no_files')
					});
			
			// Enable row highlighting
			this.options.dataTable.subscribe("rowMouseoverEvent", this.onEventHighlightRow, this, true);
			this.options.dataTable.subscribe("rowMouseoutEvent", this.onEventUnhighlightRow, this, true);
			
			// Add link to main object to access it from formatters
			this.options.dataTable.uploader = me;
		},
		
		onEventHighlightRow: function DataGrid_onEventHighlightRow(oArgs)
		{
			// Call through to get the row highlighted by YUI
			// this.widgets.dataTable.onEventHighlightRow.call(this.widgets.dataTable, oArgs);

			var elActions = Dom.get(this.id + "-actions-" + oArgs.target.id);
			Dom.removeClass(elActions, "hidden");
		},
		
		onEventUnhighlightRow: function DataGrid_onEventUnhighlightRow(oArgs)
		{
			// Call through to get the row unhighlighted by YUI
			// this.widgets.dataTable.onEventUnhighlightRow.call(this.widgets.dataTable, oArgs);

			var elActions = Dom.get(this.id + "-actions-" + (oArgs.target.id));
			Dom.addClass(elActions, "hidden");
		},
		
		formatNameField: function (elLiner, oRecord, oColumn, oData)
		{
			var filename = oRecord._oData.name;
			var ref = oRecord._oData.nodeRef;
			var modifier = oRecord._oData.modifier;
			var modified = oRecord._oData.modified;
			
			var link = '';
			if(ref != null) {
				link = '<a href="' + this.uploader.getViewUrl(oRecord._oData) 
					+ '" target="_blank" ' + 'title="' + this.uploader.msg('actions.document.view') + '">' 
					+ filename + '</a>';
			} else {
				link = filename;
			}
			
			if( modifier != null )
				link += '<br/>' + this.uploader.msg("label.modifier") + ': ' + modifier;
			
			if( modified == null )
				modified = new Date();
			
			link += '<br/>' + this.uploader.msg("label.modified") + ': ' 
				+ modified.getDate() + '.' + (modified.getMonth()+1) + '.' + modified.getFullYear();
			
			elLiner.innerHTML = link;
		},
		
		formatStatusField: function (elLiner, oRecord, oColumn, oData)
		{
			elLiner.innerHTML = '<img src="' + Alfresco.constants.URL_RESCONTEXT 
					+ 'components/alvex/uploader/complete-16.png' + '"/> ' 
					+ this.uploader.msg('label.ok');
		},
		
		formatActionsField: function (elLiner, oRecord, oColumn, oData)
		{
			var clb, msg;
			var id = this.uploader.id;
			var allowDelete = oRecord._oData.allowDelete;
			var canDownload = ! oRecord._oData.isMetadataOnly;
			
			var html = '<div id="' + id + '-actions-' + oRecord.getId() + '" class="hidden action">';
			
			msg = this.uploader.msg('actions.document.view');
			clb = 'viewFile';
			
			html += '<div class="' + clb + '"><a target="_blank" href="" ' 
					+ 'class="alvex-uploader-action-link ' + id + '-action-link"' 
					+ 'title="' + msg +'"><span>' + msg + '</span></a></div>';
			
			if( canDownload )
				clb = 'downloadFile';
			else
				clb = 'downloadFileDisabled';
			
			msg = this.uploader.msg('actions.document.download');
			html += '<div class="' + clb + '"><a target="_blank" href="" ' 
					+ 'class="alvex-uploader-action-link ' + id + '-action-link" ' 
					+ 'title="' + msg +'"><span>' + msg + '</span></a></div>';
			
			if( allowDelete && (this.uploader.options.mode != 'view') )
			{
				msg = this.uploader.msg('button.delete');
				clb = 'deleteFile';
			
				html += '<div class="' + clb + '"><a target="_blank" href="" ' 
						+ 'class="alvex-uploader-action-link ' + id + '-action-link"' 
						+ 'title="' + msg +'"><span>' + msg + '</span></a></div>';
			}
			
			html += '</div>';

			elLiner.innerHTML = html;
		},
		
		update: function ()
		{
			this.options.dataSource.sendRequest(
				null,
				{
					success: this.options.dataTable.onDataReturnInitializeTable, 
					scope: this.options.dataTable
				}
			);
			if( ! this.options.disabled )
			{
				if( this.options.files && this.options.files.length > 0 
						&& ! this.options.multipleSelectMode )
				{
					if( this.addFilesButton )
						this.addFilesButton.set("disabled", true);
					if( this.options.picker && this.options.picker.widgets.addButton )
						this.options.picker.widgets.addButton.set("disabled", true);
					if( this.options.regPicker && this.options.regPicker.widgets.addButton )
						this.options.regPicker.widgets.addButton.set("disabled", true);
				}
				else
				{
					if( this.addFilesButton )
						this.addFilesButton.set("disabled", false);
					if( this.options.picker && this.options.picker.widgets.addButton )
						this.options.picker.widgets.addButton.set("disabled", false);
					if( this.options.regPicker && this.options.regPicker.widgets.addButton )
						this.options.regPicker.widgets.addButton.set("disabled", false);
				}
			}
			this.activateWorkflowButtons();
		},
		
		downloadFileDisabled: function(obj)
		{
			this.downloadFile(obj);
		},
		
		downloadFile: function(obj)
		{
			if( obj.isMetadataOnly )
			{
				Alfresco.util.PopupManager.displayMessage( { 
						text: this.msg("alvex.uploader.canNotDownloadEmptyFile")
				} );
			} else {
				window.open( Alfresco.constants.PROXY_URI + 'api/node/content/' 
					+ Alfresco.util.NodeRef(obj.nodeRef).uri + '/' + obj.name );
			}
		},
		
		viewFile: function(obj)
		{
			window.open( this.getViewUrl(obj) );
		},
		
		getViewUrl: function(obj)
		{
			if( obj.isMetadataOnly )
				return Alfresco.constants.URL_PAGECONTEXT + 'view-metadata?nodeRef=' + obj.nodeRef;
			else
				return Alfresco.constants.URL_PAGECONTEXT + 'document-details?nodeRef=' + obj.nodeRef;
		},
		
		deleteFile: function(obj)
		{
			// Server-side
			// Remove local attaches only, do not delete repo links
			if( obj.type == this.ATTACH_FROM_LOCAL_DISK )
			{
				var deleteUrl = Alfresco.constants.PROXY_URI + 'api/node/' 
					+ Alfresco.util.NodeRef( obj.nodeRef ).uri;
				Alfresco.util.Ajax.jsonRequest({
					url: deleteUrl,
					method: Alfresco.util.Ajax.DELETE
				});
			}
			
			// Client-side - update control fields
			if( obj.nodeRef != null )
			{
				// Check recently added files and remove ref from *-added if matches
				this.removeRefFromControl( this.id + "-cntrl-added", obj.nodeRef );
				// Check overall control value and remove ref if matches
				this.removeRefFromControl( this.id + "-cntrl-current",obj.nodeRef );
				this.removeRefFromControl( this.id, obj.nodeRef );
				
				// Check initial state with ref to remove and add ref to *-removed if matches
				var oldRefs = Dom.get( this.id + "-cntrl-initial" ).value.split(',');
				for( var i = 0; i < oldRefs.length; i++ )
					if( obj.nodeRef == oldRefs[i] ) 
						this.addRefToControl( this.id + "-cntrl-removed", obj.nodeRef );
			}

			// Client-side - remove from table, update UI
			var rowNum = -1;
			for( var i = 0; i < this.options.files.length; i++ )
				if( obj.nodeRef == this.options.files[i].nodeRef )
					rowNum = i;
			this.options.files.splice( rowNum, 1 );
			this.update();
		},
		
		removeRefFromControl: function Uploader_removeRefFromControl(controlId, nodeRef)
		{
			var field = Dom.get(controlId);
			var refs = field.value.split(',');
			field.value = '';
			for( var i = 0; i < refs.length; i++ )
				if( (refs[i] != '') && (nodeRef != refs[i]) )
					this.addRefToControl(controlId, refs[i]);
		},
		
		addRefToControl: function Uploader_addRefToControl(controlId, nodeRef)
		{
			var field = Dom.get(controlId);
			if( field.value != '' )
				field.value += ',' + nodeRef;
			else
				field.value = nodeRef;
		}
	});
})();
