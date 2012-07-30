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

// TODO FIXME - looks like they should be global to interact with jit-yc.js
var labelType, useGradients, nativeTextSupport, animate;

(function()
{
	ITD.OrgchartViewer = function(htmlId)
	{
		ITD.OrgchartViewer.superclass.constructor.call(this, "OrgchartViewer", htmlId);
		return this;
	};

	YAHOO.extend(ITD.OrgchartViewer, Alfresco.component.Base,
	{
		options:
		{
			// Control mode - 'viewer' or 'picker'
			mode: '',
			// If control is disabled (has effect in 'picker' mode only)
			disabled: false,
			// If control allows to pick multiple assignees (has effect in 'picker' mode only)
			multipleSelectMode: false,
			// If we show now 'people' or 'roles'
			pickerView: 'roles',
			// Root group to start orgchart from
			rootGroup: '__orgstruct__',
			// Selected group
			selectedGroup: null,
			// Initial assignees list (in 'picker' mode)
			assignees: [],
			// Assignees added at current stage (in 'picker' mode)
			assignees_added: [],
			// Assignees removed at current stage (in 'picker' mode)
			assignees_removed: [],
			// Org chart tree control
			tree: null,
			// Datatable in UI
			usersDataTable: null,
			// Datasource for datatable
			usersDataSource: null,
			// Data store for datatable as JS array
			usersDataStore: [],
			// Orgstruct
			orgStruct: null,
			// JIT object
			st: null,
			// JIT canvas height
			jitHeight: 300
		},

		onReady: function OrgchartViewer_onReady()
		{
			// Get orgchart data from server - groups only, without users to reduce load time
			var xmlHttp = new XMLHttpRequest();
			xmlHttp.open("GET", Alfresco.constants.PROXY_URI
					+ "api/itd/orgstruct?rootGroup=" + this.options.rootGroup,
					false);
			xmlHttp.send(null);

			// In viewer mode init selector and JIT canvas on the page
			if(this.options.mode == "viewer")
			{
				var header = document.getElementById("alf-hd");
				var wrapper = header.parentNode.parentNode;
				var footer = document.getElementById("alf-ft").parentNode;
				var selector = document.getElementById(this.id + "-top-group-selector");

				this.options.jitHeight = wrapper.clientHeight - header.clientHeight - selector.clientHeight 
								- footer.clientHeight - 25;

				document.getElementById(this.id + '-infovis').style.height = this.options.jitHeight + 'px';

				// Check if we really got orgchart data
				if (xmlHttp.status != 200)
					return;

				// Parse orgchart data
				this.options.orgStruct = eval('(' + xmlHttp.responseText + ')');

				if(this.options.orgStruct.data.children.length > 0) {
					var selector = document.getElementById(this.id + '-top-group-selector');
					for(c in this.options.orgStruct.data.children) {
						var link = document.createElement("a");
						link.href = "#";
						link.id = this.id + '-top-group-' + c;
						link.innerHTML = this.options.orgStruct.data.children[c].name;
						selector.appendChild(link);
						selector.innerHTML += ' ';
						YAHOO.util.Event.onAvailable(this.id + '-top-group-' + c, 
								this.attachTopGroupSelectorListener, c, this);
					}

					this.createJIT();
					this.selectTopGroup(null, 0);
				}
			// In picker mode - load assignees info and create button if necessary
			}
			else if (this.options.mode == "picker")
			{
				// Create button if control is enabled
				if(!this.options.disabled) {
					var orgchartPickerButton =  new YAHOO.widget.Button(this.id + "-cntrl-orgchart-picker-button", 
								{ onclick: { fn: this.showTreePicker, obj: null, scope: this } });
				}

				// Check if we really got orgchart data
				if (xmlHttp.status != 200)
					return;

				// Parse orgchart data
				this.options.orgStruct = eval('(' + xmlHttp.responseText + ')');

				// Get nodeRefs
				var cur_assignees_refs = document.getElementById(this.id).value.split(',');

				// Prepare request to get names from nodeRefs
				var req = {};
				req['items'] = cur_assignees_refs;
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

				var names = eval('('+xmlHttp_names.responseText+')');
				names = names.data.items;

				// Show current assignees names in HTML
				document.getElementById(this.id + "-cntrl-currentValueDisplay").innerHTML = '';
				document.getElementById(this.id + "-cntrl-current").value = '';
				document.getElementById(this.id + "-cntrl-current-names").value = '';

				for (m in names) {
					document.getElementById(this.id + "-cntrl-currentValueDisplay").innerHTML 
						+= '<div><img src="/share/res/components/images/filetypes/generic-user-16.png" '
							+ 'width="16" alt="" title="' + names[m].name + '"> ' + names[m].name + ' </div>';
					document.getElementById(this.id + "-cntrl-current").value 
						+= (m < names.length - 1 ? names[m].nodeRef + ',' : names[m].nodeRef);
					document.getElementById(this.id + "-cntrl-current-names").value 
						+= (m < names.length - 1 ?  names[m].name + ';' : names[m].name);
				}
			}
		},

		attachTopGroupSelectorListener: function OrgchartViewerDialog_attachTopGroupSelectorListener(top_group_index)
		{
			YAHOO.util.Event.on(this.id + '-top-group-' + top_group_index, 'click', 
							this.selectTopGroup, top_group_index, this);
		},

		selectTopGroup: function OrgchartViewerDialog_selectTopGroup(event, top_group_index)
		{
			// load json data to draw initial orgstruct group scheme
			this.options.st.loadJSON(this.options.orgStruct.data.children[top_group_index]);

			// compute node positions and layout
			this.options.st.compute();

			// optional: make a translation of the tree
			this.options.st.geom.translate(new $jit.Complex(-200, 0), "current");

			// emulate a click on the root node
			this.options.st.onClick(this.options.st.root);

			// small hack to ensure nodes sizes were really recalculated _after_ labels were displayed
			this.options.st.refresh();
			this.options.st.refresh();
		},

		// Create JIT canvas and fill it with orgchart data
		createJIT: function OrgchartViewer_createJIT()
		{
			/* Get client parameters and set rendering options - it was just copy-pasted.
			* I guess it is something great, but I have no idea how it works.
			*/
			var ua = navigator.userAgent;
			var iStuff = ua.match(/iPhone/i) || ua.match(/iPad/i);
			var typeOfCanvas = typeof HTMLCanvasElement;
			var nativeCanvasSupport = (typeOfCanvas == 'object' || typeOfCanvas == 'function');
			var textSupport = nativeCanvasSupport 
					&& (typeof document.createElement('canvas').getContext('2d').fillText == 'function');
			// It is set based on the fact that ExCanvas provides text support for IE 
			// and that as of today iPhone/iPad current text support is lame
			labelType = (!nativeCanvasSupport || (textSupport && !iStuff)) ? 'Native' : 'HTML';
			nativeTextSupport = labelType == 'Native';
			useGradients = nativeCanvasSupport;
			animate = !(iStuff || !nativeCanvasSupport);

			me = this;

			this.options.st = new $jit.ST({

				// tree orientation
				orientation: 'top',

				// levels of subtree to show, relative to the selected node
				levelsToShow: 10,

				// show the whole tree whether it fits into canvas or not
				constrained: false,

				// id of viz container element
				injectInto : this.id + '-infovis',

				// set duration for the animation
				duration : 250,

				// set animation transition type
				transition : $jit.Trans.Quart.easeInOut,

				// set distance between node and its children
				levelDistance : 60,

				// distance from the selected node to the center of the canvas
				offsetX: 0,
				offsetY: this.options.jitHeight / 2 - 75,

				// enable panning
				Navigation : {
					enable : true,
					panning : true
				},

				// set node and edge styles
				// set overridable=true for styling individual
				// nodes or edges
				Node : {
					height : 40,
					width : 150,
					autoWidth : false,	// set it to auto-adapt to the label width
					autoHeight : true,	// set it to auto-adapt to the label height
					type : 'rectangle',
					align : 'center',
					color : '#ddd',
					overridable : true
				},

				Edge : {
					type : 'bezier',
					color : '#aaa',
					overridable : true
				},

				onBeforeCompute : function(node) {
					// Do smth clever here
				},

				onAfterCompute : function() {
					// Do smth clever here
				},

				// This method is called on DOM label creation.
				// We use it to assign necessary events for them
				onCreateLabel : function(label, node)
				{
					label.id = node.id;
					label.innerHTML = '<table style="height: 100%; width: 100%;" id="' + node.id + '-view-container">'
								+ '<tr><td style="height=100%;">'
								+ '<a href="#" id="' + node.id + '-view">' + node.name + '</a>' 
								+ '</td></tr></table>';

					YAHOO.util.Event.on(label.id, 'click', me.onContainerClick, node, me);
					YAHOO.util.Event.on(label.id + '-view', 'click', me.onViewLinkClick, node, me);

					// set label styles
					var style = label.style;
					style.width = 150 + 'px';
					style.height = 40 + 'px';
					style.cursor = 'pointer';
					style.color = '#333';
					style.fontSize = 14 + 'px';
					style.textAlign = 'center';

				},

				// This method is called right before plotting
				// a node. It's useful for changing an individual node
				// style properties before plotting it.
				// The data properties prefixed with a dollar
				// sign will override the global node style properties.
				onBeforePlotNode : function(node)
				{
					// default node height
					var label_height = 40;

					// get height of the node label
					var label = document.getElementById(node.id + "-view-container");
					if(label && label.clientHeight > 40)
						label_height = label.clientHeight;

					// if label is too big - resize node
					if(label_height > node.data.$height)
						node.data.$height = label_height;

					// add some color to the nodes in the path between the
					// root node and the selected node.
					if (node.selected) {
						node.data.$color = "#94C4E7";
					} else {
						delete node.data.$color;
						// if the node belongs to the last plotted level
						if (!node.anySubnode("exist")) {
							// count children number
							var count = 0;
							node.eachSubnode(function(n) {
								count++;
							});
							// assign a node color based on
							// how many children it has
							node.data.$color = '#ddd';
						}
					}
				},

				// This method is called right before plotting
				// an edge. It's useful for changing an individual edge
				// style properties before plotting it.
				// Edge data proprties prefixed with a dollar sign will
				// override the Edge global style properties.
				onBeforePlotLine : function(adj)
				{
					if (adj.nodeFrom.selected && adj.nodeTo.selected) {
						adj.data.$color = "#aaa";
						adj.data.$lineWidth = 3;
					} else {
						delete adj.data.$color;
						delete adj.data.$lineWidth;
					}
				}
			});

		},

		// On node click get users data from server and create fields and controls for them.
		onContainerClick: function OrgchartViewerDialog_onContainerClick(event, node)
		{
			if(!this.options.st.busy) {
				this.options.st.busy = true;
				var node = this.options.st.graph.getNode(node.id);
				this.options.st.selectPath(node, this.options.st.clickedNode);
				this.options.st.clickedNode = node;
				this.options.st.plot();
				this.options.st.busy = false;
			}
		},

		onViewLinkClick: function OrgchartViewerDialog_onViewLinkClick(event, node)
		{
			this.createDetailsDialog(node);
		},

		// Render dialog with tree picker
		showTreePicker: function OrgchartViewerDialog_showTreePicker()
		{
			// Custom template URL provided by orgchart-form.get.* component
			var templateUrl = Alfresco.constants.URL_SERVICECONTEXT + "components/workflow/itd/organization-tree-picker-form";

			// It looks like 'destroyOnHide: true' works globally for all dialogs on the page - do not use it
			if( !this.widgets.dialog )
			{
				this.widgets.dialog = new Alfresco.module.SimpleDialog(this.id + "-popup-dialog");

				this.widgets.dialog.setOptions(
				{
					width: "974px",
					templateUrl: templateUrl,
					actionUrl: null,
					destroyOnHide: false,
					doBeforeDialogShow:
					{
						fn: function DataLists_onEditList_doBeforeDialogShow(p_form, p_dialog)
						{
							YAHOO.util.Dom.addClass(
								document.getElementById(this.id + '-popup-dialog-person-info'), "person-hidden"
							);
							this.fillPickerDialog();
						},
						scope: this
					},
					doBeforeAjaxRequest:
					{
						fn: function before_ajax_req(config, dialog)
						{
							// Hide (destroy) the dialog
							// It looks like 4.0.d calls _hideDialog itself anycase.
							// So we disable it to prevent 'double destroy'.
							// TODO - requires detailed testing
							// dialog._hideDialog();
							this.activateFormButtons();
							// Cancel popup form submission
							return false;
						},
						obj: this.widgets.dialog,
						scope: this
					},
					onSuccess:
					{
						fn: function on_success(response, p_obj)
						{
							// We should never get here.
						},
						scope: this
					},
					onFailure:
					{
						fn: function on_failure(response)
						{
							// We should never get here.
						},
						scope: this
					}
				});
			}
			this.widgets.dialog.show();	
		},

		// TODO - do we need this function? If yes - may be rewrite it on Y.B.f?
		activateFormButtons: function OrgchartViewerDialog_activateFormButtons()
		{
			YAHOO.Bubbling.fire("mandatoryControlValueUpdated", this);
		},

		createDetailsDialog: function OrgchartViewerDialog_createDetailsDialog(node)
		{
			// Set active group
			this.options.selectedGroup = node;

			// Custom template URL provided by orgchart-form.get.* component
			var templateUrl = Alfresco.constants.URL_SERVICECONTEXT + "components/workflow/itd/orgchart-group-view-dialog";

			// It looks like 'destroyOnHide: true' works globally for all dialogs on the page - do not use it
			if( !this.widgets.dialog )
			{
				this.widgets.dialog = new Alfresco.module.SimpleDialog(this.id + "-popup-dialog");

				this.widgets.dialog.setOptions(
				{
					width: "750px",
					templateUrl: templateUrl,
					actionUrl: null,
					destroyOnHide: false,
					doBeforeDialogShow:
					{
						fn: function DataLists_onEditList_doBeforeDialogShow(p_form, p_dialog)
						{
							YAHOO.util.Dom.addClass(
								document.getElementById(this.id + '-popup-dialog-person-info'), "person-hidden"
							);
							this.fillDetailsDialog();
						},
						scope: this
					},
					doBeforeAjaxRequest:
					{
						fn: function before_ajax_req(config, dialog)
						{
							// Hide (destroy) the dialog
							// Cancel popup form submission
							return false;
						},
						obj: this.widgets.dialog,
						scope: this
					},
					onSuccess:
					{
						fn: function on_success(response, p_obj)
						{
							// We should never get here.
						},
						scope: this
					},
					onFailure:
					{
						fn: function on_failure(response)
						{
							// We should never get here.
						},
						scope: this
					}
				});
			}
			this.widgets.dialog.show();
		},

		fillPickerDialog: function OrgchartViewerDialog_fillPickerDialog()
		{
			YAHOO.util.Event.on(this.id + "-popup-dialog-view-people", 'click', this.togglePeopleView, null, this);
			YAHOO.util.Event.on(this.id + "-popup-dialog-view-roles", 'click', this.toggleRolesView, null, this);

			// build current assignees list
			var assignees_refs = document.getElementById(this.id + '-cntrl-current').value.split(',');
			var assignees_names = document.getElementById(this.id + '-cntrl-current-names').value.split(';');
			this.fill_people_list(this.options.assignees, assignees_refs, assignees_names);

			// build added assignees list
			var assignees_added_refs = document.getElementById(this.id + '-cntrl-added').value.split(',');
			var assignees_added_names = document.getElementById(this.id + '-cntrl-added-names').value.split(';');
			this.fill_people_list(this.options.assignees_added, assignees_added_refs, assignees_added_names);

			// build removed assignees list
			var assignees_removed_refs = document.getElementById(this.id + '-cntrl-removed').value.split(',');
			var assignees_removed_names = document.getElementById(this.id + '-cntrl-removed-names').value.split(';');
			this.fill_people_list(this.options.assignees_removed, assignees_removed_refs, assignees_removed_names);

			// fill tree view group selector
			this.options.tree = new YAHOO.widget.TreeView(this.id + "-popup-dialog-groups");

			if(this.options.orgStruct)
				for(c in this.options.orgStruct.data.children) {
					var node = this.insertTreeLabel(this.options.tree.getRoot(), this.options.orgStruct.data.children[c]);
					node.expand();
				}

			this.options.tree.subscribe("labelClick", this.treeViewClicked, null, this);

			this.options.tree.draw();

			// init datatable to show current group members
			this.initUsersTable();

			// Update UI
			this.updateFormFields();
		},

		insertTreeLabel: function OrgchartViewerDialog_insertTreeLabel(curRoot, newNode)
		{
			var curElem = new YAHOO.widget.TextNode(newNode.name, curRoot, false);
			curElem.labelElId = newNode.id;
			for(c in newNode.children)
				this.insertTreeLabel(curElem, newNode.children[c]);
			return curElem;
		},

		treeViewClicked: function OrgchartViewerDialog_treeViewClicked(node)
		{
			this.options.selectedGroup = node;
			this.options.selectedGroup.id = node.labelElId;
			this.fillRolesTable(this.options.selectedGroup.id);
		},

		fillDetailsDialog: function OrgchartViewerDialog_fillDetailsDialog()
		{
			document.getElementById(this.id + "-popup-dialog-dialogTitle").innerHTML = this.options.selectedGroup.name;
			YAHOO.util.Event.on(this.id + "-popup-dialog-view-people", 'click', this.togglePeopleView, null, this);
			YAHOO.util.Event.on(this.id + "-popup-dialog-view-roles", 'click', this.toggleRolesView, null, this);

			this.initUsersTable();
		},

		initUsersTable: function OrgchartViewerDialog_initUsersTable()
		{
			var myColumnDefs = [
				{key:"icon", sortable:false, width:32},
				{key:"name", sortable:false, minWidth: 10000},
				{key:"action", sortable:false, width:32}
			];

			this.options.usersDataSource = new YAHOO.util.DataSource(this.options.usersDataStore);
			this.options.usersDataSource.responseType = YAHOO.util.DataSource.TYPE_JSARRAY;
			this.options.usersDataSource.responseSchema = {
				fields: ["icon", "name", "action", "role"]
			};

			this.options.usersDataTable = new YAHOO.widget.GroupedDataTable(this.id + "-popup-dialog-group-members",
				myColumnDefs, this.options.usersDataSource,
			{
				groupBy: "role",
				MSG_EMPTY: this.msg("itd.orgchart.no_people_in_group"),
				renderLoopSize: 100
			} );

			if(this.options.selectedGroup != null)
				this.fillRolesTable(this.options.selectedGroup.id);
		},

		fillPeopleTable: function OrgchartViewerDialog_fillPeopleTable(node_id)
		{
			// clear data for display
			this.options.usersDataStore.length = 0;

			// if there is no node - just reload the table 
			if( node_id == null || node_id == '' ) {
				this.options.usersDataTable.getDataSource().sendRequest('', 
					{ 	success: this.options.usersDataTable.onDataReturnInitializeTable, 
						scope: this.options.usersDataTable
					} );
				return;
			}

			// retrieve list of members
			var xmlHttp_members = new XMLHttpRequest();
			xmlHttp_members.open("GET", Alfresco.constants.PROXY_URI
					+ "api/itd/orgstruct/" + node_id + "/members?includeNodeRefs=true",
					false);
			xmlHttp_members.send(null);

			if (xmlHttp_members.status != 200)
				return;

			var details_members = eval('('+xmlHttp_members.responseText+')');

			// retrieve list of roles
			var xmlHttp_roles = new XMLHttpRequest();
			xmlHttp_roles.open("GET", Alfresco.constants.PROXY_URI
					+ "api/itd/orgstruct/" + node_id + "/roles?includeNodeRefs=true",
					false);
			xmlHttp_roles.send(null);

			if (xmlHttp_roles.status != 200)
				return;

			var details_roles = eval('('+xmlHttp_roles.responseText+')');

			for(r in details_roles.data)
			{
				// retrieve list of members in this role
				var xmlHttp_role_members = new XMLHttpRequest();
				xmlHttp_role_members.open("GET", Alfresco.constants.PROXY_URI
						+ "api/itd/orgstruct/" + node_id + "/role/" 
						+ details_roles.data[r].shortName + "?includeNodeRefs=true",
						false);
				xmlHttp_role_members.send(null);

				if (xmlHttp_role_members.status != 200)
					return;

				var details_role_members = eval('('+xmlHttp_role_members.responseText+')');

				// push all users to datasource to display
				for (x in details_role_members.data) {
					var index = this.userInArray(details_members.data, details_role_members.data[x]);
					if(index == -1)
						details_members.data.push(details_role_members.data[x]);
				}
			}

			// sort alphabetically
			this.sortPeople(details_members.data);

			// push all users to datasource to display placing them into default role
			for (x in details_members.data) {
				this.options.usersDataStore.push(
					{
						icon: this.getUserIcon(),
						name: this.formatName(details_members.data[x]),
						action: this.getActionButtonsHTML(details_members.data[x]),
						role: this.msg("itd.orgchart.default_group")
					}
				);
			}

//	Commenting out managers here because their role is 'technical' (like 'group admin')
//	'Managers' have nothing about orgstruct, roles are set via 'roles' (thanks, cap)
//			// retrieve list of managers
//			var xmlHttp_managers = new XMLHttpRequest();
//			xmlHttp_managers.open("GET", Alfresco.constants.PROXY_URI
//					+ "api/itd/orgstruct/" + node_id + "/managers?includeNodeRefs=true",
//					false);
//			xmlHttp_managers.send(null);
//
//			if (xmlHttp_managers.status != 200)
//				return;
//
//			var details_managers = eval('('+xmlHttp_managers.responseText+')');
//
//			// create controls for each user to allow to select it
//			for (x in details_managers.data) {
//				this.options.usersDataStore.push(
//					{
//						icon: this.getUserIcon(),
//						name: this.formatName(details_managers.data[x])
//						action: '',
//						role: this.msg("itd.orgchart.default_group")
//					}
//				);
//				} );
//			}

			this.options.usersDataTable.getDataSource().sendRequest('', 
				{ success: this.options.usersDataTable.onDataReturnInitializeTable, scope: this.options.usersDataTable }
			);
		},

		fillRolesTable: function OrgchartViewerDialog_fillRolesTable(node_id)
		{
			// clear data for display
			this.options.usersDataStore.length = 0;

			// if there is no node - just reload the table 
			if( node_id == null || node_id =='' ) {
				this.options.usersDataTable.getDataSource().sendRequest('', 
					{ 	success: this.options.usersDataTable.onDataReturnInitializeTable, 
						scope: this.options.usersDataTable
					} );
				return;
			}

			// retrieve list of members
			var xmlHttp_members = new XMLHttpRequest();
			xmlHttp_members.open("GET", Alfresco.constants.PROXY_URI
					+ "api/itd/orgstruct/" + node_id + "/members?includeNodeRefs=true",
					false);
			xmlHttp_members.send(null);

			if (xmlHttp_members.status != 200)
				return;

			var details_members = eval('('+xmlHttp_members.responseText+')');

			// retrieve list of roles
			var xmlHttp_roles = new XMLHttpRequest();
			xmlHttp_roles.open("GET", Alfresco.constants.PROXY_URI
					+ "api/itd/orgstruct/" + node_id + "/roles?includeNodeRefs=true",
					false);
			xmlHttp_roles.send(null);

			if (xmlHttp_roles.status != 200)
				return;

			var details_roles = eval('('+xmlHttp_roles.responseText+')');

			for(r in details_roles.data)
			{
				// retrieve list of members in this role
				var xmlHttp_role_members = new XMLHttpRequest();
				xmlHttp_role_members.open("GET", Alfresco.constants.PROXY_URI
						+ "api/itd/orgstruct/" + node_id + "/role/" 
						+ details_roles.data[r].shortName + "?includeNodeRefs=true",
						false);
				xmlHttp_role_members.send(null);

				if (xmlHttp_role_members.status != 200)
					return;

				var details_role_members = eval('('+xmlHttp_role_members.responseText+')');

				this.sortPeople(details_role_members.data);

				// push all users to datasource to display
				for (x in details_role_members.data) {
					this.options.usersDataStore.push(
						{
							icon: this.getUserIcon(),
							name: this.formatName(details_role_members.data[x]),
							action: this.getActionButtonsHTML(details_role_members.data[x]),
							role: details_roles.data[r].roleName
						}
					);
					var index = this.userInArray(details_members.data, details_role_members.data[x]);
					if(index != -1)
						details_members.data.splice(index, 1);
				}
			}

			this.sortPeople(details_members.data);

			// push all users without roles to datasource to display placing them into default role
			for (x in details_members.data) {
				this.options.usersDataStore.push(
					{
						icon: this.getUserIcon(),
						name: this.formatName(details_members.data[x]),
						action: this.getActionButtonsHTML(details_members.data[x]),
						role: this.msg("itd.orgchart.default_group")
					}
				);
			}

			this.options.usersDataTable.getDataSource().sendRequest('', 
				{ success: this.options.usersDataTable.onDataReturnInitializeTable, scope: this.options.usersDataTable }
			);
		},

		// Compares two person objects
		usersEqual: function OrgchartViewerDialog_usersEqual(user1, user2)
		{
			return user1.nodeRef === user2.nodeRef;
		},

		// Checks if person is present in the list
		userInArray: function OrgchartViewerDialog_userInArray(array, user)
		{
			var i = array.length;
			while (i--)
				if ( this.usersEqual(array[i], user) )
					return i;
			return -1;
		},

		formatName: function OrgchartViewerDialog_formatName(user)
		{
			YAHOO.util.Event.onAvailable(this.id + '-user-' + user.shortName, 
					this.attachUserInfoListener, user.shortName, this);
			return '<h3 class="name"><a id="' + this.id + '-user-' + user.shortName 
					+ '" href="#">' + user.name + '</a></h3>';
		},

		attachUserInfoListener: function OrgchartViewerDialog_attachUserInfoListener(shortName)
		{
			YAHOO.util.Event.on(this.id + '-user-' + shortName, 'click', 
							this.showUserInfo, shortName, this);
		},

		showUserInfo: function OrgchartViewerDialog_showUserInfo(event, shortName)
		{
			// retrieve info
			var xmlHttp_profile = new XMLHttpRequest();
			xmlHttp_profile.open("GET", Alfresco.constants.PROXY_URI
					+ "api/people/" + shortName,
					false);
			xmlHttp_profile.send(null);

			if (xmlHttp_profile.status != 200)
				return;

			var profile = eval('('+xmlHttp_profile.responseText+')');

			// fill html fields
			document.getElementById(this.id + '-popup-dialog-person-img').src 
					= Alfresco.constants.PROXY_URI + 'slingshot/profile/avatar/' + shortName;

			document.getElementById(this.id + '-popup-dialog-person-name').innerHTML 
					= profile.firstName + " " + profile.lastName;

			document.getElementById(this.id + '-popup-dialog-person-title').innerHTML 
					= profile.jobtitle;

			document.getElementById(this.id + '-popup-dialog-person-company').innerHTML 
					= profile.organization;

			document.getElementById(this.id + '-popup-dialog-person-phone').innerHTML 
					= profile.companytelephone;

			document.getElementById(this.id + '-popup-dialog-person-cell').innerHTML 
					= profile.mobile;

			document.getElementById(this.id + '-popup-dialog-person-email').innerHTML 
					= profile.companyemail;

			document.getElementById(this.id + '-popup-dialog-person-skype').innerHTML 
					= profile.skype;

			document.getElementById(this.id + '-popup-dialog-person-im').innerHTML 
					= profile.instantmsg;

			document.getElementById(this.id + '-popup-dialog-person-loc').innerHTML 
					= profile.location;

			document.getElementById(this.id + '-popup-dialog-person-bio').innerHTML 
					= profile.persondescription;

			document.getElementById(this.id + '-popup-dialog-person-links').innerHTML 
					= '<a target="_blank" href="/share/page/user/' + shortName + '/profile">' 
						+ this.msg("itd.orgchart.view_profile") + '</a>';

			// show field
			YAHOO.util.Dom.removeClass( document.getElementById(this.id + '-popup-dialog-person-info'), "person-hidden" );
		},

		getUserIcon: function OrgchartViewerDialog_getUserIcon()
		{
			return '<div class="icon32">' 
					+ '<img src="/share/res/components/images/filetypes/generic-user-32.png" width="32"/></div>';
		},

		togglePeopleView: function OrgchartViewerDialog_togglePeopleView(event)
		{
			this.options.pickerView = 'people';
			if(this.options.selectedGroup != null)
				this.fillPeopleTable(this.options.selectedGroup.id);
		},

		toggleRolesView: function OrgchartViewerDialog_toggleRolesView(event)
		{
			this.options.pickerView = 'roles';
			if(this.options.selectedGroup != null)
				this.fillRolesTable(this.options.selectedGroup.id);
		},

		sortPeople: function OrgchartViewerDialog_toggleRolesView(people)
		{
			people.sort( function(a,b){
				var nameA=a.name.toLowerCase();
				var nameB=b.name.toLowerCase();
				if (nameA < nameB) //sort string ascending
					return -1;
				if (nameA > nameB)
					return 1;
				return 0;
			} );
		},

		// Create people struct list from two arrays of names and node refs
		fill_people_list: function OrgchartViewerDialog_fill_people_list(list, refs, names)
		{
			list.length = 0;

			for (x in refs)
				if (refs[x] == '')
					refs.splice(x,1);
			for (x in names)
				if (names[x] == '')
					names.splice(x,1);

			if(refs.length != names.length)
				return;

			for (x in refs)
				list.push({ 'name': names[x], 'nodeRef': refs[x] });
		},

		getActionButtonsHTML: function OrgchartViewerDialog_getActionButtonsHTML(person)
		{
			if(this.options.mode == 'viewer' || this.options.disabled)
				return '';

			if( (this.options.multipleSelectMode == false) 
					&& (this.options.assignees.length + this.options.assignees_added.length 
						- this.options.assignees_removed.length > 0) )
				return '';

			YAHOO.util.Event.onAvailable(this.id + '-add-button-' + person.nodeRef, 
						this.attachAddClickListener, person, this);
			return this.getAddButtonHTML(person);
		},

		getAddButtonHTML: function OrgchartViewerDialog_getAddButtonHTML(person)
		{
			return '<a href="#" class="add-item" id="' + this.id + '-add-button-' + person.nodeRef 
					+ '"><img src="/share/res/components/images/add-icon-16.png" width="16"/></a>';
		},

		attachAddClickListener: function OrgchartViewerDialog_attachAddClickListener(person)
		{
			YAHOO.util.Event.on(this.id + '-add-button-' + person.nodeRef, 'click', this.addPerson, person, this);
		},

		getRemoveButtonHTML: function OrgchartViewerDialog_getRemoveButtonHTML(person)
		{
			return '<a href="#" class="remove-item" id="' + person.nodeRef 
					+ '"><img src="/share/res/components/images/remove-icon-16.png" width="16"/></a>';
		},

		attachRemoveClickListener: function OrgchartViewerDialog_attachRemoveClickListener(person)
		{
			YAHOO.util.Event.on(person.nodeRef, 'click', this.removePerson, person, this);
		},

		// Updates all form fields
		updateFormFields: function OrgchartViewerDialog_updateFormFields()
		{
			// Just ids for nodeRef field and for name field
			var fieldId;
			var fieldId2;

			// Build final list by merging all adds and removes
			var merged = this.options.assignees.concat(this.options.assignees_added);
			for (r in this.options.assignees_removed)
				for (m in merged)
					if( this.usersEqual(merged[m], this.options.assignees_removed[r]) )
						merged.splice(m,1);

			// Update selected users in UI in popup dialog
			fieldId = this.id + "-popup-dialog-selected-users";
			document.getElementById(fieldId).innerHTML = '';
			for (m in merged) {
				document.getElementById(fieldId).innerHTML 
					+= '<div><img src="/share/res/components/images/filetypes/generic-user-16.png" '
						+ 'width="16" alt="" title="' + merged[m].name + '"> ' + merged[m].name + ' ' 
						+ this.getRemoveButtonHTML(merged[m]) + '</div>';
				YAHOO.util.Event.onAvailable(merged[m].nodeRef, this.attachRemoveClickListener, merged[m], this);
			}

			// Update selected users in UI in main dialog
			fieldId = this.id + "-cntrl-currentValueDisplay";
			document.getElementById(fieldId).innerHTML = '';
			for (m in merged)
				document.getElementById(fieldId).innerHTML 
					+= '<div><img src="/share/res/components/images/filetypes/generic-user-16.png" ' 
						+ 'width="16" alt="" title="' + merged[m].name + '"> ' + merged[m].name + ' </div>';

			// Update selected users in hidden control in main dialog
			fieldId = this.id;
			document.getElementById(fieldId).value = '';
			for (m in merged)
				document.getElementById(fieldId).value += ( m < merged.length-1 
					? merged[m].nodeRef + ',' : merged[m].nodeRef );

			// Update current assignees list in main dialog
			fieldId = this.id + "-cntrl-current";
			fieldId2 = this.id + "-cntrl-current-names";
			document.getElementById(fieldId).value = '';
			document.getElementById(fieldId2).value = '';
			for (m in this.options.assignees) {
				document.getElementById(fieldId).value += ( m < this.options.assignees.length-1 
					? this.options.assignees[m].nodeRef + ',' : this.options.assignees[m].nodeRef );
				document.getElementById(fieldId2).value += ( m < this.options.assignees.length-1 
					? this.options.assignees[m].name + ';' : this.options.assignees[m].name );
			}

			// Update added fields in main form to be submitted
			fieldId = this.id + "-cntrl-added";
			fieldId2 = this.id + "-cntrl-added-names";
			document.getElementById(fieldId).value = '';
			document.getElementById(fieldId2).value = '';
			for (m in this.options.assignees_added) {
				document.getElementById(fieldId).value += ( m < this.options.assignees_added.length-1 
					? this.options.assignees_added[m].nodeRef + ',' : this.options.assignees_added[m].nodeRef );
				document.getElementById(fieldId2).value += ( m < this.options.assignees_added.length-1 
					? this.options.assignees_added[m].name + ';' : this.options.assignees_added[m].name );
			}

			// Update removed fields in main form to be submitted
			fieldId = this.id + "-cntrl-removed";
			fieldId2 = this.id + "-cntrl-removed-names";
			document.getElementById(fieldId).value = '';
			document.getElementById(fieldId2).value = '';
			for (m in this.options.assignees_removed) {
				document.getElementById(fieldId).value += (m < this.options.assignees_removed.length-1 
					? this.options.assignees_removed[m].nodeRef+',' : this.options.assignees_removed[m].nodeRef);
				document.getElementById(fieldId2).value += (m < this.options.assignees_removed.length-1 
					? this.options.assignees_removed[m].name + ';' : this.options.assignees_removed[m].name);
			}

			// Update datatable. We need it to enable/disable 'add' button in single select mode.
			if(this.options.selectedGroup != null)
				if(this.options.pickerView == 'people')
					this.fillPeopleTable(this.options.selectedGroup.id);
				else
					this.fillRolesTable(this.options.selectedGroup.id);
		},

		// Add person to assignees
		addPerson: function OrgchartPickerDialog_addPerson(event, person)
		{
			//var person = {name: p_name, nodeRef: p_nodeRef};

			// If person is not in current list and not in added list - add it to added list
			if( (this.userInArray(this.options.assignees, person) == -1) 
				&& (this.userInArray(this.options.assignees_added, person) == -1) )
					this.options.assignees_added.push(person);

			// If person is in removed list - remove it from removed
			if( (this.userInArray(this.options.assignees_removed, person) != -1) )
				this.options.assignees_removed.splice( this.userInArray(this.options.assignees_removed, person), 1 );

			// Update UI
			this.updateFormFields();
		},

		// Remove person from assignees
		removePerson: function OrgchartPickerDialog_removePerson(event, person)
		{
			//var person = {name: p_name, nodeRef: p_nodeRef};

			// If person is in current list and not in removed list - add it to removed list
			if( (this.userInArray(this.options.assignees, person) != -1) 
				&& (this.userInArray(this.options.assignees_removed, person) == -1) )
					this.options.assignees_removed.push(person);

			// If person is in added list - remove it from added list
			if(this.userInArray(this.options.assignees_added, person) != -1)
				this.options.assignees_added.splice( this.userInArray(this.options.assignees_added, person), 1);

			// Update UI
			this.updateFormFields();
		}
	});
})();
