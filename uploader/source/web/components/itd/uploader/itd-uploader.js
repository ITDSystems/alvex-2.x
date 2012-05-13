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
if (typeof ITD == "undefined" || !ITD)
{
	var ITD = {};
}

(function()
{
	ITD.Uploader = function(htmlId)
	{
		ITD.Uploader.superclass.constructor.call(this, "ITD.Uploader", htmlId);
		YAHOO.Bubbling.on("formValueChanged", this.onExistingItemAttach, this);
		YAHOO.Bubbling.on("formContentReady", this.onFormContentReady, this);
		YAHOO.Bubbling.on("uploaderRemoveFile", this.onCancelUploadClick, this);
		return this;
	};

	YAHOO.extend(ITD.Uploader, Alfresco.component.Base,
	{
		options:
		{
			// Uploader itself
			uploader: null,
			// List of files to upload
			uploadQueue: [],
			// Hash to map files ids to row nums
			fileIdHash: {},
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
			started: false
		},

		onReady: function Uploader_init()
		{
			if( this.options.disabled )
				this.showItems();
		},

		onFormContentReady: function Uploader_onFormContentReady()
		{
			if( !this.options.disabled ) {
				this.createUploader();
				this.showItems();
			}
		},

		createUploader: function Uploader_createUploader()
		{
			if( (!this.options.disabled) && (document.getElementById(this.id + "-cntrl-addFilesButton") != null) )
			{
				var addFilesButton = new YAHOO.widget.Button(this.id + "-cntrl-addFilesButton");
				// Create UI layer for uploader
				var uiLayer = YAHOO.util.Dom.getRegion(this.id + "-cntrl-addFilesButton");
				var overlay = YAHOO.util.Dom.get(this.id + "-cntrl-uploaderOverlay");
				YAHOO.util.Dom.setStyle(overlay, 'width', uiLayer.right-uiLayer.left + "px");
				YAHOO.util.Dom.setStyle(overlay, 'height', uiLayer.bottom-uiLayer.top + "px");

				// Custom URL for the uploader swf file (same folder).
				YAHOO.widget.Uploader.SWFURL = Alfresco.constants.URL_CONTEXT+"yui/uploader/assets/uploader.swf";

				// Instantiate the uploader and write it to its placeholder div.
				this.options.uploader = new YAHOO.widget.Uploader( this.id + "-cntrl-uploaderOverlay" );

				if( !Alfresco.util.hasRequiredFlashPlayer(9, 0, 45) ) {
					document.getElementById(this.id + "-cntrl").innerHTML = this.msg("itd.uploader.flash_not_found");
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

		// This function creates datatable and inits its state
		showItems: function Uploader_showItems()
		{
			if( document.getElementById(this.id + "-cntrl-dataTableContainer") != null)
			{
				// Add table template to UI.
				this.createDataTable(this.options.uploadQueue);

				// Usually UI events regarding existing packageItems are triggered by picker. But:
				//    (a) if it is forbidden to add new items - there is no picker,
				//    (b) if there is no files - picker does not trigger event,
				//    (c) in form.mode == 'view' picker does not trigger event.
				// In this case we should cover it, process existing files and set 'started' state manually.
				// Otherwise 'onExistingItemAttach' will go crazy on the first run because 'started' state is not set.
				if( !(this.options.picker) || (document.getElementById(this.id).value == '') || (this.options.disabled) ) {
					if ( (this.options.packageItemActionGroup == "remove_package_item_actions")
							|| (this.options.packageItemActionGroup == "edit_and_remove_package_item_actions")
							|| (this.options.packageItemActionGroup == "start_package_item_actions") ) {
						this.addExistingFiles(true);
					} else if (this.options.packageItemActionGroup != "") {
						this.addExistingFiles(false);
					}
					this.options.started = true;
				}

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
			if( !this.options.started ) {
				if ( (this.options.packageItemActionGroup == "remove_package_item_actions")
					|| (this.options.packageItemActionGroup == "edit_and_remove_package_item_actions")
					|| (this.options.packageItemActionGroup == "start_package_item_actions") ) {
						this.addExistingFiles(true);
				} else if (this.options.packageItemActionGroup != "") {
						this.addExistingFiles(false);
				}
				this.options.started = true;
				return;
			}

			// Move newly attached files to *-added field
			var items = document.getElementById( this.id ).value.split(',');
			for(var item in items)
				document.getElementById(this.id + "-cntrl-added").value += items[item] + ',';	

			// Update UI
			this.addExistingFiles(true);
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

				var userName = this.decodeBase64( YAHOO.util.Cookie.get("alfUsername2") );

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
			var ff = new Array({	description: this.msg("itd.uploader.allowedExtensions"), 
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
						this.options.uploader.upload( entry.id,
							Alfresco.constants.PROXY_URI + "api/itd/upload;jsessionid=" 
									+ YAHOO.util.Cookie.get("JSESSIONID"),
							"POST", {
								destination: this.options.destination,
								uploaddirectory: this.getUploadDirectory(),
								createuploaddirectory: this.options.createUploadDirectory,
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
				// If files are ready - set overall response value
				if(files_ready) {
					// Do smth
				}
			}	

			// TODO - do we need it here?
			this.activateWorkflowButtons();
		},

		activateWorkflowButtons: function Uploader_activateWorkflowButtons()
		{
			// Send formValueChanged event
			// TODO - think if we need it, or KeyboardEvent below, or both, or none.
			YAHOO.Bubbling.fire("formValueChanged",
			{
				eventGroup: this.options.uploader
			});
			// TODO - rethink it based on Y.B.fire
			// Send keyboard event to activate / deactivate workflow buttons
			var refs = document.getElementById( this.id );
			var ev = document.createEvent('KeyboardEvent');
			// Hack to make it cross-browser
			if(ev.initKeyboardEvent)
				ev.initKeyboardEvent("keyup", true, true, window, false, false, false, false, 0, 32);
			else
				ev.initKeyEvent("keyup", true, true, window, false, false, false, false, 0, 32);
			refs.dispatchEvent(ev);
		},

		// Adds new files into upload queue and triggers recheck upload status.
		onFileSelect: function Uploader_onFileSelect(event)
		{
			if(event.fileList != null) {
				for(var i in event.fileList) {
					var new_file = true;
					for(var j in this.options.uploadQueue) {
						if(this.options.uploadQueue[j].id == event.fileList[i].id) {
							new_file = false;
							break;
						}
					}
					if(new_file) {
						var pos = this.options.uploadQueue.length;
						this.options.uploadQueue.push(event.fileList[i]);
						this.options.uploadQueue[pos].status = "not_started";
						this.options.uploadQueue[pos].node_ref = null;
				
						this.options.fileIdHash[this.options.uploadQueue[pos].id] = pos;
						this.options.dataTable.addRow({ 
								name: this.formatFileName( this.options.uploadQueue[pos].name, 
											this.options.uploadQueue[pos].node_ref ),
								actions: this.getActionsHTML( this.options.uploadQueue[pos].node_ref,
											this.options.uploadQueue[pos].name,
											'none', this.msg("itd.uploader.waiting") ),
								remove: this.getRemoveHTML( this.options.uploadQueue[pos].id, true )
							});

						YAHOO.util.Event.onAvailable(this.id + '-remove-link-' + this.options.uploadQueue[pos].id,
								this.attachRemoveClickListener, this.options.uploadQueue[pos].id, this);
					}
				}
			}
			this.recheckUploads(this.options.uploadQueue);
		},

		attachRemoveClickListener: function Uploader_attachRemoveClickListener(id)
		{
			YAHOO.util.Event.on(this.id + '-remove-link-' + id, 'click', this.onCancelUploadClick, id, this);
		},

		// Gets the list of existing files uploaded on other workflow stages and adds them to the list
		addExistingFiles: function Uploader_addExistingFiles(allow_delete)
		{
			var old_files_refs = document.getElementById(this.id).value.split(',');

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
				item.id = old_files_refs[i].replace(/;/g, "").replace(/:/g, "").replace(/\//g, "");
				item.size = 0;
				item.node_ref = old_files_refs[i];
				item.status = "complete";

				this.options.uploadQueue.push(item);
				this.options.fileIdHash[item.id] = this.options.uploadQueue.length-1;
				this.options.dataTable.addRow({
							name: this.formatFileName( item["name"], item["node_ref"] ),
							actions: this.getActionsHTML( item.node_ref, item.name,
								 'ok', this.msg("itd.uploader.complete") ), 
							remove: this.getRemoveHTML( item.id, allow_delete )
						});

				YAHOO.util.Event.onAvailable(this.id + '-remove-link-' + item.id,
						this.attachRemoveClickListener, item.id, this);
			}

			document.getElementById(this.id + "-cntrl-current").value 
						+= document.getElementById(this.id).value + ',';
			document.getElementById(this.id).value 
						= document.getElementById(this.id + "-cntrl-current").value;
			this.recheckUploads(this.options.uploadQueue);
		},

		// Creates new datatable.
		// It is called only once - at control init. After it table is updated, not rebuilt.
		createDataTable: function Uploader_createDataTable(entries)
		{
			var columnDefs = [
				{key:"name", label: this.msg("itd.uploader.filename"), sortable:false, resizeable:true, width:200},
				{key:"actions", label: '', sortable:false, resizeable:true, width:200},
				{key:"remove", label: '', sortable:false, resizeable:true, width:100}
			];

			this.options.dataSource = new YAHOO.util.DataSource(this.options.uploadQueue);
			this.options.dataSource.responseType = YAHOO.util.DataSource.TYPE_JSARRAY;
			this.options.dataSource.responseSchema = {
				fields: ["id","name","created","modified","type", "size"]
			};

			this.options.dataTable = new YAHOO.widget.DataTable(this.id + "-cntrl-dataTableContainer",
					columnDefs, this.options.dataSource, {
						selectionMode:"single",
						renderLoopSize: 32,
						MSG_EMPTY: this.msg('itd.uploader.no_files')
					});
		},

		// It cancels upload, deletes file from the queue and filelist, deletes row from UI and triggers queue recheck.
		onCancelUploadClick: function Uploader_onCancelUploadClick(event, id)
		{
			var rowNum = this.options.fileIdHash[id];

			// Server-side actions

			// Ongoing upload - cancel it
			if( ( this.options.uploadQueue[rowNum].status == "not_started" ) 
					|| ( this.options.uploadQueue[rowNum].status == "in_progress" ) ) {
				this.options.uploader.cancel( this.options.uploadQueue[rowNum].id );
			}
			// Delete uploaded file from Alfresco
			else if ( this.options.uploadQueue[rowNum].status == "complete" ) {
				var delete_url = this.makeCleanURL( "api/node/" + this.options.uploadQueue[rowNum].node_ref );
				var xmlhttp = new XMLHttpRequest();
				xmlhttp.open('DELETE', delete_url, true);
				xmlhttp.send(null); 
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
				var removed_field = document.getElementById( this.id + "-cntrl-removed" );
				for( var i = 0; i < old_refs.length; i++ ) {
					if( this.options.uploadQueue[rowNum].node_ref == old_refs[i] ) 
						removed_field.value += this.options.uploadQueue[rowNum].node_ref + ',';
				}
			}

			// Client-side - remove from queue and UI
			if( this.options.uploader != null )
				this.options.uploader.removeFile( this.options.uploadQueue[rowNum].id );
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
			for( var i = 0; i < refs.length; i++ ) {
				if( (refs[i] != '') && (node_ref != refs[i]) )
					field.value += refs[i] + ',';
			}
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
			var rowNum = this.options.fileIdHash[ event["id"] ];
			if(rowNum == undefined) { return; }
			var prog = Math.round(100*(event["bytesLoaded"]/event["bytesTotal"]));
			if(isNaN(prog)) { return; }
			this.updateProgressBar( rowNum, prog );
		},

		// Update status bar on upload complete event.
		onUploadComplete: function Uploader_onUploadComplete(event)
		{
			var rowNum = this.options.fileIdHash[ event["id"] ];
			if(rowNum == undefined) { return; }
			this.updateProgressBar( rowNum, 100 );
		},

		// Update status if upload throws an error
		onUploadError: function Uploader_onUploadError(event)
		{
			var rowNum = this.options.fileIdHash[ event["id"] ];
			if(rowNum == undefined) { return; }
			this.options.uploadQueue[ rowNum ].status = "error";
			this.updateRowView( rowNum, 'fail', this.msg("itd.uploader.failed") );
			this.recheckUploads( this.options.uploadQueue );
		},

		// Do something if an upload is cancelled.
		// TODO - looks like this event is not fired.
		onUploadCancel: function Uploader_onUploadCancel(event) {
		},

		// Update status and save node_ref when data is received back from the server
		onUploadResponse: function Uploader_onUploadResponse(event)
		{
			var rowNum = this.options.fileIdHash[ event["id"] ];
			if(rowNum == undefined) { return; }
			var resp = JSON.parse(event.data);
			if (resp.status.code == 200)
			{
				this.options.uploadQueue[ rowNum ].status = "complete";
				this.options.uploadQueue[ rowNum ].node_ref = resp.nodeRef;
				this.updateRowView( rowNum, 'ok', this.msg("itd.uploader.complete") );
				// Simply add to *-added because the file was just uploaded and can not be in *-removed
				document.getElementById(this.id + "-cntrl-added").value += resp.nodeRef + ',';
				// Update these fields to ensure current value will be correct any case 
				//	(think about intersection with default picker that clears fieldHtmlId)
				document.getElementById(this.id + "-cntrl-current").value += resp.nodeRef + ',';
				document.getElementById(this.id).value += resp.nodeRef + ',';
			} else {
				this.options.uploadQueue[ rowNum ].status = "error";
				this.updateRowView( rowNum, 'fail', this.msg("itd.uploader.failed") );
			}
			this.recheckUploads(this.options.uploadQueue);
		},

		// Updates complete row in datatable
		updateRowView: function Uploader_updateRowView(rowNum, status, status_msg)
		{
			this.options.dataTable.updateCell( this.options.dataTable.getRecord(rowNum), "name",
				this.formatFileName( this.options.uploadQueue[rowNum].name, this.options.uploadQueue[rowNum].node_ref ) );

			this.options.dataTable.updateCell( this.options.dataTable.getRecord(rowNum), "actions",
						this.getActionsHTML( this.options.uploadQueue[rowNum].node_ref,
								 this.options.uploadQueue[rowNum].name, status, status_msg ) );
		},

		// Updates only progress bar cell in row in datatable
		updateProgressBar: function Uploader_updateProgressBar(rowNum, prog)
		{
			this.options.dataTable.updateCell( this.options.dataTable.getRecord(rowNum), "actions", 
								this.getProgressBarHTML(prog) );
		},

		// Returns progress bar HTML
		getProgressBarHTML: function Uploader_getProgressBarHTML(percent)
		{
			var html = this.getActionsStartHTML();

			html += '<td style="border-style:none; padding:5px; width:100%;">';
			html += "<div style='height:5px;width:100%;background-color:#CCC;'>"
					+ "<div style='height:5px;background-color:#6CA5CE;width:" + percent + "%;'></div></div>";
			html += '</td>';
			html += this.getActionsEndHTML();
			return html;
		},

		// Returns upload status HTML
		getActionsStatusHTML: function Uploader_getActionsStatusHTML(status, status_msg)
		{
			var html = '<td style="padding:5px; width:40%;">'
					 + '<div style="text-align:left;  vertical-align: middle;">';

			if(status == 'ok')
				html += '<img align="top" src="' 
					+ Alfresco.constants.URL_RESCONTEXT + 'components/itd/uploader/complete-16.png' + '"/> ';
			else if(status == 'fail')
				html += '<img align="top" src="' 
					+ Alfresco.constants.URL_RESCONTEXT + 'components/itd/uploader/fail-16.png' + '"/> ';

			html += status_msg + '</div></td>';

			return html;
		},

		// Returns HTML for download and view buttons
		getActionsViewHTML: function Uploader_getActionsViewHTML(ref, filename)
		{
			var html = '<td style="border-style:none; padding:5px; width:60%;">';

			if(ref != null) {

				html += '<div style="vertical-align: middle; padding-bottom: 5px;">'
					+ '<a href="' + this.makeCleanURL('api/node/content/'+ref+'/'+filename) + '" target="_blank">' 
					+ '<img align="top" src="' + Alfresco.constants.URL_RESCONTEXT 
					+ 'components/itd/uploader/document-download-16.png' + '"/> ' 
					+ this.msg("itd.uploader.download") + '</a></div>';

				html += '<div style="vertical-align: middle; padding-top: 5px;">'
					+ '<a href="' +  Alfresco.constants.URL_PAGECONTEXT 
					+ 'document-details?nodeRef=' + ref + '" target="_blank">' 
					+ '<img align="top" src="' + Alfresco.constants.URL_RESCONTEXT 
					+ 'components/itd/uploader/document-edit-properties-16.png' + '"/> ' 
					+ this.msg("itd.uploader.view") + '</a></div>';
			}

			html += '</td>';

			return html;
		},

		// Returns HTML for remove button
		getRemoveHTML: function Uploader_getActionsRemoveHTML(id, allow_delete)
		{
			var html = this.getActionsStartHTML();

			html += '<td style="border-style:none; padding:5px; width:100%;">'
				+ '<div style="text-align:right; vertical-align: middle;">';

			if(allow_delete) {
				html += '<a href="#" id="' + this.id + '-remove-link-' + id + '">'
					+ '<img align="top" src="' + Alfresco.constants.URL_RESCONTEXT 
					+ 'components/itd/uploader/document-delete-16.png' + '"/> ' 
					+ this.msg("itd.uploader.remove") + '</a>';
			}

			html += '</div></td>';
			html += this.getActionsEndHTML();

			return html;
		},

		getActionsStartHTML: function Uploader_getActionsStartHTML()
		{
			return '<table width="100%" style="border-style:none; padding:5px;"><tr>';
		},

		getActionsEndHTML: function Uploader_getActionsEndHTML()
		{
			return '</tr></table>';
		},

		// Returns HTML for actions block
		getActionsHTML: function Uploader_getActionsHTML( ref, filename, status, status_msg )
		{
			var html = this.getActionsStartHTML();
			html += this.getActionsStatusHTML(status, status_msg);
			html += this.getActionsViewHTML(ref, filename);
			html += this.getActionsEndHTML();

			return html;
		},

		formatFileName: function Uploader_formatFileName(filename, ref)
		{
			if(ref != null)
				return '<a href="' + this.makeCleanURL( 'api/node/content/' + ref + '/' + filename ) 
					+ '" target="_blank">' + filename + '</a>';
			else
				return filename;
		},

		makeCleanURL: function Uploader_makeCleanURL(url)
		{
			var clean_url = url;
			clean_url = clean_url.replace(/;/g, "");
			clean_url = clean_url.replace(/:/g, "");
			clean_url = clean_url.replace(/\/\/+/g, "/");
			clean_url = clean_url.replace(/\/$/, "");
			clean_url = clean_url.replace(/^\//, "");
			clean_url =  Alfresco.constants.PROXY_URI + clean_url + ";jsessionid=" + YAHOO.util.Cookie.get("JSESSIONID");
			return clean_url;
		},

		// Base64 decoder
		decodeBase64: function Uploader_decodeBase64(input)
		{
			var _keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
	
			var output = "";
			var chr1, chr2, chr3;
			var enc1, enc2, enc3, enc4;
			var i = 0;

			input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

			while (i < input.length) {

				enc1 = _keyStr.indexOf(input.charAt(i++));
				enc2 = _keyStr.indexOf(input.charAt(i++));
				enc3 = _keyStr.indexOf(input.charAt(i++));
				enc4 = _keyStr.indexOf(input.charAt(i++));

				chr1 = (enc1 << 2) | (enc2 >> 4);
				chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
				chr3 = ((enc3 & 3) << 6) | enc4;

				output = output + String.fromCharCode(chr1);

				if (enc3 != 64) {
					output = output + String.fromCharCode(chr2);
				}
				if (enc4 != 64) {
					output = output + String.fromCharCode(chr3);
				}
			}
			return this.utf8_decode(output);
		},

		// Private helper to decode Base64 Unicode string
		utf8_decode: function Uploader_utf8_decode(utftext)
		{
			var string = "";
			var i = 0;
			var c = 0, c1 = 0, c2 = 0;

			while ( i < utftext.length ) {

				c = utftext.charCodeAt(i);

				if (c < 128) {
					string += String.fromCharCode(c);
					i++;
				} else if((c > 191) && (c < 224)) {
					c1 = utftext.charCodeAt(i+1);
					string += String.fromCharCode(((c & 31) << 6) | (c1 & 63));
					i += 2;
				} else {
					c1 = utftext.charCodeAt(i+1);
					c2 = utftext.charCodeAt(i+2);
					string += String.fromCharCode(((c & 15) << 12) | ((c1 & 63) << 6) | (c2 & 63));
					i += 3;
				}
			}
			return string;
		}

	});
})();
