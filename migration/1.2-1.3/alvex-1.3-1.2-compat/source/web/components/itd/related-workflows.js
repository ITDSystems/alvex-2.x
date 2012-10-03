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
	ITD.RelatedWorkflows = function(htmlId)
	{
		ITD.RelatedWorkflows.superclass.constructor.call(this, "ITD.RelatedWorkflows", htmlId);
		return this;
	};

	YAHOO.extend(ITD.RelatedWorkflows, Alfresco.component.Base,
	{
		options:
		{
			// List of related workflows
			relatedWorkflows: [],
			// Workflow definitions that are allowed to start from this task - by def names
			definitionsFilter: '',
			// Property of the task where related workflows are stored
			relWflPropName: '',
			// Current task ID
			curTaskId: '',
			// If the control is disabled
			disabled: false,
			dataSource: null,
			dataTable: null
		},

		onReady: function RelWf_init()
		{
			this.options.definitionsFilter = this.options.definitionsFilter.replace(/\$/,"\\\$");
			if(!this.options.disabled)
			{
				// Fill the list of available child workflows
				this.fillComboBox();

				// Create nice menu from the list
				var selectWorkflowMenu = new YAHOO.widget.Button(
						this.id + "-cntrl-workflow-start", {
						type: "menu",
						menu: this.id + "-cntrl-workflow-selector" });
				// Attach function startWorkflow to menu click event
				selectWorkflowMenu.getMenu().subscribe("click",this.startWorkflow,null,this);
			}

			// Create empty table of related workflows
			this.createDataTable();

			// Get saved related workflows from server
			this.getRelatedProcesses();

			// Insert them into UI
			this.fillRelatedProcessesTable();
		},

		// Fills list of possible related workflows to start
		fillComboBox: function RelWf_fillComboBox()
		{
			// Call web-script to retrieve available workflows
			var xmlHttp = new XMLHttpRequest();
			var url = Alfresco.constants.PROXY_URI + "api/itd/list-definitions?filter=" 
					+ encodeURIComponent( this.options.definitionsFilter );
			xmlHttp.open("GET", url, false);
			xmlHttp.send(null);

			if(xmlHttp.status != 200)
				return;

			var resp = eval('('+xmlHttp.responseText+')');

			// Fill the list

			// selector - list html element
			var selector = document.getElementById(this.id + "-cntrl-workflow-selector");

			// Get all items from response, create for each 'option' element,
			// assign it value and insert into the list
			for (var key in resp.data)  {
				var task = resp.data[key];
				var opt = document.createElement("option");
				opt.appendChild(document.createTextNode(task.title));
				opt.setAttribute("value", task.name);
				selector.appendChild(opt);
			}
		},

		// Starts new related workflow
		startWorkflow: function RelWf_startWorkflow( p_sType, p_aArgs )
		{
			var oEvent = p_aArgs[0];	//  DOM event from the menu
			var oMenuItem = p_aArgs[1];	//  Target of the event (selected workflow)

			// Get selected workflow, 'def' is workflow definition name
			var def = "";
			if (oMenuItem) { 
				def = oMenuItem.value;
			} else {
				return;
			}

			// Custom template URL for the dialog
			var templateUrl = YAHOO.lang.substitute(
				Alfresco.constants.URL_SERVICECONTEXT 
				+ "components/form?itemKind={itemKind}&itemId={itemId}&mode={mode}&submitType={submitType}&formId={formId}&showCancelButton=true",
				{
					itemKind: "workflow",
					itemId: def,
					mode: "create",
					submitType: "json",
					formId: "popupDialogForm"	// Custom dialog form
				});

			// Create new dialog

			// It looks like 'destroyOnHide: true' works globally for all dialogs on the page - do not use it
			// We still delete dialog manually because we are to clear the form and everything around it
			if( this.widgets.dialog )
				delete this.widgets.dialog;

			this.widgets.dialog = new Alfresco.module.SimpleDialog(this.id + "-cntrl-popup-dialog");

			this.widgets.dialog.setOptions(
			{
				width: "50em",			// TODO make it configurable or relative
				templateUrl: templateUrl,	// Our custom template URL
				actionUrl: null,
				destroyOnHide: false,

				// Before dialog show we just set its title
				doBeforeDialogShow:
				{
					fn: function RelWf_customizeDialogProperties(p_form, p_dialog)
					{
						Alfresco.util.populateHTML([
							p_dialog.id + "-dialogTitle", 
							Alfresco.util.message(this.msg("itd.related_workflows.new_workflow_dialog_title"))
						]);
					},
					scope: this
				},

				// It is called when dialog is closed with success.
				// It means child workflow was started successfully and we got the response.
				onSuccess:
				{
					fn: function RelWf_dialog_on_success(response, p_obj)
					{
						// Get workflow description from the form
						// TODO - hardcoded property name, move it to the config (?)
						var desc = response.config.dataObj.prop_bpm_workflowDescription;
						var id = response.json.persistedObject.replace('WorkflowInstance[id=','').split(',')[0];
						// Save workflow details, update server state and UI
						this.commitCreatedWorkflow(desc, id);
					},
					scope: this
				},

				onFailure:
				{
					fn: function RelWf_dialog_on_failure(response)
					{
						// Do nothing
					},
					scope: this
				}
			}).show();
		},

		// Creates empty datatable of related workflows
		// Datatable is created once and updated after it
		createDataTable: function RelWf_createDataTable()
		{
			// Columns defs
			var columnDefs = [
				{key:"workflow", label: this.msg("itd.related_workflows.workflow"),
						sortable:false, resizeable:true, width:250},
				{key:"start_date", label: this.msg("itd.related_workflows.start_date"),
						sortable:false, resizeable:true, width:125},
				{key:"progress", label: this.msg("itd.related_workflows.progress"),
						sortable:false, resizeable:true, width:125}/*,
				{key:"person", label: this.msg("itd.related_workflows.person_in_charge"), 
						sortable:false, resizeable:true, width:100},
				{key:"cancel", label: '', sortable:false, resizeable:true, width:100}*/
				// TODO - return 'person' field and 'cancel' option
			];

			// Use our list of related workflows as datasource
			this.options.dataSource = new YAHOO.util.DataSource(this.options.relatedWorkflows);
			this.options.dataSource.responseType = YAHOO.util.DataSource.TYPE_JSARRAY;
			this.options.dataSource.responseSchema = {
				fields: ["id", "active", "description", "start_date", "end_date", "cancel"]
			};

			// Create the table
			this.options.dataTable = new YAHOO.widget.DataTable(
				this.id + "-cntrl-dataTableContainer", columnDefs, this.options.dataSource,
				{
					selectionMode:"single",
					renderLoopSize: 32,
					MSG_EMPTY: this.msg('itd.related_workflows.no_related_workflows')
				});
		},


		// Save newly created workflow details and update everything
		commitCreatedWorkflow: function RelWf_commitCreatedWorkflow(desc, id)
		{
			// Step 1 - save it

			// Save to the form - add new id to the field with ids of related workflows
			var curRelatedWorkflows = document.getElementById(this.id);
			if (curRelatedWorkflows.value == '')
				curRelatedWorkflows.value = id;
			else
				curRelatedWorkflows.value += ',' + id;

			// Get current form
			var form = this._getFormEl();

			// Get Alfresco form based on this HTML form
			var alf_form = new Alfresco.forms.Form(form.id);
			alf_form.init();
			alf_form.setAJAXSubmit(true);
			alf_form.setSubmitAsJSON(true);
			alf_form.setAjaxSubmitMethod("POST");

			// Save current form - save relations on the server
			// TODO - rethink this code - use Y.Bubbling.fire (?)
			var ev = document.createEvent('KeyboardEvent');
			// Hack to make it cross-browser
			if(ev.initKeyboardEvent)
				ev.initKeyboardEvent("keyup", true, true, window, false, false, false, false, 0, 32);
			else
				ev.initKeyEvent("keyup", true, true, window, false, false, false, false, 0, 32);
			alf_form._submitInvoked(ev);

			// Step 2 - update local state and UI

			// Build UTCDateString - start time of the workflow
			var start_date = new Date();
			var s_year    = start_date.getUTCFullYear();
			var s_month   = start_date.getUTCMonth();
			var s_day     = start_date.getUTCDate();
			var s_hours   = start_date.getUTCHours();
			var s_minutes = start_date.getUTCMinutes();
			var date_str = s_year + "-" + s_month + "-" + s_day + "-" + s_hours + "-" + s_minutes;

			// Create workflow struct
			var workflow = {
				"description" : desc,
				"start_date" : date_str,
				"end_date" : "null",
				"status" : "in-progress",
				"active": true
			};

			// Add workflow to local state of related workflows
			this.options.relatedWorkflows.push( workflow );

			// Update UI
			this.fillRelatedProcessesTable();
		},

		// Build table in UI from local state (relatedWorkflows array)
		fillRelatedProcessesTable: function RelWf_fillRelatedProcessesTable()
		{
			// Clear UI
			this.clearTableUI();

			// Sort related workflows - active first, started early first
			this.options.relatedWorkflows.sort(
				function(a,b)
				{
					return a.active < b.active 
						|| a.active == b.active && a.start_date > b.start_date;
				});

			// Insert sorted array into table
			for(var i in this.options.relatedWorkflows) {
				this.insertWorkflowIntoUI( this.options.relatedWorkflows[i] );
			}
		},

		// Drop related processes table (only in UI)
		clearTableUI: function RelWf_clearTableUI()
		{
			this.options.dataTable.getRecordSet().reset();
			this.options.dataTable.render();
		},

		// Insert new related workflow into the table in UI
		insertWorkflowIntoUI: function RelWf_insertWorkflowIntoUI(workflow)
		{
			var workflowStatus = {
				'in-progress': this.msg("itd.related_workflows.in_progress"),
				'awaiting': this.msg("itd.related_workflows.awaiting"),
				'complete': this.msg("itd.related_workflows.complete") 
						+ " (" + this._getNiceDateTimeString(workflow.end_date) + ")"
			}[workflow.status];

			this.options.dataTable.addRow( {
				workflow: workflow.description,
				start_date: this._getNiceDateTimeString(workflow.start_date),
				progress: workflowStatus/*,
				person: "Nobody",
				cancel: "Cancel"*/
			} );
		},

		// Get related processes from server
		getRelatedProcesses: function RelWf_getRelatedProcesses()
		{
			// Get related processes for current task id
			var xmlHttp = new XMLHttpRequest();
			var url = Alfresco.constants.PROXY_URI 
					+ "api/itd/related-workflows?taskId=" 
					+ this.options.curTaskId + "&propName=" + this.options.relWflPropName;
			xmlHttp.open("GET", url, false);
			xmlHttp.send(null);

			// If smth bad happens - break
			if(xmlHttp.status != 200)
				return;

			// If everything is ok - get response
			var resp = eval('('+xmlHttp.responseText+')');

			// Clear local state, we will replace it with new state from the server
			this.options.relatedWorkflows.length = 0;

			// Fill local state with returned values
			for(var i in resp.workflows) {
				this.options.relatedWorkflows.push(resp.workflows[i]);
			}
		},

		// Just format UTCDateString from YYYY-MM-DD-HH-mm to the form we like (and to local TZ)
		_getNiceDateTimeString: function RelWf_getNiceDateTimeString( UTCDateString )
		{
			var tokens = UTCDateString.split('-');
			var cur_date = new Date(Date.UTC(tokens[0],tokens[1],tokens[2],tokens[3],tokens[4]));

			var year = cur_date.getFullYear();

			var month = cur_date.getMonth() + 1;
			if(month < 10) { month = "0" + month; }

			var day = cur_date.getDate();
			if(day < 10) { day = "0" + day; }

			/*var hours = cur_date.getHours();
			if(hours < 10) { hours = "0" + hours; }

			var mins = cur_date.getMinutes();
			if(mins < 10) { mins = "0" + mins; }*/

			//return day + '.' + month + '.' + year + ' ' + hours + ':' + mins;
			return day + '.' + month + '.' + year;
		},

		_getFormEl: function RelWf_getFormEl()
		{
			var dataField = document.getElementById(this.id);
			var el = dataField;
			while (el.tagName != 'FORM')
				el = el.parentElement;
			return el;
		}
	});

})();
