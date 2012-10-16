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

// TODO FIXME - looks like they should be global to interact with jit-yc.js
var labelType, useGradients, nativeTextSupport, animate;

(function()
{
	var Dom = YAHOO.util.Dom,
		Event = YAHOO.util.Event,
		KeyListener = YAHOO.util.KeyListener;
	var $html = Alfresco.util.encodeHTML;

	Alvex.OrgchartViewer = function(htmlId)
	{
		Alvex.OrgchartViewer.superclass.constructor.call(this, "OrgchartViewer", htmlId);
		YAHOO.Bubbling.on("formContentReady", this.onFormContentReady, this);
		return this;
	};

	YAHOO.extend(Alvex.OrgchartViewer, Alfresco.component.Base,
	{
		options:
		{
			// Control mode - 'viewer' or 'picker'
			mode: '',
			// Viewer style - 'tree' or 'graph'
			style: '',
			// Default role name for users without explicitely configured roles
			defaultRoleName: '',
			// If we should include users from child units or not
			showUnitsRecursively: false,
			// If control is disabled (has effect in 'picker' mode only)
			disabled: false,
			// If this form field is mandatory
			mandatory: false,
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
			// Orgchart
			orgchart: null,
			// JIT object
			st: null,
			// JIT canvas height
			jitHeight: 300,
			initialized: false
		},

		onFormContentReady: function()
		{
			if(!this.options.initialized) {
				this.options.initialized = true;
				this.init();
			}
		},

		onReady: function OrgchartViewer_onReady()
		{
			if(!this.options.initialized) {
				this.options.initialized = true;
				this.init();
			}
		},
		
		init: function()
		{
			this.options.controlId = this.id + '-cntrl';
			this.options.pickerId = this.id + '-cntrl-picker';
			if(this.options.defaultRoleName == '')
				this.options.defaultRoleName = this.msg("alvex.orgchart.default_group");
			
			// In viewer mode init selector and JIT canvas on the page
			if(this.options.mode == "viewer")
			{
				// If we are going to draw the graph - prepare canvas
				if (this.options.style == 'graph')
				{
					var header = Dom.get("alf-hd");
					var wrapper = header.parentNode.parentNode;
					var footer = Dom.get("alf-ft").parentNode;
					var selector = Dom.get(this.id + "-top-group-selector");

					this.options.jitHeight = wrapper.clientHeight - header.clientHeight 
										- selector.clientHeight - footer.clientHeight - 25;

					Dom.get(this.id + '-infovis').style.height = this.options.jitHeight + 'px';
				}

				// Get orgchart data from server - groups only, without users to reduce load time
				
				// Get orgchart branches
				Alfresco.util.Ajax.jsonRequest({
					url: Alfresco.constants.PROXY_URI + "api/alvex/orgchart/branches",
					method: Alfresco.util.Ajax.GET,
					dataObj: null,
					successCallback:
					{
						fn: function (resp)
						{
							if(resp.json.branches.length == 0)
								return;
							// Get default branch
							Alfresco.util.Ajax.jsonRequest({
								url: Alfresco.constants.PROXY_URI 
										+ "api/alvex/orgchart/tree/default",
								method: Alfresco.util.Ajax.GET,
								dataObj: null,
								successCallback:
								{
									fn: function (resp)
									{
										this.options.orgchart = resp.json.data[0];
							
										if(this.options.orgchart.children.length > 0)
										{
											this.createViewDialog();
											if (this.options.style == 'graph')
											{
												//Dom.removeClass( Dom.get(this.id + '-top-group-selector'), "hidden" );
												Dom.removeClass( Dom.get(this.id + '-infovis'), "hidden" );
												this.createJIT();
												var selector = Dom.get(this.id + '-top-group-selector');
												//for(c in this.options.orgchart.children) {
													var link = document.createElement("a");
													link.href = "#";
													link.id = this.id + '-top-group-0';// + c;
													link.innerHTML = this.options.orgchart./*children[c].name*/displayName;
													selector.appendChild(link);
													selector.innerHTML += ' ';
													YAHOO.util.Event.onAvailable(this.id + '-top-group-' + c, 
															this.attachTopGroupSelectorListener, c, this);
												//}
												this.selectTopGroup(null, 0);
											}
											else if (this.options.style == 'tree')
											{
												Dom.removeClass( Dom.get(this.id + '-page-tree-view'), "hidden" );
												this.createTree();
											}
										}
									},
									scope:this
								}
							});
						},
						scope:this
					},
					failureCallback:
					{
						fn: function (resp)
						{
							if (resp.serverResponse.statusText)
								Alfresco.util.PopupManager.displayMessage({ text: resp.serverResponse.statusText });
						},
						scope:this
					}
				});
			// In picker mode - load assignees info and create button if necessary
			}
			else if (this.options.mode == "picker")
			{

				// Get existing assignees (if any)
				
				var cur_assignees_refs = [];
				if( Dom.get(this.id).value && Dom.get(this.id).value != '')
					cur_assignees_refs = Dom.get(this.id).value.split(',');

				// Prepare req to get names from nodeRefs
				var req = {};
				req['items'] = cur_assignees_refs;
				req['itemValueType'] = 'nodeRef';

				Alfresco.util.Ajax.jsonRequest({
					url: Alfresco.constants.PROXY_URI + "api/forms/picker/items",
					method: Alfresco.util.Ajax.POST,
					dataObj: req,
					successCallback:
					{
						fn: function (resp)
						{
							// Remember current assignees details
							this.options.assignees = resp.json.data.items;
							// And show them in HTML
							for (m in this.options.assignees) {
								Dom.get(this.id + "-cntrl-currentValueDisplay").innerHTML 
										+= '<div><img src="/share/res/components/images/filetypes/generic-user-16.png" '
										+ 'width="16" alt="" title="' + this.options.assignees[m].name + '"> ' 
										+ this.options.assignees[m].name + ' </div>';
							}
						},
						scope:this
					}
				});
				
				// Create button if control is enabled
				if(!this.options.disabled)
				{

					// Create picker button
					this.widgets.orgchartPickerButton =  new YAHOO.widget.Button(
								this.id + "-cntrl-orgchart-picker-button", 
								{ onclick: { fn: this.showTreePicker, obj: null, scope: this } }
						);

					// Get orgchart data from server - groups only, without users to reduce load time
					var me = this;
					// Get orgchart branches
					Alfresco.util.Ajax.jsonRequest({
						url: Alfresco.constants.PROXY_URI + "api/alvex/orgchart/branches",
						method: Alfresco.util.Ajax.GET,
						dataObj: null,
						successCallback:
						{
							fn: function (resp)
							{
								if(resp.json.branches.length == 0)
									return;
								// Get default branch
								Alfresco.util.Ajax.jsonRequest({
									url: Alfresco.constants.PROXY_URI 
											+ "api/alvex/orgchart/tree/default",
									method: Alfresco.util.Ajax.GET,
									dataObj: null,
									successCallback:
									{
										fn: function (resp)
										{
											me.options.orgchart = resp.json.data[0];
											me.createPickerDialog();
											me.updateUI();
										}
									},
									scope:me
								});
							},
							scope:this
						},
						failureCallback:
						{
							fn: function (resp)
							{
								if (resp.serverResponse.statusText)
									Alfresco.util.PopupManager.displayMessage({ text: resp.serverResponse.statusText });
							},
							scope:this
						}
					});
				}				
			}
		},

		createTree: function()
		{
			this.options.pageTreeView = new YAHOO.widget.TreeView(this.id + "-page-tree-view");
			
			YAHOO.widget.TreeView.FOCUS_CLASS_NAME = "";

			var rootNode = this.insertTreeLabel(this.options.pageTreeView.getRoot(), this.options.orgchart);
			//if(this.options.orgchart)
			//	for(c in this.options.orgchart.children) {
			//		var node = this.insertTreeLabel(rootNode, this.options.orgchart.children[c]);
			//		node.expand();
			//	}
			rootNode.expand();

			this.options.pageTreeView.subscribe("labelClick", this.pageTreeViewClicked, null, this);

			this.options.pageTreeView.draw();
		},

		pageTreeViewClicked: function(node)
		{
			var curNode = node;
			curNode.id = node.labelElId;
			curNode.name = node.label;
			this.showViewDialog(curNode);
		},

		createPickerDialog: function()
		{
			var me = this;
			
			this.widgets.ok = new YAHOO.widget.Button(this.options.controlId + "-ok",
								{ onclick: { fn: this.onOk, obj: null, scope: this } });
			this.widgets.cancel = new YAHOO.widget.Button(this.options.controlId + "-cancel",
								{ onclick: { fn: this.onCancel, obj: null, scope: this } });
								
			this.widgets.dialog = Alfresco.util.createYUIPanel(this.options.pickerId,
			{
				width: "974px"
			});
			this.widgets.dialog.hideEvent.subscribe(this.onCancel, null, this);
			
			// Register listeners for people/roles switchers
			YAHOO.util.Event.on(this.options.pickerId + "-view-people", 'click', this.togglePeopleView, null, this);
			YAHOO.util.Event.on(this.options.pickerId + "-view-roles", 'click', this.toggleRolesView, null, this);

			// Setup search button
			this.widgets.searchButton = new YAHOO.widget.Button(this.options.pickerId + "-searchButton");
			this.widgets.searchButton.on("click", this.onSearch, this.widgets.searchButton, this);

			// Register the "enter" event on the search text field
			var zinput = Dom.get(this.options.pickerId + "-searchText");
			new YAHOO.util.KeyListener(zinput,
			{
				keys: 13
			},
			{
			fn: me.onSearch,
				scope: this,
				correctScope: true
			}, "keydown").enable();

			// Create orgchart tree in the dialog
			this.fillPickerDialog();
			
			// Init datatable to show current orgchart unit
			this.initUsersTable();

			Dom.addClass(this.options.pickerId, "object-finder");
		},

		onOk: function(e, p_obj)
		{
			// Close dialog
			this.widgets.escapeListener.disable();
			this.widgets.dialog.hide();
			this.widgets.orgchartPickerButton.set("disabled", false);
			if (e) {
				Event.preventDefault(e);
			}
			// Update parent form
			this.updateFormFields();
			if(this.options.mandatory)
				YAHOO.Bubbling.fire("mandatoryControlValueUpdated", this);
		},

		onCancel: function(e, p_obj)
		{
			this.widgets.escapeListener.disable();
			this.widgets.dialog.hide();
			if( this.widgets.orgchartPickerButton )
				this.widgets.orgchartPickerButton.set("disabled", false);
			if (e) {
				Event.preventDefault(e);
			}
		},

		onSearch: function()
		{
			this.options.selectedGroup = null;
			var searchTerm = Dom.get(this.options.pickerId + "-searchText").value;
			var url = Alfresco.constants.PROXY_URI
						+ "api/forms/picker/authority/children?selectableType=cm:person&" 
						+ "searchTerm=" + encodeURIComponent(searchTerm) + "&size=100";

			Alfresco.util.Ajax.jsonRequest({
				url: url,
				method: Alfresco.util.Ajax.GET,
				dataObj: null,
				successCallback:
				{
					fn: function (resp)
					{
						var users = resp.json;

						for (x in users.data.items)
							users.data.items[x].roleDisplayName = this.msg("alvex.orgchart.people_found");

						// clear data for display
						this.options.usersDataStore.length = 0;

						// sort alphabetically
						this.sortPeople(users.data.items);

						// push all users to datasource to display placing them into default role
						for (x in users.data.items) {	
							users.data.items[x].userName = users.data.items[x].name.replace(/.*\(/, '').replace(/\).*/,'');
							users.data.items[x].name = users.data.items[x].name.replace(/\(.*/,'');
							this.options.usersDataStore.push(
								{
									name: users.data.items[x].name,
									userName: users.data.items[x].userName,
									nodeRef: users.data.items[x].nodeRef,
									role: users.data.items[x].role
								}
							);
						}

						this.options.usersDataTable.getDataSource().sendRequest('', 
							{ success: this.options.usersDataTable.onDataReturnInitializeTable, scope: this.options.usersDataTable }
						);
					},
					scope:this
				}
			});
		},

		attachTopGroupSelectorListener: function OrgchartViewerDialog_attachTopGroupSelectorListener(top_group_index)
		{
			YAHOO.util.Event.on(this.id + '-top-group-' + top_group_index, 'click', 
							this.selectTopGroup, top_group_index, this);
		},

		copyTreeForJIT: function(tree)
		{
			var jitTree = tree;
			jitTree.name = jitTree.displayName;
			for(var c in tree.children)
				jitTree.children[c] = this.copyTreeForJIT(tree.children[c]);
			return jitTree;
		},

		selectTopGroup: function OrgchartViewerDialog_selectTopGroup(event, top_group_index)
		{
			// load json data to draw initial orgchart group scheme
			var jitData = this.copyTreeForJIT(this.options.orgchart)
			this.options.st.loadJSON(jitData);

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
				var nodeEl = this.options.st.graph.getNode(node.id);
				this.options.st.selectPath(nodeEl, this.options.st.clickedNode);
				this.options.st.clickedNode = nodeEl;
				this.options.st.plot();
				this.options.st.busy = false;
			}
		},

		onViewLinkClick: function OrgchartViewerDialog_onViewLinkClick(event, node)
		{
			this.showViewDialog(node);
		},

		// Render dialog with tree picker
		showTreePicker: function OrgchartViewerDialog_showTreePicker(e, p_obj)
		{
			if( ! this.widgets.dialog )
				return;
			
			// Enable esc listener
			if (!this.widgets.escapeListener)
			{
				this.widgets.escapeListener = new KeyListener(this.options.pickerId,
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

			// Disable picker button to prevent double dialog call
			this.widgets.orgchartPickerButton.set("disabled", true);

			// Show the dialog
			this.widgets.dialog.show();

			Event.preventDefault(e);
		},

		createViewDialog: function OrgchartViewerDialog_createDetailsDialog()
		{
			var me = this;
								
			this.widgets.dialog = Alfresco.util.createYUIPanel(this.options.pickerId,
			{
				width: "750px"
			});
			this.widgets.dialog.hideEvent.subscribe(this.onCancel, null, this);
			
			// Register listeners for people/roles switchers
			YAHOO.util.Event.on(this.options.pickerId + "-view-people", 'click', this.togglePeopleView, null, this);
			YAHOO.util.Event.on(this.options.pickerId + "-view-roles", 'click', this.toggleRolesView, null, this);
			
			// Init datatable to show current orgchart unit
			this.initUsersTable();

			Dom.addClass(this.options.pickerId, "object-finder");
		},

		showViewDialog: function OrgchartViewerDialog_createDetailsDialog(node)
		{
			// Set active group
			this.options.selectedGroup = node;
			
			if( ! this.widgets.dialog )
				return;
			
			// Enable esc listener
			if (!this.widgets.escapeListener)
			{
				this.widgets.escapeListener = new KeyListener(this.options.pickerId,
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
			
			Dom.addClass(Dom.get(this.options.pickerId + '-person-info'), "person-hidden");

			this.fillDetailsDialog();

			// Show the dialog
			this.widgets.dialog.show();
			Dom.removeClass(this.options.pickerId, "hidden");
		},

		// Fill tree view group selector with orgchart data
		fillPickerDialog: function OrgchartViewerDialog_fillPickerDialog()
		{
			this.options.tree = new YAHOO.widget.TreeView(this.options.pickerId + "-groups");

			var rootNode = this.insertTreeLabel(this.options.tree.getRoot(), this.options.orgchart);
			//if(this.options.orgchart)
			//	for(c in this.options.orgchart.children) {
			//		var node = this.insertTreeLabel(this.options.tree.getRoot(), this.options.orgchart.children[c]);
			//		node.expand();
			//	}
			rootNode.expand();

			this.options.tree.subscribe("labelClick", this.treeViewClicked, null, this);

			this.options.tree.draw();
		},

		insertTreeLabel: function OrgchartViewerDialog_insertTreeLabel(curRoot, newNode)
		{
			var curElem = new YAHOO.widget.TextNode(newNode.displayName, curRoot, false);
			curElem.labelElId = newNode.id;
			for(c in newNode.children)
				this.insertTreeLabel(curElem, newNode.children[c]);
			return curElem;
		},

		treeViewClicked: function OrgchartViewerDialog_treeViewClicked(node)
		{
			this.options.selectedGroup = node;
			this.options.selectedGroup.id = node.labelElId;
			if( this.options.pickerView == 'roles' )
				this.fillRolesTable(this.options.selectedGroup.id);
			else
				this.fillPeopleTable(this.options.selectedGroup.id);
		},

		fillDetailsDialog: function OrgchartViewerDialog_fillDetailsDialog()
		{
			Dom.get(this.options.pickerId + "-head").innerHTML = this.options.selectedGroup.name;
			if( this.options.pickerView == 'roles' )
				this.fillRolesTable(this.options.selectedGroup.id);
			else
				this.fillPeopleTable(this.options.selectedGroup.id);
		},

		initUsersTable: function OrgchartViewerDialog_initUsersTable()
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
						var asset = me.options.usersDataTable.getRecord(args[1].target.offsetParent).getData();
						me[owner.className].call(me, asset, owner);
					}
				}
				return true;
			};
			YAHOO.Bubbling.addDefaultAction(this.id + "-action-link", fnActionHandler);

			var myColumnDefs = [
				{key:'icon', sortable:false, width:32, formatter: this.formatIconField},
				{key:'name', sortable:false, minWidth: 10000, formatter: this.formatNameField},
				{key:'action', sortable:false, width:52, formatter: this.formatActionsField}
			];

			// We use this simple dataSource because we are not sure about our requirements
			// For instance, orgchart browsing and user search are provided by different APIs
			// We are not sure about urls and resp schema of APIs we may need
			// So we have an option to fill js array locally after ajax request to any url
			this.options.usersDataSource = new YAHOO.util.DataSource(this.options.usersDataStore);
			this.options.usersDataSource.responseType = YAHOO.util.DataSource.TYPE_JSARRAY;
			this.options.usersDataSource.responseSchema = {
				fields: ["name", "userName", "nodeRef", "roleDisplayName"]
			};
			
			this.options.usersDataSource.doBeforeParseData = function f(oRequest, oFullResponse)
			{
				// Remove duplicates that happen when we list users by name
				//		and have one user in multiple roles
				var response = [];
				var dup;
				for( var i in oFullResponse )
				{
					dup = false;
					for( var j in response )
						if( (response[j].userName == oFullResponse[i].userName)
									&& (response[j].role == oFullResponse[i].role) )
								dup = true;
					if(!dup)
						response.push(oFullResponse[i]);
				}		
				return response;
			};
			
			this.options.usersDataTable = new YAHOO.widget.GroupedDataTable(this.options.pickerId + "-group-members",
				myColumnDefs, this.options.usersDataSource,
			{
				groupBy: "roleDisplayName",
				MSG_EMPTY: this.msg("alvex.orgchart.no_people_in_group"),
				renderLoopSize: 100
			} );
			this.options.usersDataTable.orgchart = this;

			if(this.options.selectedGroup != null)
				this.fillRolesTable(this.options.selectedGroup.id);
		},

		formatActionsField: function (elLiner, oRecord, oColumn, oData)
		{
			var id = this.orgchart.id;
			var html = '<div id="' + id + '-actions-' + oRecord.getId() + '" class="action">';

			html += '<div class="' + 'showUserInfo' + '"><a rel="view" href="" ' 
					+ 'class="orgchart-action-link ' + id + '-action-link"'
					+ 'title="' + this.orgchart.msg("alvex.orgchart.button.view") +'">' 
					+ '<span>' + this.orgchart.msg("alvex.orgchart.button.view") + '</span></a></div>';

			if(	this.orgchart.canAddAssignee() )
			{
				html += '<div class="' + 'addPerson' + '"><a rel="add" href="" ' 
						+ 'class="orgchart-action-link ' + id + '-action-link"'
						+ 'title="' + this.orgchart.msg("alvex.orgchart.button.add") +'">' 
						+ '<span>' + this.orgchart.msg("alvex.orgchart.button.add") + '</span></a></div>';
			}
			
			html += '</div>';

			elLiner.innerHTML = html;
		},

		formatIconField: function (elLiner, oRecord, oColumn, oData)
		{
			var id = this.orgchart.id;
			var html = '';
			
			if( this.orgchart.canAddAssignee() )
			{
				html += '<div class="' + 'addPersonTitle' + '"><a rel="add" href="" ' 
						+ 'class="orgchart-action-link ' + id + '-action-link"'
						+ 'title="' + this.orgchart.msg("alvex.orgchart.button.add") +'"><img' 
						+ ' src="/share/res/components/images/filetypes/generic-user-32.png"' 
						+ ' width="32"/></a></div>';
			} else {
				html = '<div class="icon32"><img' 
						+ ' src="/share/res/components/images/filetypes/generic-user-32.png"' 
						+ ' width="32"/></div>';
			}

			elLiner.innerHTML = html;
		},

		formatNameField: function (elLiner, oRecord, oColumn, oData)
		{
			var id = this.orgchart.id;
			var user = oRecord.getData();
			var html = '';
			
			if( this.orgchart.canAddAssignee() )
			{
				html = '<div class="' + 'addPersonTitle' + '">' 
						+ '<h4 class="name"><a rel="add" href="" ' 
						+ 'class="orgchart-action-link ' + id + '-action-link"'
						+ 'title="' + this.orgchart.msg("alvex.orgchart.button.add") +'">' 
						+ '<span>' + user.name + '</span></a></h4></div>';
			} else {
				html = '<h4 class="name">' + user.name + '</h4>';
			}

			elLiner.innerHTML = html;
		},

		canAddAssignee: function()
		{
			return ( ! ( this.options.mode == 'viewer' 
						|| this.options.disabled
						|| ( (this.options.multipleSelectMode == false) 
							&& (this.options.assignees.length 
							+ this.options.assignees_added.length 
							- this.options.assignees_removed.length > 0) )	) );
		},

		fillPeopleTable: function OrgchartViewerDialog_fillPeopleTable(node_id)
		{
			this.fillTable(node_id, false);
		},

		fillRolesTable: function OrgchartViewerDialog_fillRolesTable(node_id)
		{
			this.fillTable(node_id, true);
		},
		
		fillTable: function(node_id, showRoles)
		{
			// if there is no node - just reload the table 
			if( node_id == null || node_id =='' )
				return;

			// clear data for display
			this.options.usersDataStore.length = 0;

			var url = YAHOO.lang.substitute(
				"{proxy}/api/alvex/orgchart/units/{unit}",
				{
					proxy: Alfresco.constants.PROXY_URI,
					unit: node_id
				}
			);

			Alfresco.util.Ajax.jsonRequest({
				url: url,
				method: Alfresco.util.Ajax.GET,
				dataObj: null,
				successCallback:
				{
					fn: function (resp)
					{
						var people;
						// If we show roles - just do it
						if(showRoles) {
							people = resp.json.data.people;
						// If we do not need roles - remove them and de-duplicate users
						} else {
							people = [];
							var tmp = {};
							for( var p in resp.json.data.people )
								tmp[resp.json.data.people[p].userName] = resp.json.data.people[p];
							for( var t in tmp ) {
								tmp[t].roleDisplayName = 'members';
								people.push(tmp[t]);
							}
						}
						for( var p in people )
							if( people[p].roleDisplayName == 'members')
								people[p].roleDisplayName = this.options.defaultRoleName;

						this.sortPeople(people);
						
						for( var p in people )
						{
							this.options.usersDataStore.push( people[p] 
							/*{
								name: people[p].name,
								userName: people[p].userName,
								nodeRef: people[p].nodeRef,
								role: people[p].role
							}*/);
						}

						this.options.usersDataTable.getDataSource().sendRequest('', 
							{ success: this.options.usersDataTable.onDataReturnInitializeTable, scope: this.options.usersDataTable }
						);
					},
					scope:this
				}
			});
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

		showUserInfo: function OrgchartViewerDialog_showUserInfo(person)
		{
			var url = Alfresco.constants.PROXY_URI + "api/people/" + person.userName;

			Alfresco.util.Ajax.jsonRequest({
				url: url,
				method: Alfresco.util.Ajax.GET,
				dataObj: null,
				successCallback:
				{
					fn: function (resp)
					{
						var profile = resp.json;
						// fill html fields
						Dom.get(this.options.pickerId + '-person-img').src 
									= Alfresco.constants.PROXY_URI + 'slingshot/profile/avatar/' + profile.userName;
						Dom.get(this.options.pickerId + '-person-name').innerHTML = $html(profile.firstName + " " + profile.lastName);
						Dom.get(this.options.pickerId + '-person-title').innerHTML = $html(profile.jobtitle);
						Dom.get(this.options.pickerId + '-person-company').innerHTML = $html(profile.organization);
						Dom.get(this.options.pickerId + '-person-phone').innerHTML = $html(profile.companytelephone);
						Dom.get(this.options.pickerId + '-person-cell').innerHTML = $html(profile.mobile);
						Dom.get(this.options.pickerId + '-person-email').innerHTML = $html(profile.companyemail);
						Dom.get(this.options.pickerId + '-person-skype').innerHTML = $html(profile.skype);
						Dom.get(this.options.pickerId + '-person-im').innerHTML = $html(profile.instantmsg);
						Dom.get(this.options.pickerId + '-person-loc').innerHTML = $html(profile.location);
						Dom.get(this.options.pickerId + '-person-bio').innerHTML = $html(profile.persondescription);
						Dom.get(this.options.pickerId + '-person-links').innerHTML 
									= '<a target="_blank" href="/share/page/user/' + profile.userName + '/profile">' 
										+ this.msg("alvex.orgchart.view_profile") + '</a>';
						// show field
						Dom.removeClass( Dom.get(this.options.pickerId + '-person-info'), "person-hidden" );
					},
					scope:this
				}
			});
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
				var roleA=a.roleDisplayName.toLowerCase();
				var roleB=b.roleDisplayName.toLowerCase();
				var nameA=a.name.toLowerCase();
				var nameB=b.name.toLowerCase();
				if (roleA < roleB)
					return -1;
				if (roleA > roleB)
					return 1;
				if (nameA < nameB)
					return -1;
				if (nameA > nameB)
					return 1;
				return 0;
			} );
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
			// Just element
			var el;
			// Final assignees list with all adds and removes
			var merged = this.getCurrentAssigneesList();

			// Update selected users in UI in main form
			el = Dom.get(this.options.controlId + "-currentValueDisplay");
			el.innerHTML = '';
			for (m in merged) {
				el.innerHTML += '<div><img src="/share/res/components/images/filetypes/generic-user-16.png" ' 
						+ 'width="16" alt="" title="' + merged[m].name + '"> ' + merged[m].name + ' </div>';
			}

			// Update current users nodeRefs - required for mandatory field check
			el = Dom.get(this.id);
			el.value = '';
			for (m in merged) {
				el.value += ( m < merged.length-1 ? merged[m].nodeRef + ',' : merged[m].nodeRef );
			}

			// Update added fields in main form to be submitted
			el = Dom.get(this.options.controlId + "-added");
			el.value = '';
			for (m in this.options.assignees_added) {
				el.value += ( m < this.options.assignees_added.length-1 
					? this.options.assignees_added[m].nodeRef + ',' : this.options.assignees_added[m].nodeRef );
			}

			// Update removed fields in main form to be submitted
			el = Dom.get(this.options.controlId + "-removed");
			el.value = '';
			for (m in this.options.assignees_removed) {
				el.value += (m < this.options.assignees_removed.length-1 
					? this.options.assignees_removed[m].nodeRef+',' : this.options.assignees_removed[m].nodeRef);
			}
		},
		
		updateUI: function()
		{
			// Final assignees list with all adds and removes
			var merged = this.getCurrentAssigneesList();

			// Update selected users in UI in popup dialog
			var fieldId = this.options.pickerId + "-selected-users";
			Dom.get(fieldId).innerHTML = '';
			for (m in merged) {
				Dom.get(fieldId).innerHTML 
						+= '<div><img src="/share/res/components/images/filetypes/generic-user-16.png" '
							+ 'width="16" alt="" title="' + merged[m].name + '"> ' + merged[m].name + ' ' 
							+ this.getRemoveButtonHTML(merged[m]) + '</div>';
				YAHOO.util.Event.onAvailable(merged[m].nodeRef, this.attachRemoveClickListener, merged[m], this);
			}
			
			// Update datatable. We need it to enable/disable 'add' button in single select mode.
			this.options.usersDataTable.getDataSource().sendRequest('', 
				{ success: this.options.usersDataTable.onDataReturnInitializeTable, scope: this.options.usersDataTable }
			);
		},

		// Build final list by merging all adds and removes
		getCurrentAssigneesList: function()
		{
			var merged = this.options.assignees.concat(this.options.assignees_added);
			for (r in this.options.assignees_removed)
				for (m in merged)
					if( this.usersEqual(merged[m], this.options.assignees_removed[r]) )
						merged.splice(m,1);
			return merged;
		},

		addPersonTitle: function(person)
		{
			this.addPerson(person);
		},

		// Add person to assignees
		addPerson: function OrgchartPickerDialog_addPerson(person)
		{
			// If person is not in current list and not in added list - add it to added list
			if( (this.userInArray(this.options.assignees, person) == -1) 
				&& (this.userInArray(this.options.assignees_added, person) == -1) )
					this.options.assignees_added.push(person);

			// If person is in removed list - remove it from removed
			if( (this.userInArray(this.options.assignees_removed, person) != -1) )
				this.options.assignees_removed.splice( this.userInArray(this.options.assignees_removed, person), 1 );

			// Update UI
			this.updateUI();
		},

		// Remove person from assignees
		removePerson: function OrgchartPickerDialog_removePerson(event, person)
		{
			// If person is in current list and not in removed list - add it to removed list
			if( (this.userInArray(this.options.assignees, person) != -1) 
				&& (this.userInArray(this.options.assignees_removed, person) == -1) )
					this.options.assignees_removed.push(person);

			// If person is in added list - remove it from added list
			if(this.userInArray(this.options.assignees_added, person) != -1)
				this.options.assignees_added.splice( this.userInArray(this.options.assignees_added, person), 1);

			// Update UI
			this.updateUI();
		}
	});
})();
