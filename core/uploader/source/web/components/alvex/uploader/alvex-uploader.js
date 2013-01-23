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
		YAHOO.Bubbling.on("uploaderRemoveFile", this.onCancelUploadClick, this);
		YAHOO.Bubbling.on("formVisibilityChanged", this.recalcUILayer, this);
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
			// Form mode
			mode: null,
			// Uploader itself
			uploader: null,
			// List of files to upload
			uploadQueue: [],
			// Hash to map files ids to row nums
			fileIdHash: {},
			// Hash to map ids in events and real 'long' ids
			eventIdHash: {},
			// Data table to show files
			dataTable: null,
			dataSource: null,
			// If control is in disabled mode
			disabled: false,
			// Picker object from standard file picker to attach existing files
			picker: null,
			packageItemActionGroup: '',
			pickerRoot: '',
			allowedExtensions: '',
			destination: '',
			createUploadDirectory: '',
			createUploadDirectoryHierarchy: '',
			contentType: '',
			viewType: "mini",
			init: false,
			oldItemsProcessed: false,
			isInRelatedWorkflowForm: false,
			uploaderId: null,
			parentUploaderId: null,
			// Target site where we should upload content
			siteId: ''
		},

		onDiscoveryRequest: function(ev, param)
		{
			if (param[1].split(',').indexOf(this.options.uploaderId) != -1)
				YAHOO.Bubbling.fire('uploaderDiscoveryResp', this.id);
		},

		onDiscoveryResponse: function(ev, param)
		{
			if (this.id != param[1])
			{
				YAHOO.util.Dom.get(this.id+'-cntrl-added').value = YAHOO.util.Dom.get(param[1]+'-cntrl-current').value;
				this.addExistingFiles(true, this.id+'-cntrl-added');
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
				var existingFiles = YAHOO.util.Dom.get(this.id + "-cntrl-current").value.split(',');
				var files = Alvex.util.diffArrays(param[1].files.split(','), existingFiles)
				if( YAHOO.util.Dom.get(this.id+'-cntrl-added').value != '')
					YAHOO.util.Dom.get(this.id+'-cntrl-added').value 
						= YAHOO.util.Dom.get(this.id+'-cntrl-added').value + ',' + files.join(',');
				else
					YAHOO.util.Dom.get(this.id+'-cntrl-added').value = files.join(',');
				this.addExistingFiles(true, null, files.join(','));
			}
		},

		onFormDestroyed: function f(layer, args)
		{
			YAHOO.Bubbling.unsubscribe("formValueChanged", this.onExistingItemAttach, this);
			YAHOO.Bubbling.unsubscribe("formContentReady", this.onFormContentReady, this);
			YAHOO.Bubbling.unsubscribe("uploaderRemoveFile", this.onCancelUploadClick, this);
			YAHOO.Bubbling.unsubscribe("formVisibilityChanged", this.recalcUILayer, this);
			YAHOO.Bubbling.unsubscribe("formContainerDestroyed", this.onFormDestroyed, this);
		},

		onReady: function Uploader_init()
		{
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

		init: function f()
		{
			this.options.init = true;
			if( this.options.siteId == '' )
				this.options.siteId = Alfresco.constants.SITE;
			if( !this.options.disabled )
				this.createUploader();
			this.checkParentUploader();
			this.initUI();
			if (this.options.parentUploaderId)
				YAHOO.Bubbling.fire('uploaderDiscoveryReq', this.options.parentUploaderId);
		},
		
		// Check parent-child relations between uploaders in related workflows
		checkParentUploader: function f()
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

		createUploader: function Uploader_createUploader()
		{
			if( (!this.options.disabled) && (document.getElementById(this.id + "-cntrl-addFilesButton") != null) )
			{
				var addFilesButton = new YAHOO.widget.Button(this.id + "-cntrl-addFilesButton");

				this.recalcUILayer();

				// Custom URL for the uploader swf file (same folder).
				YAHOO.widget.Uploader.SWFURL = Alfresco.constants.URL_CONTEXT+"yui/uploader/assets/uploader.swf";

				// Instantiate the uploader and write it to its placeholder div.
				this.options.uploader = new YAHOO.widget.Uploader( this.id + "-cntrl-uploaderOverlay" );

				if( !Alfresco.util.hasRequiredFlashPlayer(9, 0, 45) ) {
					addFilesButton.set("disabled", true);
					var warnEl = Dom.get(this.id + "-cntrl-warnMessage");
					warnEl.innerHTML = $html( this.msg("alvex.uploader.flash_not_found") );
					return;
				}

				// Add event listeners to various events on the uploader.
				// Methods on the uploader should only be called once the 
				// contentReady event has fired.
				this.options.uploader.on('contentReady', this.onUploaderReady, null, this);
				this.options.uploader.on('fileSelect', this.onFileSelect, null, this);
				this.options.uploader.on('uploadStart', this.onUploadStart, null, this);
				this.options.uploader.on('uploadProgress', this.onUploadProgress, null, this);
				this.options.uploader.on('uploadCancel', this.onUploadCancel, null, this);
				this.options.uploader.on('uploadComplete', this.onUploadComplete, null, this);
				this.options.uploader.on('uploadCompleteData', this.onUploadResponse, null, this);
				this.options.uploader.on('uploadError', this.onUploadError, null, this);
				this.options.uploader.on('click', this.onUploaderClick, null, this);
			}
		},

		recalcUILayer: function f()
		{
			// Update UI layer for uploader
			var uiLayer = YAHOO.util.Dom.getRegion(this.id + "-cntrl-addFilesButton");
			var overlay = YAHOO.util.Dom.get(this.id + "-cntrl-uploaderOverlay");
			YAHOO.util.Dom.setStyle(overlay, 'width', uiLayer.right-uiLayer.left + "px");
			YAHOO.util.Dom.setStyle(overlay, 'height', uiLayer.bottom-uiLayer.top + "px");
		},

		// This function creates datatable and inits its state
		initUI: function Uploader_initUI()
		{
			if( document.getElementById(this.id + "-cntrl-dataTableContainer") != null)
			{
				// Add table template to UI.
				this.createDataTable();

				// Usually UI events regarding existing packageItems are triggered by picker. But:
				//    (a) if it is forbidden to add new items - there is no picker,
				//    (b) if there is no files - picker does not trigger event,
				//    (c) in form.mode == 'view' picker does not trigger event.
				// In this case we should cover it, process existing files and set 'started' state manually.
				// Otherwise 'onExistingItemAttach' will go crazy on the first run because 'started' state is not set.
				if( !(this.options.picker) || (document.getElementById(this.id).value == '') || (this.options.disabled) )
					this.attachOldItems();

				// Remember initial value
				document.getElementById(this.id + "-cntrl-initial").value 
							= document.getElementById( this.id ).value;
			}
		},

		// This function is called when existing files from repo are attached with standard picker
		onExistingItemAttach: function Uploader_onExistingItemAttach(layer, args)
		{
			// Skip 'formValueChanged' from all form components except our 'embedded' picker
			var pickerId = args[1].eventGroup.pickerId;
			if( !(pickerId) || (pickerId != this.id + '-cntrl-picker') )
				return;

			// Clear standard picker state
			this.options.picker.selectedItems = {}; 
			this.options.picker.singleSelectedItem = null;
			YAHOO.Bubbling.fire("parentChanged",
			{
				eventGroup: this.options.picker,
				label: '',
				nodeRef: this.options.pickerRoot
			});

			// Handle 'valueChange' that happens on form load
			if( !this.options.oldItemsProcessed ) {
				this.attachOldItems();
				return;
			}

			// Move newly attached files to *-added field
			var items = document.getElementById( this.id ).value.split(',');
			var cur_items = Dom.get( this.id + "-cntrl-current" ).value.split(',');
			var new_items = [];
			for( var i in items )
			{
				var isNew = true;
				for( var j in cur_items )
					if( items[i] == cur_items[j] )
						isNew = false;
				if( isNew )
					new_items.push( items[i] );
			}
			if( new_items.length > 0 )
			{
				document.getElementById(this.id + "-cntrl-added").value += ',' + new_items.join(',');
				// Update UI
				this.addExistingFiles(true);
			}
		},

		attachOldItems: function f()
		{
			if ( (this.options.packageItemActionGroup == "remove_package_item_actions")
					|| (this.options.packageItemActionGroup == "edit_and_remove_package_item_actions")
					|| (this.options.packageItemActionGroup == "start_package_item_actions") ) {
				this.addExistingFiles(true);
			} else if (this.options.packageItemActionGroup != "") {
				this.addExistingFiles(false);
			}
			this.options.oldItemsProcessed = true;
		},

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

		// When the Flash layer is clicked, the "Browse" dialog is invoked.
		// The click event handler allows you to do something else if you need to.
		onUploaderClick: function Uploader_onUploaderClick()
		{
		},

		// When contentReady event is fired, you can call methods on the uploader.
		onUploaderReady: function Uploader_onUploaderReady()
		{
			// Allows the uploader to send log messages to trace, as well as to YAHOO.log
			this.options.uploader.setAllowLogging(true);

			// Allows multiple file selection in "Browse" dialog.
			this.options.uploader.setAllowMultipleFiles(true);

			// New set of file filters.
			var ff = new Array({	description: this.msg("alvex.uploader.allowedExtensions"), 
						extensions: this.options.allowedExtensions });

			// Apply new set of file filters to the uploader.
			this.options.uploader.setFileFilters(ff);
		},

		// Checks upload status. Works with one upload in parallel for now.
		// If there is no upload in progress - starts new one.
		// If all uploads are complete without errors - sets result value.
		recheckUploads: function Uploader_recheckUploads(entries)
		{
			if (entries != null) {

				// If all files are uploaded
				var files_ready = true;

				if(entries.length == 0) {
					files_ready = false;
				}

				for(var i in entries) {

					var entry = entries[i];

					// If we have upload in progress:
					// (a) files are not ready
					// (b) stop looping through because we allow only 1 parallel upload
					if(entry.status == "in_progress") {
						files_ready = false;
						break;
					}

					// If we found upload that is not started yet:
					// (a) files are not ready
					// (b) start it
					// (c) stop looping through because we allow only 1 parallel upload
					else if(entry.status == "not_started") {
						entry.status = "in_progress";
						files_ready = false;
						var uploader_id = entry.id.replace(/-.*$/,"");
						// Do NOT delete jsessionid here - shitty flash requires it
						this.options.uploader.upload( uploader_id,
							Alfresco.constants.PROXY_URI + "api/alvex/upload;jsessionid=" 
									+ YAHOO.util.Cookie.get("JSESSIONID"),
							"POST", {
								destination: this.options.destination,
								uploaddirectory: this.getUploadDirectory(),
								createuploaddirectory: this.options.createUploadDirectory,
								siteId: this.options.siteId,
								containerId: 'documentLibrary',
								contenttype: this.options.contentType
							},
							"filedata");
						break;
					}

					// If we found failed upload:
					// (a) files are not ready
					else if (entry.status == "error") {
						files_ready = false;
					}

				}

				// TODO - invent smth to prevent submission while upload in progress
				if(files_ready) {
					// Do smth
				}
			}	

			this.activateWorkflowButtons();
		},

		activateWorkflowButtons: function Uploader_activateWorkflowButtons()
		{
			YAHOO.Bubbling.fire("mandatoryControlValueUpdated", this);
		},

		// Adds new files into upload queue and triggers recheck upload status.
		onFileSelect: function Uploader_onFileSelect(event)
		{
			this.options.eventIdHash = {};
			if(event.fileList != null) {
				for(var i in event.fileList) {
					this.options.eventIdHash[ event.fileList[i].id ] = event.fileList[i].id+'-'+event.fileList[i].name;
					var new_file = true;
					for(var j in this.options.uploadQueue) {
						// We check BOTH id and name because sometimes numbering is 'dropped' and 'restarted'.
						// After that cases we get file0, file1, etc again. 
						// If we do not check names - new uploads are forbidden because we have fil10, etc already.
						if( (this.options.uploadQueue[j].id == event.fileList[i].id+'-'+event.fileList[i].name) )
						{
							new_file = false;
							break;
						}
					}
					if(new_file) {
						var pos = this.options.uploadQueue.length;
						this.options.uploadQueue.push(event.fileList[i]);
						this.options.uploadQueue[pos].id += '-' + this.options.uploadQueue[pos].name;
						this.options.uploadQueue[pos].status = "not_started";
						this.options.uploadQueue[pos].node_ref = null;
						this.options.uploadQueue[pos].type = "local_attach";
				
						this.options.fileIdHash[this.options.uploadQueue[pos].id] = pos;
						this.options.dataTable.addRow({ 
								name: this.formatFileName( this.options.uploadQueue[pos].name, 
											this.options.uploadQueue[pos].node_ref ),
								status: this.getStatusHTML( this.options.uploadQueue[pos].node_ref,
											this.options.uploadQueue[pos].name,
											'none', this.msg("alvex.uploader.waiting") ),
								actions: this.getActionsHTML( this.options.uploadQueue[pos].id, true, 
															null, null)
							});
					}
				}
			}
			this.recheckUploads(this.options.uploadQueue);
		},

		// Gets the list of existing files uploaded on other workflow stages and adds them to the list
		addExistingFiles: function Uploader_addExistingFiles(allow_delete, elId, refs)
		{
			var old_files_refs;
			if( refs != null )
				old_files_refs = refs.split(',');
			else
				old_files_refs = YAHOO.util.Dom.get(elId != null ? elId : this.id).value.split(',');

			// Prepare request to get files names from nodeRefs
			var req = {};
			req['items'] = old_files_refs;
			req['itemValueType'] = 'nodeRef';

			// Send request
			var xmlHttp_names = new XMLHttpRequest();
			xmlHttp_names.open("POST", Alfresco.constants.PROXY_URI
				+ "api/forms/picker/items",
				false);
			xmlHttp_names.setRequestHeader("Content-Type", "application/json");
			xmlHttp_names.send( JSON.stringify(req) );

			if (xmlHttp_names.status != 200)
				return;

			// Get names
			var files_names = eval('('+xmlHttp_names.responseText+')');

			for( var i = 0; i < old_files_refs.length; i++ ) {
				if(old_files_refs[i] == '')
					continue;

				var item = {};
				item.name = "Not known yet";
				for (f in files_names.data.items)
					if (files_names.data.items[f].nodeRef == old_files_refs[i])
						item.name = files_names.data.items[f].name;
				item.id = old_files_refs[i].replace(/;/g, "").replace(/:/g, "").replace(/\//g, "")  + '-' + item.name;
				item.size = 0;
				item.node_ref = old_files_refs[i];
				item.status = "complete";
				item.type = "repo_link";

				this.options.uploadQueue.push(item);
				this.options.fileIdHash[item.id] = this.options.uploadQueue.length-1;
				this.options.dataTable.addRow({
							name: this.formatFileName( item["name"], item["node_ref"] ),
							status: this.getStatusHTML( item.node_ref, item.name,
								 'ok', this.msg("alvex.uploader.complete") ), 
							actions: this.getActionsHTML( item.id, allow_delete, item.node_ref, item.name )
						});
			}

			if( old_files_refs.length > 0 )
				this.addRefToControl( this.id + "-cntrl-current", old_files_refs.join(',') );

			document.getElementById(this.id).value 
						= document.getElementById(this.id + "-cntrl-current").value;

			this.recheckUploads(this.options.uploadQueue);
		},

		// Creates new datatable.
		// It is called only once - at control init. After it table is updated, not rebuilt.
		createDataTable: function Uploader_createDataTable()
		{
			var columnDefs = []

			if( this.options.viewType === "mini" ) {
				columnDefs = [
					{key:"name", label: this.msg("alvex.uploader.filename"), sortable:false, resizeable:true, width:300},
					{key:"status", label: '', sortable:false, resizeable:true, width:100},
					{key:"actions", label: '', sortable:false, resizeable:true, width:100}
				];
			} else if( this.options.viewType === "micro" ) {
				columnDefs = [
					{key:"name", label: this.msg("alvex.uploader.filename"), sortable:false, resizeable:true, width:200},
					{key:"status", label: '', sortable:false, resizeable:true, width:60},
					{key:"actions", label: '', sortable:false, resizeable:true, width:75}
				];
			} else {
				columnDefs = [
					{key:"name", label: this.msg("alvex.uploader.filename"), sortable:false, resizeable:true, width:200},
					{key:"status", label: '', sortable:false, resizeable:true, width:200},
					{key:"actions", label: '', sortable:false, resizeable:true, width:100}
				];
			}

			this.options.dataSource = new YAHOO.util.DataSource(this.options.uploadQueue);
			this.options.dataSource.responseType = YAHOO.util.DataSource.TYPE_JSARRAY;
			this.options.dataSource.responseSchema = {
				fields: ["id","name","created","modified","type", "size"]
			};

			this.options.dataTable = new YAHOO.widget.DataTable(this.id + "-cntrl-dataTableContainer",
					columnDefs, this.options.dataSource, {
						selectionMode:"single",
						renderLoopSize: 32,
						MSG_EMPTY: this.msg('alvex.uploader.no_files')
					});
		},

		// It cancels upload, deletes file from the queue and filelist, deletes row from UI and triggers queue recheck.
		onCancelUploadClick: function Uploader_onCancelUploadClick(event, id)
		{
			var rowNum = this.options.fileIdHash[id];
			var uploader_id = this.options.uploadQueue[rowNum].id.replace(/-.*$/, "");

			// Server-side actions

			// Ongoing upload - cancel it
			if( ( this.options.uploadQueue[rowNum].status == "not_started" ) 
					|| ( this.options.uploadQueue[rowNum].status == "in_progress" ) ) {
				this.options.uploader.cancel( uploader_id );
			}
			// Delete uploaded file from Alfresco
			else if ( this.options.uploadQueue[rowNum].status == "complete" ) {
				// Remove local attaches only, do not delete repo links - ticket #108
				if( this.options.uploadQueue[rowNum].type == "local_attach" ) {
					var delete_url = Alfresco.constants.PROXY_URI + 'api/node/' 
						+ Alfresco.util.NodeRef( this.options.uploadQueue[rowNum].node_ref ).uri;
					var xmlhttp = new XMLHttpRequest();
					xmlhttp.open('DELETE', delete_url, true);
					xmlhttp.send(null); 
				}
			}
			// Failed upload - nothing to do on server side
			else if ( this.options.uploadQueue[rowNum].status == "error" ) {
			}

			// Client-side - update control fields
			if( this.options.uploadQueue[rowNum].node_ref != null ) {

				// Check recently added files and remove ref from *-added if matches
				this.removeRefFromControl( this.id + "-cntrl-added", this.options.uploadQueue[rowNum].node_ref );
				// Check overall control value and remove ref if matches
				this.removeRefFromControl( this.id + "-cntrl-current", this.options.uploadQueue[rowNum].node_ref );
				this.removeRefFromControl( this.id, this.options.uploadQueue[rowNum].node_ref );

				// Check initial state with ref to remove and add ref to *-removed if matches
				var old_field = document.getElementById( this.id + "-cntrl-initial" );
				var old_refs = old_field.value.split(',');
				for( var i = 0; i < old_refs.length; i++ )
					if( this.options.uploadQueue[rowNum].node_ref == old_refs[i] ) 
						this.addRefToControl( this.id + "-cntrl-removed", 
										this.options.uploadQueue[rowNum].node_ref );
			}

			// Client-side - remove from queue and UI
			if( this.options.uploader != null )
				this.options.uploader.removeFile( uploader_id );
			this.options.uploadQueue.splice( rowNum, 1 );
			this.options.dataTable.deleteRow( rowNum );
			this.recalculateFileIdHash();

			// Recheck queue state after upload is canceled.
			this.recheckUploads( this.options.uploadQueue );
		},

		removeRefFromControl: function Uploader_removeRefFromControl(control_id, node_ref)
		{
			var field = document.getElementById(control_id);
			var refs = field.value.split(',');
			field.value = '';
			for( var i = 0; i < refs.length; i++ )
				if( (refs[i] != '') && (node_ref != refs[i]) )
					this.addRefToControl(control_id, refs[i]);
		},

		addRefToControl: function Uploader_addRefToControl(control_id, node_ref)
		{
			var field = document.getElementById(control_id);
			if( field.value != '' )
				field.value += ',' + node_ref;
			else
				field.value = node_ref;
		},

		// Rebuilds hash for filename-rownum mapping.
		recalculateFileIdHash: function Uploader_recalculateFileIdHash()
		{
			this.options.fileIdHash = {};
			for(var i in this.options.uploadQueue) {
				this.options.fileIdHash[ this.options.uploadQueue[i].id ] = Number(i);
			}
		},

		// Do something on each file's upload start.
		onUploadStart: function Uploader_onUploadStart(event) {
		},

		// Update status bar on upload progress event.
		onUploadProgress: function Uploader_onUploadProgress(event)
		{
			var id = this.options.eventIdHash[ event["id"] ];
			var rowNum = this.options.fileIdHash[ id ];
			if(rowNum == undefined) { return; }
			var prog = Math.round(100*(event["bytesLoaded"]/event["bytesTotal"]));
			if(isNaN(prog)) { return; }
			this.updateProgressBar( rowNum, prog );
		},

		// Update status bar on upload complete event.
		onUploadComplete: function Uploader_onUploadComplete(event)
		{
			var id = this.options.eventIdHash[ event["id"] ];
			var rowNum = this.options.fileIdHash[ id ];
			if(rowNum == undefined) { return; }
			this.updateProgressBar( rowNum, 100 );
		},

		// Update status if upload throws an error
		onUploadError: function Uploader_onUploadError(event)
		{
			var id = this.options.eventIdHash[ event["id"] ];
			var rowNum = this.options.fileIdHash[ id ];
			if(rowNum == undefined) { return; }
			this.options.uploadQueue[ rowNum ].status = "error";
			this.updateRowView( rowNum, 'fail', this.msg("alvex.uploader.failed") );
			this.recheckUploads( this.options.uploadQueue );
		},

		// Do something if an upload is cancelled.
		// TODO - looks like this event is not fired.
		onUploadCancel: function Uploader_onUploadCancel(event) {
		},

		// Update status and save node_ref when data is received back from the server
		onUploadResponse: function Uploader_onUploadResponse(event)
		{
			var id = this.options.eventIdHash[ event["id"] ];
			var rowNum = this.options.fileIdHash[ id ];
			if(rowNum == undefined) { return; }
			var resp = JSON.parse(event.data);
			if (resp.status.code == 200)
			{
				this.options.uploadQueue[ rowNum ].status = "complete";
				this.options.uploadQueue[ rowNum ].node_ref = resp.nodeRef;
				this.updateRowView( rowNum, 'ok', this.msg("alvex.uploader.complete") );
				// Simply add to *-added because the file was just uploaded and can not be in *-removed
				this.addRefToControl( this.id + "-cntrl-added", resp.nodeRef );
				// Update these fields to ensure current value will be correct any case 
				//	(think about intersection with default picker that clears fieldHtmlId)
				this.addRefToControl( this.id + "-cntrl-current", resp.nodeRef );
				this.addRefToControl( this.id, resp.nodeRef );
			} else {
				this.options.uploadQueue[ rowNum ].status = "error";
				this.updateRowView( rowNum, 'fail', this.msg("alvex.uploader.failed") );
			}
			this.recheckUploads(this.options.uploadQueue);
		},

		// Updates complete row in datatable
		updateRowView: function Uploader_updateRowView(rowNum, status, status_msg)
		{
			this.options.dataTable.updateCell( this.options.dataTable.getRecord(rowNum), "name",
				this.formatFileName( this.options.uploadQueue[rowNum].name, this.options.uploadQueue[rowNum].node_ref ) );

			this.options.dataTable.updateCell( this.options.dataTable.getRecord(rowNum), "status",
						this.getStatusHTML( this.options.uploadQueue[rowNum].node_ref,
								 this.options.uploadQueue[rowNum].name, status, status_msg ) );

			this.updateActions( this.options.uploadQueue[rowNum].id, true, 
						this.options.uploadQueue[rowNum].node_ref,
					 	this.options.uploadQueue[rowNum].name );
		},

		// Updates only progress bar cell in row in datatable
		updateProgressBar: function Uploader_updateProgressBar(rowNum, prog)
		{
			this.options.dataTable.updateCell( this.options.dataTable.getRecord(rowNum), "status", 
								this.getProgressBarHTML(prog) );
		},

		// Returns progress bar HTML
		getProgressBarHTML: function Uploader_getProgressBarHTML(percent)
		{
			var html = this.getStatusStartHTML();

			html += '<td style="border-style:none; padding:5px; width:100%;">';
			html += "<div style='height:5px;width:100%;background-color:#CCC;'>"
					+ "<div style='height:5px;background-color:#6CA5CE;width:" + percent + "%;'></div></div>";
			html += '</td>';
			html += this.getStatusEndHTML();
			return html;
		},

		// Returns upload status HTML
		getLongStatusHTML: function Uploader_getLongStatusHTML(status, status_msg)
		{
			var html = '<td style="padding:5px; width:40%;">'
					 + '<div style="text-align:left;  vertical-align: middle;">';

			if(status == 'ok')
				html += '<img align="top" src="' 
					+ Alfresco.constants.URL_RESCONTEXT + 'components/alvex/uploader/complete-16.png' + '"/> ';
			else if(status == 'fail')
				html += '<img align="top" src="' 
					+ Alfresco.constants.URL_RESCONTEXT + 'components/alvex/uploader/fail-16.png' + '"/> ';

			html += status_msg + '</div></td>';

			return html;
		},

		// Returns upload status HTML
		getShortStatusHTML: function Uploader_getStortStatusHTML(status, status_msg)
		{
			var html = '<div style="text-align:left; vertical-align: middle;">';

			if(status == 'ok')
				html += '<img align="top" src="' 
					+ Alfresco.constants.URL_RESCONTEXT + 'components/alvex/uploader/complete-16.png' + '"/> ';
			else if(status == 'fail')
				html += '<img align="top" src="' 
					+ Alfresco.constants.URL_RESCONTEXT + 'components/alvex/uploader/fail-16.png' + '"/> ';

			html += status_msg + '</div>';

			return html;
		},

		// Returns HTML for download and view buttons
		getStatusViewHTML: function Uploader_getStatusViewHTML(ref, filename)
		{
			var html = '<td style="border-style:none; padding:5px; width:60%;">';

			if(ref != null) {
				html += '<div style="vertical-align: middle; padding-bottom: 5px;">'
					+ '<a href="' + Alfresco.constants.PROXY_URI + 'api/node/content/' 
					+ Alfresco.util.NodeRef(ref).uri + '/' + filename + '" target="_blank" ' 
					+ 'title="' + this.msg("alvex.uploader.download") + '">' 
					+ '<img align="top" src="' + Alfresco.constants.URL_RESCONTEXT 
					+ 'components/alvex/uploader/document-download-16.png' + '"/> ' 
					+ this.msg("alvex.uploader.download") + '</a></div>';

				html += '<div style="vertical-align: middle; padding-top: 5px;">'
					+ '<a href="' +  Alfresco.constants.URL_PAGECONTEXT 
					+ 'document-details?nodeRef=' + ref + '" target="_blank" ' 
					+ 'title="' + this.msg("alvex.uploader.view") + '">' 
					+ '<img align="top" src="' + Alfresco.constants.URL_RESCONTEXT 
					+ 'components/alvex/uploader/document-edit-properties-16.png' + '"/> ' 
					+ this.msg("alvex.uploader.view") + '</a></div>';
			}

			html += '</td>';

			return html;
		},

		getActionsMiniViewHTML: function f(ref, filename)
		{
			var html = '';

			html += '<a href="' + Alfresco.constants.PROXY_URI + 'api/node/content/' 
				+ Alfresco.util.NodeRef(ref).uri + '/' + filename + '" target="_blank" ' 
				+ 'title="' + this.msg("alvex.uploader.download") + '">' 
				+ '<img align="top" src="' + Alfresco.constants.URL_RESCONTEXT 
				+ 'components/alvex/uploader/document-download-16.png' + '"/>' 
				+ '</a> '; //this.msg("alvex.uploader.download")

			html += '<a href="' +  Alfresco.constants.URL_PAGECONTEXT 
				+ 'document-details?nodeRef=' + ref + '" target="_blank" ' 
				+ 'title="' + this.msg("alvex.uploader.view") + '">' 
				+ '<img align="top" src="' + Alfresco.constants.URL_RESCONTEXT 
				+ 'components/alvex/uploader/document-edit-properties-16.png' + '"/>' 
				+ '</a> '; //this.msg("alvex.uploader.view")

			return html;
		},

		updateActions: function f(id, allow_delete, ref, filename)
		{
			if( (this.options.viewType === "mini") || (this.options.viewType === "micro") ) {
				if( ref != null ) {
					var el = document.getElementById(this.id + '-actions-later-' + id);
					while( el.firstChild )
						el.removeChild( el.firstChild );
					el.innerHTML = this.getActionsMiniViewHTML(ref, filename);
				}
			}
		},

		// Returns HTML for remove button
		getActionsHTML: function Uploader_getActionsRemoveHTML(id, allow_delete, ref, filename)
		{
			var html = '';

			if( (this.options.viewType === "mini") || (this.options.viewType === "micro") ) {
				html += '<div style="text-align:right; vertical-align: middle;">'
					+ '<span id="' + this.id + '-actions-later-' + id + '">';

				if(ref != null)
					html += this.getActionsMiniViewHTML(ref, filename);

				if(allow_delete && !this.options.disabled) {
					html += '</span><a href="#" id="' + this.id + '-remove-link-' + id + '" ' 
						+ 'title="' + this.msg("alvex.uploader.remove") + '">' 
						+ '<img align="top" src="' + Alfresco.constants.URL_RESCONTEXT 
						+ 'components/alvex/uploader/document-delete-16.png' + '"/>' 
						+ '</a>'; 
				}
				html += '</div>';
			} else {
				html += this.getStatusStartHTML();
				html += '<td style="border-style:none; padding:5px; width:100%;">'
					+ '<div style="text-align:right; vertical-align: middle;">';
				if(allow_delete && !this.options.disabled) {
					html += '<a href="#" id="' + this.id + '-remove-link-' + id + '" ' 
						+ 'title="' + this.msg("alvex.uploader.remove") + '">' 
						+ '<img align="top" src="' + Alfresco.constants.URL_RESCONTEXT 
						+ 'components/alvex/uploader/document-delete-16.png' + '"/> ' 
						+ this.msg("alvex.uploader.remove") + '</a>';
				}
				html += '</div></td>';
				html += this.getStatusEndHTML();
			}

			if( allow_delete )
				YAHOO.util.Event.onAvailable(this.id + '-remove-link-' + id, this.attachRemoveClickListener, id , this);

			return html;
		},

		attachRemoveClickListener: function Uploader_attachRemoveClickListener(id)
		{
			YAHOO.util.Event.on(this.id + '-remove-link-' + id, 'click', this.onCancelUploadClick, id, this);
		},

		getStatusStartHTML: function Uploader_getStatusStartHTML()
		{
			return '<table width="100%" style="border-style:none; padding:5px;"><tr>';
		},

		getStatusEndHTML: function Uploader_getStatusEndHTML()
		{
			return '</tr></table>';
		},

		// Returns HTML for actions block
		getStatusHTML: function Uploader_getStatusHTML( ref, filename, status, status_msg )
		{
			var html = '';
			if( (this.options.viewType === "mini") || (this.options.viewType === "micro") ) {
				html = this.getShortStatusHTML(status, status_msg);
			} else {
				html += this.getStatusStartHTML();
				html += this.getLongStatusHTML(status, status_msg);
				html += this.getStatusViewHTML(ref, filename);
				html += this.getStatusEndHTML();
			}

			return html;
		},

		formatFileName: function Uploader_formatFileName(filename, ref)
		{
			if(ref != null)
				return '<a href="' + Alfresco.constants.PROXY_URI + 'api/node/content/' 
					+ Alfresco.util.NodeRef(ref).uri + '/' + filename 
					+ '" target="_blank" ' + 'title="' + this.msg("alvex.uploader.download") + '">' 
					+ filename + '</a>';
			else
				return filename;
		}

	});
})();
