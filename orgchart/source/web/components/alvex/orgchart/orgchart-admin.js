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
		Element = YAHOO.util.Element,
		KeyListener = YAHOO.util.KeyListener;
	var $html = Alfresco.util.encodeHTML;

	Alvex.OrgchartEditor = function(htmlId)
	{
		this.name = "Alvex.OrgchartEditor";
		Alvex.OrgchartEditor.superclass.constructor.call(this, htmlId);

		Alfresco.util.ComponentManager.register(this);

		Alfresco.util.YUILoaderHelper.require(["button", "container", "datasource", 
			"datatable", "json", "history"], this.onComponentsLoaded, this);

		var parent = this;

		PanelHandler = function PanelHandler_constructor()
		{
			PanelHandler.superclass.constructor.call(this, "main");
		};
		YAHOO.extend(PanelHandler, Alfresco.ConsolePanelHandler,
		{
			onLoad: function onLoad()
			{
				
			}
		});
		new PanelHandler;

		return this;
	};

	YAHOO.extend(Alvex.OrgchartEditor, Alfresco.ConsoleTool,
	{
		options:
		{
			// Orgchart
			orgchart: null,
			// If we show now 'people' or 'roles'
			pickerView: 'roles',
			// Default role name for users without explicitely configured roles
			defaultRoleName: '',
			// NodeRef of the node that stores UI config
			uiConfigNodeRef: '',
			// Root group to start orgchart from
			rootGroup: '__orgstruct__',
			// Orgchart branch we are working with
			curBranch: 'default',
			// All orgchart branches
			branches: [],
			// Selected group
			selectedGroup: null,
			// Role instances created for selected group
			selectedGroupRoles: [],
			// Datatable in UI
			usersDataTable: null,
			// Datasource for datatable
			usersDataSource: null,
			// Data store for datatable as JS array
			usersDataStore: []
		},

		onReady: function WSA_onReady()
		{
			Alvex.OrgchartEditor.superclass.onReady.call(this);
			
			this.options.controlId = this.id + '-cntrl';
			this.options.pickerId = this.id + '-cntrl-picker';
			//this.options.addRoleDialogId = this.id + "-cntrl-add-role-dialog";
			this.options.userRolesDialogId = this.id + "-cntrl-user-roles-dialog";
			this.options.unitRolesDialogId = this.id + "-cntrl-unit-roles-dialog";
			
			if(this.options.defaultRoleName == '')
				this.options.defaultRoleName = this.msg("alvex.orgchart.default_group");

			//this.createAddRoleDialog();
			this.createUserRolesDialog();
			this.createUnitRolesDialog();
			this.createRolesTable();

			this.widgets.uiConfig = new YAHOO.widget.Button(this.id + "-ui-config",
								{ onclick: { fn: this.onUIConfig, obj: null, scope: this } });

			this.widgets.addRole = new YAHOO.widget.Button(this.id + "-add-role",
								{ onclick: { fn: this.onAddRole, obj: null, scope: this } });

			// TODO - How can we handle links outside of the table?
			// May be just create static event listeners?
			// Or create additional insituEditors?

			// Get orgchart branches
			Alfresco.util.Ajax.jsonRequest({
				url: Alfresco.constants.PROXY_URI + "api/alvex/orgchart/branches",
				method: Alfresco.util.Ajax.GET,
				dataObj: null,
				successCallback:
				{
					fn: function (resp)
					{
						this.options.branches = resp.json.branches;

						// Create default branch
						if(this.options.branches.length == 0) {
							this.initDefaultBranch();
						} else {
							this.loadOrgchartBranch(this.options.curBranch);
						}
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

			// Load in the People Finder component from the server
			Alfresco.util.Ajax.request(
			{
				url: Alfresco.constants.URL_SERVICECONTEXT + "components/alvex/orgchart/people-finder",
				dataObj:
				{
					htmlid: this.id + "-search-peoplefinder"
				},
				successCallback:
				{
					fn: this.onPeopleFinderLoaded,
					scope: this
				},
				failureMessage: "Could not load People Finder component",
				execScripts: true
			});
		},

		initDefaultBranch: function()
		{
			Alfresco.util.PopupManager.getUserInput(
			{
				title: Alfresco.util.message("alvex.orgchart.create_first_branch"),
				text: Alfresco.util.message("alvex.orgchart.create_first_branch_prompt"),
				input: "text",
				value: "",
				callback:
				{
					fn: function promptCallback (branchName, obj)
					{
						Alfresco.util.Ajax.jsonRequest({
							url: Alfresco.constants.PROXY_URI 
									+ "api/alvex/orgchart/branches/" 
									+ encodeURIComponent(this.options.curBranch),
							method: Alfresco.util.Ajax.PUT,
							dataObj: { data: { displayName: branchName } },
							successCallback:
							{
								fn: function (resp)
								{
									this.loadOrgchartBranch(this.options.curBranch);
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
					},
					scope: this
				}
			});
		},

		loadOrgchartBranch: function(branch)
		{
			// Get orgchart data from server - groups only, without users to reduce load time
			Alfresco.util.Ajax.jsonRequest({
				url: Alfresco.constants.PROXY_URI 
								+ "api/alvex/orgchart/tree/" + encodeURIComponent(branch),
				method: Alfresco.util.Ajax.GET,
				dataObj: null,
				successCallback:
				{
					fn: function (resp)
					{
						this.options.orgchart = resp.json.data;
						
						this.createViewDialog();
						Dom.removeClass( Dom.get(this.id + '-page-tree-view'), "hidden" );
						this.createTree();
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
		},

		onPeopleFinderLoaded: function _onPeopleFinderLoaded(response)
		{
			// Inject the component from the XHR request into it's placeholder DIV element
			var finderDiv = Dom.get(this.id + "-search-peoplefinder");
			finderDiv.innerHTML = response.serverResponse.responseText;

			// Create the Add User dialog
			this.widgets.addUserPanel = Alfresco.util.createYUIPanel(this.id + "-peoplepicker");
			this.widgets.addUserPanel.hideEvent.subscribe(this.onAddUserPanelCancel, null, this);

			// Find the People Finder by container ID
			this.modules.searchPeopleFinder = Alfresco.util.ComponentManager.get(this.id + "-search-peoplefinder");

			// Set the correct options for our use
			this.modules.searchPeopleFinder.setOptions(
			{
				singleSelectMode: false
			});

			// Make sure we listen for events when the user selects a person
			YAHOO.Bubbling.on("personSelected", this.onUserAdd, this);
		},

		onUIConfig: function()
		{
			// Intercept before dialog show
			var doBeforeDialogShow = function(p_form, p_dialog)
			{
				Alfresco.util.populateHTML(
					[ p_dialog.id + "-dialogTitle", this.msg("alvex.orgchart.configureUI") ],
					[ p_dialog.id + "-dialogHeader", this.msg("alvex.orgchart.configureUI") ]
				);
			};

			var templateUrl = YAHOO.lang.substitute(
					Alfresco.constants.URL_SERVICECONTEXT 
						+ "components/form?itemKind={itemKind}&itemId={itemId}&mode={mode}" 
						+ "&submitType={submitType}&showCancelButton=true",
				{
					itemKind: "node",
					itemId: this.options.uiConfigNodeRef,
					mode: "edit",
					submitType: "json"
				});

			// Using Forms Service, so always create new instance
			var uiConfigDialog = new Alfresco.module.SimpleDialog(this.id + "-uiConfigDialog");

			uiConfigDialog.setOptions(
			{
				width: "33em",
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
					fn: function uiConfigDialogSuccess(response)
					{
						Alfresco.util.PopupManager.displayMessage(
						{
							text: this.msg("alvex.orgchart.configureUI.success")
						});
						if(response.config.dataObj.prop_orgchart_defaultRoleName != '')
							this.options.defaultRoleName = response.config.dataObj.prop_orgchart_defaultRoleName;
						else
							this.options.defaultRoleName = this.msg("alvex.orgchart.default_group");
					},
					scope: this
				},
				onFailure:
				{
					fn: function uiConfigDialogFailure(response)
					{
						Alfresco.util.PopupManager.displayMessage(
						{
							text: this.msg("alvex.orgchart.configureUI.failure")
						});
					},
					scope: this
				}
			}).show();
		},

		createUserRolesDialog: function()
		{
			this.widgets.userRolesOk = new YAHOO.widget.Button(this.options.userRolesDialogId + "-ok",
								{ onclick: { fn: this.onUserRolesOk, obj: null, scope: this } });
			this.widgets.userRolesCancel = new YAHOO.widget.Button(this.options.userRolesDialogId + "-cancel",
								{ onclick: { fn: this.onUserRolesCancel, obj: null, scope: this } });
			
			this.widgets.userRolesDialog = Alfresco.util.createYUIPanel(this.options.userRolesDialogId, { });
			this.widgets.userRolesDialog.hideEvent.subscribe(this.onUserRolesCancel, null, this);
			
			Dom.addClass(this.options.userRolesDialogId, "object-finder");
			Dom.removeClass(this.options.userRolesDialogId, "hidden");
		},

		createUnitRolesDialog: function()
		{
			this.widgets.unitRolesOk = new YAHOO.widget.Button(this.options.unitRolesDialogId + "-ok",
								{ onclick: { fn: this.onUnitRolesOk, obj: null, scope: this } });
			this.widgets.unitRolesCancel = new YAHOO.widget.Button(this.options.unitRolesDialogId + "-cancel",
								{ onclick: { fn: this.onUnitRolesCancel, obj: null, scope: this } });
			
			this.widgets.unitRolesDialog = Alfresco.util.createYUIPanel(this.options.unitRolesDialogId, { });
			this.widgets.unitRolesDialog.hideEvent.subscribe(this.onUnitRolesCancel, null, this);
			
			Dom.addClass(this.options.unitRolesDialogId, "object-finder");
			Dom.removeClass(this.options.unitRolesDialogId, "hidden");
		},

		onAddRole: function()
		{
			// Intercept before dialog show
			var doBeforeDialogShow = function(p_form, p_dialog)
			{
				Alfresco.util.populateHTML(
					[ p_dialog.id + "-dialogTitle", this.msg("alvex.orgchart.addRole") ],
					[ p_dialog.id + "-dialogHeader", this.msg("alvex.orgchart.addRole") ]
				);
			};

			var templateUrl = YAHOO.lang.substitute(
					Alfresco.constants.URL_SERVICECONTEXT 
						+ "components/form?itemKind={itemKind}&itemId={itemId}&mode={mode}" 
						+ "&submitType={submitType}&showCancelButton=true",
				{
					itemKind: "type",
					itemId: "alvexoc:roleDefinition",
					mode: "create",
					submitType: "json"
				});

			// Using Forms Service, so always create new instance
			var addRoleDialog = new Alfresco.module.SimpleDialog(this.id + "-addRoleDialog");

			addRoleDialog.setOptions(
			{
				width: "33em",
				templateUrl: templateUrl,
				actionUrl: null,
				destroyOnHide: true,

				doBeforeDialogShow:
				{
					fn: doBeforeDialogShow,
					scope: this
				},
				// Intercept form submit and send requests to our API instead
				doBeforeAjaxRequest:
				{
					fn: function(config, obj)
					{
						var role = {};
						role.displayName = config.dataObj.prop_alvexoc_roleDisplayName;
						role.weight = config.dataObj.prop_alvexoc_roleWeight;
						var id = (new Date()).getTime();
						
						var req = {};
						req.data = role;
						
						var url = Alfresco.constants.PROXY_URI 
									+ "api/alvex/orgchart/role-definitions/" 
									+ encodeURIComponent(id);
						var method = Alfresco.util.Ajax.PUT;
						
						// Add / edit org chart role
						Alfresco.util.Ajax.jsonRequest({
							url: url,
							method: method,
							dataObj: req,
							successCallback:
							{
								fn: function (resp)
								{
									if (resp.serverResponse.statusText)
									{
										Alfresco.util.PopupManager.displayMessage({ text: resp.serverResponse.statusText });
									}
									this.widgets.rolesDataTable.getDataSource().sendRequest('', 
										{ success: this.widgets.rolesDataTable.onDataReturnInitializeTable, scope: this.widgets.rolesDataTable }
									);
								},
								scope:this
							},
							failureCallback:
							{
								fn: function (resp)
								{
									if (resp.serverResponse.statusText)
									{
										Alfresco.util.PopupManager.displayMessage({ text: resp.serverResponse.statusText });
									}
								},
								scope:this
							}
						});
						
						return false;
					},
					scope: this
				}
			}).show();
		},
		
		createRolesTable: function()
		{
			var me = this;
			
			// Hook action events
			var fnRolesActionHandler = function fnRolesActionHandler(layer, args)
			{
				var owner = YAHOO.Bubbling.getOwnerByTagName(args[1].anchor, "div");
				if (owner !== null)
				{
					if (typeof me[owner.className] == "function")
					{
						args[1].stop = true;
						var asset = me.widgets.rolesDataTable.getRecord(args[1].target.offsetParent).getData();
						me[owner.className].call(me, asset, owner);
					}
				}
				return true;
			};
			YAHOO.Bubbling.addDefaultAction(this.id + "-roles-action-link", fnRolesActionHandler);

			// DataSource setup
			this.widgets.rolesDataSource = new YAHOO.util.DataSource(Alfresco.constants.PROXY_URI 
					+ "api/alvex/orgchart/role-definitions",
				{
					responseType: YAHOO.util.DataSource.TYPE_JSON,
					responseSchema:
					{
						resultsList: "roles"
					}
				});
			
			var renderActions = function renderActions(elLiner, oRecord, oColumn, oData)
				{
					var id = this.orgchart.id;
					var html = '<div id="' + id + '-actions-' + oRecord.getId() + '" class="action hidden">';

					html += '<div class="' + 'editRoleDef' + '"><a rel="view" href="" ' 
							+ 'class="orgchart-action-link ' + id + '-roles-action-link"'
							+ 'title="' + this.orgchart.msg("alvex.orgchart.editRoleDef") +'">' 
							+ '<span>' + this.orgchart.msg("alvex.orgchart.editRoleDef") + '</span></a></div>';
					
					html += '<div class="' + 'deleteRoleDef' + '"><a rel="delete" href="" ' 
							+ 'class="orgchart-action-link ' + id + '-roles-action-link"'
							+ 'title="' + this.orgchart.msg("alvex.orgchart.deleteRoleDef") +'">' 
							+ '<span>' + this.orgchart.msg("alvex.orgchart.deleteRoleDef") + '</span></a></div>';
					
					html += '</div>';
					
					elLiner.innerHTML = html;
				};

			var columnDefinitions =
				[
					{ key: "displayName", label: this.msg("alvex.orgchart.roleName"), 
								sortable: true, width: 500 },
					{ key: "weight", label: this.msg("alvex.orgchart.roleWeight"), 
								sortable: true, width: 50 },
					{ key: "actions", label: '', 
								sortable: false, width: 75, formatter: renderActions }
				];

			// DataTable definition
			this.widgets.rolesDataTable = new YAHOO.widget.DataTable(this.id + "-roles-table", 
					columnDefinitions, this.widgets.rolesDataSource,
				{
					initialLoad: true,
					initialRequest: '',
					renderLoopSize: 32,
					sortedBy:
					{
						key: "weight",
						dir: "asc"
					},
					MSG_EMPTY: this.msg("alvex.orgchart.noRolesDefined"),
					MSG_LOADING: this.msg("alvex.orgchart.loadingRoles"),
					MSG_ERROR: this.msg("alvex.orgchart.errorLoadingRoles")
				});
			this.widgets.rolesDataTable.orgchart = this;
			
			this.widgets.rolesDataTable.subscribe("rowMouseoverEvent", this.onRoleHighlightRow, this, true);
			this.widgets.rolesDataTable.subscribe("rowMouseoutEvent", this.onRoleUnhighlightRow, this, true);
		},
		
		onRoleHighlightRow: function DataGrid_onEventHighlightRow(oArgs)
		{
			var elActions = Dom.get(this.id + "-actions-" + oArgs.target.id);
			Dom.removeClass(elActions, "hidden");
		},
		
		onRoleUnhighlightRow: function DataGrid_onEventUnhighlightRow(oArgs)
		{
			var elActions = Dom.get(this.id + "-actions-" + (oArgs.target.id));
			Dom.addClass(elActions, "hidden");
		},

		createViewDialog: function OrgchartViewerDialog_createDetailsDialog()
		{
			this.widgets.dialog = Alfresco.util.createYUIPanel(this.options.pickerId,
			{
				width: "750px"
			});
			this.widgets.dialog.hideEvent.subscribe(this.onCancel, null, this);
			
			// Register listeners for people/roles switchers
			YAHOO.util.Event.on(this.options.pickerId + "-view-people", 'click', this.togglePeopleView, null, this);
			YAHOO.util.Event.on(this.options.pickerId + "-view-roles", 'click', this.toggleRolesView, null, this);

			// Register listeners for admin actions
			YAHOO.util.Event.on(this.options.pickerId + "-add-users", 'click', this.addUsers, null, this);

			// Init datatable to show current orgchart unit
			this.initUsersTable();

			Dom.addClass(this.options.pickerId, "object-finder");
			Dom.removeClass(this.options.pickerId, "hidden");
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
				{key:'action', sortable:false, width:78, formatter: this.formatActionsField}
			];

			// We use this simple dataSource because we are not sure about our requirements
			// For instance, orgchart browsing and user search are provided by different APIs
			// We are not sure about urls and resp schema of APIs we may need
			// So we have an option to fill js array locally after ajax request to any url
			this.options.usersDataSource = new YAHOO.util.DataSource(this.options.usersDataStore);
			this.options.usersDataSource.responseType = YAHOO.util.DataSource.TYPE_JSARRAY;
			this.options.usersDataSource.responseSchema = {
				fields: ["name", "userName", "nodeRef", "roleName", "roleDisplayName"]
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
									&& (response[j].roleName == oFullResponse[i].roleName) )
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

			this.options.usersDataTable.subscribe("rowMouseoverEvent", this.onUserHighlightRow, this, true);
			this.options.usersDataTable.subscribe("rowMouseoutEvent", this.onUserUnhighlightRow, this, true);

			if(this.options.selectedGroup != null)
				this.fillRolesTable(this.options.selectedGroup.id);
		},
		
		onUserHighlightRow: function DataGrid_onEventHighlightRow(oArgs)
		{
			var elActions = Dom.get(this.id + "-actions-" + oArgs.target.id);
			Dom.removeClass(elActions, "hidden");
		},
		
		onUserUnhighlightRow: function DataGrid_onEventUnhighlightRow(oArgs)
		{
			var elActions = Dom.get(this.id + "-actions-" + (oArgs.target.id));
			Dom.addClass(elActions, "hidden");
		},

		createTree: function()
		{
			this.widgets.pageTreeView = new YAHOO.widget.TreeView(this.id + "-page-tree-view");
			
			YAHOO.widget.TreeView.FOCUS_CLASS_NAME = "";
			this.options.insituEditors = [];
			
			if(this.options.orgchart)
				for(var c in this.options.orgchart) {
					var node = this.insertTreeLabel(this.widgets.pageTreeView.getRoot(), this.options.orgchart[c]);
					node.expand();
				}

			this.widgets.pageTreeView.subscribe("expandComplete", this.onExpandComplete, this, true);

			this.widgets.pageTreeView.draw();
			this.onExpandComplete(null);
		},

		onExpandComplete: function DLT_onExpandComplete(oNode)
		{
			for (var i in this.options.insituEditors)
				Alfresco.util.createInsituEditor(
						this.options.insituEditors[i].context, 
						this.options.insituEditors[i].params, 
						this.options.insituEditors[i].callback
					);			
		},

		insertTreeLabel: function OrgchartViewerDialog_insertTreeLabel(curRoot, newNode)
		{
			var me = this;
			var curElem = new YAHOO.widget.TextNode(newNode.displayName, curRoot, false);
			curElem.labelElId = newNode.id;
			this.options.insituEditors.push( 
				{
					context: newNode.id, 
					params: {
							showDelay: 300,
							hideDelay: 300,
							type: "orgchartUnit",
							unitID: newNode.id,
							unitName: newNode.displayName,
							curElem: curElem,
							orgchartAdmin: me
						}, 
					callback: null 
				} );
			for(var c in newNode.children)
				this.insertTreeLabel(curElem, newNode.children[c]);
			return curElem;
		},

		pageTreeViewClicked: function(node)
		{
			var curNode = node;
			curNode.id = node.labelElId;
			curNode.name = node.label;
			this.showViewDialog(curNode);
		},

		showViewDialog: function OrgchartViewerDialog_createDetailsDialog(node)
		{
			var me = this;
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

			// Get roles for current group
			Alfresco.util.Ajax.request(
			{
				url: Alfresco.constants.PROXY_URI + "api/alvex/orgchart/units/" 
							+ encodeURIComponent(this.options.selectedGroup.id) + "/roles",
				successCallback:
				{
					fn: function(resp)
					{
						this.options.selectedGroupRoles = [];
						for( var i in resp.json.roles)
							this.options.selectedGroupRoles.push(resp.json.roles[i]);
						
						//var roles = [];
						//for( var i in this.options.selectedGroupRoles)
						//	roles.push(this.options.selectedGroupRoles[i].roleName);
						me.modules.searchPeopleFinder.setOptions(
						{
							roles: this.options.selectedGroupRoles
						});

						me.fillDetailsDialog();

						// Show the dialog
						me.widgets.dialog.show();
					},
					scope: this
				},
				failureMessage: "Can not get roles for group"
			});
		},

		onCancel: function(e, p_obj)
		{
			this.widgets.escapeListener.disable();
			this.widgets.dialog.hide();
			if (e) {
				Event.preventDefault(e);
			}
		},
		
		onUserRolesCancel: function(e, p_obj)
		{
			this.widgets.userRolesEscapeListener.disable();
			this.widgets.userRolesDialog.hide();
			if (e) {
				Event.preventDefault(e);
			}
		},

		onUnitRolesCancel: function(e, p_obj)
		{
			this.widgets.unitRolesEscapeListener.disable();
			this.widgets.unitRolesDialog.hide();
			if (e) {
				Event.preventDefault(e);
			}
		},

		onUserRolesOk: function(e, p_obj)
		{
			this.widgets.userRolesEscapeListener.disable();
			this.widgets.userRolesDialog.hide();
			
			var roles = {};
			var user = Dom.get(this.options.userRolesDialogId + '-user').value;
			for(var i in this.options.selectedGroupRoles)
			{
				roles[this.options.selectedGroupRoles[i].name] = 
					{
						newVal: Dom.get(this.options.userRolesDialogId 
									+ '-' + this.options.selectedGroupRoles[i].name).checked,
						oldVal: (Dom.get(this.options.userRolesDialogId 
									+ '-' + this.options.selectedGroupRoles[i].name + '-old').value == "true")
					}
			}
			
			var queue = [];
			var req = {};
			req.data = { logins: user };
			for(var r in roles)
				if( (roles[r].newVal == true) && (roles[r].oldVal == false) )
				{
					queue.push({
						url: Alfresco.constants.PROXY_URI + "api/alvex/orgchart/units/" 
							+ encodeURIComponent(this.options.selectedGroup.id) 
							+ "/roles/" + encodeURIComponent(r) + "/members",
						method: Alfresco.util.Ajax.PUT,
						dataObj: req,
						requestContentType: Alfresco.util.Ajax.JSON
					});
				}
				else if( (roles[r].newVal == false) && (roles[r].oldVal == true) )
				{
					queue.push({
						url: Alfresco.constants.PROXY_URI + "api/alvex/orgchart/units/" 
							+ encodeURIComponent(this.options.selectedGroup.id) 
							+ "/roles/" + encodeURIComponent(r) + "/members?alf_method=DELETE",
						method: Alfresco.util.Ajax.POST,
						dataObj: req,
						requestContentType: Alfresco.util.Ajax.JSON
					});
				}

			queue[queue.length-1].successCallback = 
				{
					fn: function (resp)
					{
						// Do smth
						this.fillDetailsDialog();
					},
					scope:this
				};

			Alvex.util.processAjaxQueue({
				queue: queue
			});

			if (e) {
				Event.preventDefault(e);
			}
		},

		onUnitRolesOk: function(e, p_obj)
		{
			this.widgets.unitRolesEscapeListener.disable();
			this.widgets.unitRolesDialog.hide();

			var roles = {};
			var unit = Dom.get(this.options.unitRolesDialogId + '-unit').value;
			
			var roleRecords = this.widgets.rolesDataTable.getRecordSet().getRecords();
			for(var i in roleRecords) {
				var data = roleRecords[i].getData();
				roles[data.name] =
				{
					newVal: Dom.get(this.options.unitRolesDialogId 
								+ '-' + data.name).checked,
					oldVal: (Dom.get(this.options.unitRolesDialogId 
								+ '-' + data.name + '-old').value == "true")
				};
			}	
			
			var queue = [];
			for(var r in roles)
				if( (roles[r].newVal == true) && (roles[r].oldVal == false) )
				{
					queue.push({
						url: Alfresco.constants.PROXY_URI + "api/alvex/orgchart/units/" 
							+ encodeURIComponent(unit) + "/roles/" + encodeURIComponent(r),
						method: Alfresco.util.Ajax.PUT,
						dataObj: null,
						requestContentType: Alfresco.util.Ajax.JSON
					});
				}
				else if( (roles[r].newVal == false) && (roles[r].oldVal == true) )
				{
					queue.push({
						url: Alfresco.constants.PROXY_URI + "api/alvex/orgchart/units/" 
							+ encodeURIComponent(unit) + "/roles/" + encodeURIComponent(r) + "?alf_method=DELETE",
						method: Alfresco.util.Ajax.POST,
						dataObj: null,
						requestContentType: Alfresco.util.Ajax.JSON
					});
				}

			queue[queue.length-1].successCallback = 
				{
					fn: function (resp)
					{
						// Do smth
						Alfresco.util.PopupManager.displayMessage({ text: 'Ok' });
					},
					scope:this
				};

			Alvex.util.processAjaxQueue({
				queue: queue
			});

			if (e) {
				Event.preventDefault(e);
			}
		},

		onAddUserPanelCancel: function(e, p_obj)
		{
			this.widgets.addUserPanel.hide();
			if (e) {
				Event.preventDefault(e);
			}
		},

		fillDetailsDialog: function OrgchartViewerDialog_fillDetailsDialog()
		{
			Dom.get(this.options.pickerId + "-head").innerHTML = this.options.selectedGroup.displayName;
			if( this.options.pickerView == 'roles' )
				this.fillRolesTable(this.options.selectedGroup.id);
			else
				this.fillPeopleTable(this.options.selectedGroup.id);
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
				"{proxy}/api/alvex/orgchart/units/{group}",
				{
					proxy: Alfresco.constants.PROXY_URI,
					group: node_id//,
					//roles: showRoles.toString()
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
								roleName: people[p].roleName,
								roleDisplayName: people[p].roleDisplayName
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

		formatActionsField: function (elLiner, oRecord, oColumn, oData)
		{
			var id = this.orgchart.id;
			var html = '<div id="' + id + '-actions-' + oRecord.getId() + '" class="action hidden">';

			html += '<div class="' + 'showUserInfo' + '"><a rel="view" href="" ' 
					+ 'class="orgchart-action-link ' + id + '-action-link"'
					+ 'title="' + this.orgchart.msg("alvex.orgchart.button.view") +'">' 
					+ '<span>' + this.orgchart.msg("alvex.orgchart.button.view") + '</span></a></div>';

			html += '<div class="' + 'editUserRoles' + '"><a rel="edit-roles" href="" ' 
					+ 'class="orgchart-action-link ' + id + '-action-link"'
					+ 'title="' + this.orgchart.msg("alvex.orgchart.button.edit-roles") +'">' 
					+ '<span>' + this.orgchart.msg("alvex.orgchart.button.edit-roles") + '</span></a></div>';

			html += '<div class="' + 'deleteUser' + '"><a rel="delete" href="" ' 
					+ 'class="orgchart-action-link ' + id + '-action-link"'
					+ 'title="' + this.orgchart.msg("alvex.orgchart.button.delete") +'">' 
					+ '<span>' + this.orgchart.msg("alvex.orgchart.button.delete") + '</span></a></div>';

			html += '</div>';

			elLiner.innerHTML = html;
		},

		formatIconField: function (elLiner, oRecord, oColumn, oData)
		{
			var id = this.orgchart.id;
			var html = '';
			
			html += '<div class="' + 'showUserInfoTitle' + '"><a rel="view" href="" ' 
					+ 'class="orgchart-action-link ' + id + '-action-link"'
					+ 'title="' + this.orgchart.msg("alvex.orgchart.button.view") +'"><span>' 
					+ '<div class="icon32"><img' 
					+ ' src="/share/res/components/images/filetypes/generic-user-32.png"' 
					+ ' width="32"/></div>' 
					+ '</span></a></div>';

			elLiner.innerHTML = html;
		},

		formatNameField: function (elLiner, oRecord, oColumn, oData)
		{
			var id = this.orgchart.id;
			var user = oRecord.getData();
			var html = '';

			html = '<div class="' + 'showUserInfoTitle' + '">' 
					+ '<h4 class="name"><a rel="view" href="" ' 
					+ 'class="orgchart-action-link ' + id + '-action-link"'
					+ 'title="' + this.orgchart.msg("alvex.orgchart.button.view") +'">' 
					+ '<span>' + user.name + '</span></a></h4></div>';

			elLiner.innerHTML = html;
		},

		sortPeople: function OrgchartViewerDialog_toggleRolesView(people)
		{
			people.sort( function(a,b){
				var roleA=a.roleDisplayName.toLowerCase();
				var roleB=b.roleDisplayName.toLowerCase();
				var nameA=a.lastName.toLowerCase() + ' ' + a.firstName.toLowerCase();
				var nameB=b.lastName.toLowerCase() + ' ' + b.firstName.toLowerCase();
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

		addUsers: function()
		{
			this.modules.searchPeopleFinder.clearResults();
			this.widgets.addUserPanel.show();
		},

		showUserInfoTitle: function(person)
		{
			this.showUserInfo(person);
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
						Dom.get(this.options.pickerId + '-person-name').innerHTML = profile.firstName + " " + profile.lastName;
						Dom.get(this.options.pickerId + '-person-title').innerHTML = profile.jobtitle;
						Dom.get(this.options.pickerId + '-person-company').innerHTML = profile.organization;
						Dom.get(this.options.pickerId + '-person-phone').innerHTML = profile.companytelephone;
						Dom.get(this.options.pickerId + '-person-cell').innerHTML = profile.mobile;
						Dom.get(this.options.pickerId + '-person-email').innerHTML = profile.companyemail;
						Dom.get(this.options.pickerId + '-person-skype').innerHTML = profile.skype;
						Dom.get(this.options.pickerId + '-person-im').innerHTML = profile.instantmsg;
						Dom.get(this.options.pickerId + '-person-loc').innerHTML = profile.location;
						Dom.get(this.options.pickerId + '-person-bio').innerHTML = profile.persondescription;
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

		editUserRoles: function(user)
		{
			// Fill roles for current user
			var curUserRoles = {};
			for(var i in this.options.selectedGroupRoles)
				curUserRoles[this.options.selectedGroupRoles[i].name] =
				{
					role: this.options.selectedGroupRoles[i].displayName,
					roleId: this.options.selectedGroupRoles[i].name,
					assigned: false
				};
			for(var j in this.options.usersDataStore)
				if( (this.options.usersDataStore[j].userName == user.userName)
						&& (curUserRoles[this.options.usersDataStore[j].roleName] != undefined) )
					curUserRoles[this.options.usersDataStore[j].roleName].assigned = true;
			
			if( ! this.widgets.userRolesDialog )
				return;
			
			// Set dialog fields
			var html = '<input type="hidden" id="' + this.options.userRolesDialogId + '-' + 'user' + '"'
							+ 'value="' + user.userName + '"/>';
			for(var k in curUserRoles)
			{
				html += '<div class="roles-list">' 
						+ '<input type="hidden" name="-" id="' 
								+ this.options.userRolesDialogId + '-' + curUserRoles[k].roleId + '-old" '
								+ 'value="' + curUserRoles[k].assigned + '"/>'
						+ '<input type="checkbox" name="-" id="' 
								+ this.options.userRolesDialogId + '-' + curUserRoles[k].roleId + '" ';
				if( curUserRoles[k].assigned )
						html += 'checked';
				html += '/>' 
						+ '<label for="' + this.options.userRolesDialogId + '-' + curUserRoles[k].roleId 
								+ '" class="checkbox">' + curUserRoles[k].role + '</label>' 
						+ '</div>';
			}
			Dom.get(this.options.userRolesDialogId + '-body').innerHTML = html;
			
			// Enable esc listener
			if (!this.widgets.userRolesEscapeListener)
			{
				this.widgets.userRolesEscapeListener = new KeyListener(this.options.userRolesDialogId,
				{
					keys: KeyListener.KEY.ESCAPE
				},
				{
					fn: function(eventName, keyEvent)
					{
						this.onUserRolesCancel();
						Event.stopEvent(keyEvent[1]);
					},
					scope: this,
					correctScope: true
				});
			}
			this.widgets.userRolesEscapeListener.enable();
			
			// Show the dialog
			this.widgets.userRolesDialog.show();

		},

		editUnitRoles: function(unit)
		{
			// Enable esc listener
			if (!this.widgets.unitRolesEscapeListener)
			{
				this.widgets.unitRolesEscapeListener = new KeyListener(this.options.unitRolesDialogId,
				{
					keys: KeyListener.KEY.ESCAPE
				},
				{
					fn: function(eventName, keyEvent)
					{
						this.onUnitRolesCancel();
						Event.stopEvent(keyEvent[1]);
					},
					scope: this,
					correctScope: true
				});
			}
			this.widgets.unitRolesEscapeListener.enable();
			
			// Get roles for current group
			Alfresco.util.Ajax.request(
			{
				url: Alfresco.constants.PROXY_URI + "api/alvex/orgchart/units/" 
							+ encodeURIComponent(unit.id) + "/roles",
				successCallback:
				{
					fn: function(resp)
					{
						// Fill roles for current unit
						var curUnitRoles = {};
						var roleRecords = this.widgets.rolesDataTable.getRecordSet().getRecords();
						for(var i in roleRecords) {
							var data = roleRecords[i].getData();
							curUnitRoles[data.name] =
							{
								role: data.displayName,
								roleId: data.name,
								assigned: false
							};
						}

						this.options.selectedGroupRoles = [];
						for( var i in resp.json.roles) {
							this.options.selectedGroupRoles.push(resp.json.roles[i]);
							if( curUnitRoles[resp.json.roles[i].name] != undefined )
								curUnitRoles[resp.json.roles[i].name].assigned = true;
						}

						if( ! this.widgets.unitRolesDialog )
							return;
						
						// Set dialog fields
						var html = '<input type="hidden" id="' + this.options.unitRolesDialogId + '-' + 'unit' + '"'
									+ 'value="' + unit.id + '"/>';
								
						for(var k in curUnitRoles)
						{
							html += '<div class="roles-list">' 
									+ '<input type="hidden" name="-" id="' 
											+ this.options.unitRolesDialogId + '-' + curUnitRoles[k].roleId + '-old" '
											+ 'value="' + curUnitRoles[k].assigned + '"/>'
									+ '<input type="checkbox" name="-" id="' 
											+ this.options.unitRolesDialogId + '-' + curUnitRoles[k].roleId + '" ';
							if( curUnitRoles[k].assigned )
									html += 'checked';
							html += '/>' 
									+ '<label for="' + this.options.unitRolesDialogId + '-' + curUnitRoles[k].roleId 
											+ '" class="checkbox">' + curUnitRoles[k].role + '</label>' 
									+ '</div>';
						}
						Dom.get(this.options.unitRolesDialogId + '-body').innerHTML = html;
						Dom.get(this.options.unitRolesDialogId + '-head').innerHTML = unit.displayName;
						
						// Show the dialog
						this.widgets.unitRolesDialog.show();
					},
					scope: this
				},
				failureMessage: "Can not get roles for group"
			});
		},

		deleteUser: function(user)
		{
			var login = user.userName;
			var group = this.options.selectedGroup.id;
			var req = {};
			req.data = { 'logins': login};
			
			var queue = [];
			for(var i in this.options.usersDataStore)
				if( (this.options.usersDataStore[i].userName == login)
							&& (this.options.usersDataStore[i].roleName != '') )
					queue.push({
						url: Alfresco.constants.PROXY_URI + "api/alvex/orgchart/units/" 
							+ encodeURIComponent(group) + "/roles/" 
							+ encodeURIComponent(this.options.usersDataStore[i].roleName) + "/members?alf_method=DELETE",
						method: Alfresco.util.Ajax.POST,
						dataObj: req,
						requestContentType: Alfresco.util.Ajax.JSON
					});
			queue.push({
				url: Alfresco.constants.PROXY_URI + "api/alvex/orgchart/units/" 
					+ encodeURIComponent(group) + "/members?alf_method=DELETE",
				method: Alfresco.util.Ajax.POST,
				dataObj: req,
				requestContentType: Alfresco.util.Ajax.JSON,
				successCallback:
				{
					fn: function (resp)
					{
						// Do smth
						this.fillDetailsDialog();
					},
					scope:this
				},
				failureCallback:
				{
					fn: function (resp)
					{
						// Do smth
					},
					scope:this
				}
			});

			Alvex.util.processAjaxQueue({
				queue: queue
			});
		},

		editRoleDef: function(roleDef)
		{
			// Intercept before dialog show
			var doBeforeDialogShow = function(p_form, p_dialog)
			{
				Alfresco.util.populateHTML(
					[ p_dialog.id + "-dialogTitle", this.msg("alvex.orgchart.edit_role") ],
					[ p_dialog.id + "-dialogHeader", this.msg("alvex.orgchart.edit_role") ]
				);
			};

			var templateUrl = YAHOO.lang.substitute(
					Alfresco.constants.URL_SERVICECONTEXT 
						+ "components/form?itemKind={itemKind}&itemId={itemId}&mode={mode}" 
						+ "&submitType={submitType}&showCancelButton=true",
				{
					itemKind: "node",
					itemId: 'workspace://SpacesStore/' + roleDef.id,
					mode: "edit",
					submitType: "json"
				});

			// Using Forms Service, so always create new instance
			var editRoleDialog = new Alfresco.module.SimpleDialog(this.id + "-editRoleDialog");

			editRoleDialog.setOptions(
			{
				width: "33em",
				templateUrl: templateUrl,
				actionUrl: null,
				destroyOnHide: true,

				doBeforeDialogShow:
				{
					fn: doBeforeDialogShow,
					scope: this
				},
				// Intercept form submit and send requests to our API instead
				doBeforeAjaxRequest:
				{
					fn: function(config, obj)
					{
						var role = {};
						role.displayName = config.dataObj.prop_alvexoc_roleDisplayName;
						role.weight = config.dataObj.prop_alvexoc_roleWeight;
						var id = roleDef.id;
						
						var req = {};
						req.data = role;
						
						var url = Alfresco.constants.PROXY_URI 
									+ "api/alvex/orgchart/role-definitions/" 
									+ encodeURIComponent(id);
						var method = Alfresco.util.Ajax.POST;
						
						// Add / edit org chart role
						Alfresco.util.Ajax.jsonRequest({
							url: url,
							method: method,
							dataObj: req,
							successCallback:
							{
								fn: function (resp)
								{
									if (resp.serverResponse.statusText)
									{
										Alfresco.util.PopupManager.displayMessage({ text: resp.serverResponse.statusText });
									}
									this.widgets.rolesDataTable.getDataSource().sendRequest('', 
										{ success: this.widgets.rolesDataTable.onDataReturnInitializeTable, scope: this.widgets.rolesDataTable }
									);
								},
								scope:this
							},
							failureCallback:
							{
								fn: function (resp)
								{
									if (resp.serverResponse.statusText)
									{
										Alfresco.util.PopupManager.displayMessage({ text: resp.serverResponse.statusText });
									}
								},
								scope:this
							}
						});

						return false;
					},
					scope: this
				}
			}).show();
			
		},
		
		deleteRoleDef: function(roleDef)
		{
			var me = this;
			Alfresco.util.PopupManager.displayPrompt(
			{
				title: me.msg("alvex.orgchart.deleteRoleDef"),
				text: me.msg("alvex.orgchart.deleteRoleDefText",  Alfresco.util.encodeHTML(roleDef.name)),
				buttons: [
				{
					text: me.msg("button.delete"),
					handler: function()
					{
						var req = {};
						req.data = [];
						req.data.push(roleDef.name);
			
						// Delete org chart role
						Alfresco.util.Ajax.jsonRequest({
							url: Alfresco.constants.PROXY_URI 
										+ "api/alvex/orgchart/role-definitions/" 
										+ encodeURIComponent(roleDef.name) + "?alf_method=DELETE",
							method: Alfresco.util.Ajax.POST,
							dataObj: req,
							successCallback:
							{
								fn: function (resp)
								{
									this.destroy();
									if (resp.serverResponse.statusText)
									{
										Alfresco.util.PopupManager.displayMessage({ text: resp.serverResponse.statusText });
									}
									me.widgets.rolesDataTable.getDataSource().sendRequest('', 
										{ success: me.widgets.rolesDataTable.onDataReturnInitializeTable, scope: me.widgets.rolesDataTable }
									);
								},
								scope:this
							},
							failureCallback:
							{
								fn: function (resp)
								{
									this.destroy();
									if (resp.serverResponse.statusText)
									{
										Alfresco.util.PopupManager.displayMessage({ text: resp.serverResponse.statusText });
									}
									me.widgets.rolesDataTable.getDataSource().sendRequest('', 
										{ success: me.widgets.rolesDataTable.onDataReturnInitializeTable, scope: me.widgets.rolesDataTable }
									);
								},
								scope:this
							}
						});
					}
				},
				{
					text: me.msg("button.cancel"),
					handler: function()
					{
						this.destroy();
					},
					isDefault: true
				}]
			});
		},

		onUserAdd: function (e, args)
		{
			var login = args[1].userName;
			var group = this.options.selectedGroup.id;
			var role = args[1].role;
			
			var req = {};
			req.data = { 'logins': login };

			var queue = [];

			if(role != undefined)
				queue.push(
					{
						url: Alfresco.constants.PROXY_URI + "api/alvex/orgchart/units/" 
									+ encodeURIComponent(group) + "/roles/" 
									+ encodeURIComponent(role.name) + "/members",
						method: Alfresco.util.Ajax.PUT,
						requestContentType: Alfresco.util.Ajax.JSON,
						dataObj: req,
						successCallback:
						{
							fn: function (resp)
							{
								// Do smth
							},
							scope:this
						},
						failureCallback:
						{
							fn: function (resp)
							{
								// Do smth
							},
							scope:this
						}
					});
			
			queue.push(
				{
					url: Alfresco.constants.PROXY_URI 
								+ "api/alvex/orgchart/units/" + encodeURIComponent(group) + "/members",
					method: Alfresco.util.Ajax.PUT,
					requestContentType: Alfresco.util.Ajax.JSON,
					dataObj: req,
					successCallback:
					{
						fn: function (resp)
						{
							// Do smth
							this.fillDetailsDialog();
						},
						scope:this
					},
					failureCallback:
					{
						fn: function (resp)
						{
							// Do smth
							this.fillDetailsDialog();
						},
						scope:this
					}
				});
			
			Alvex.util.processAjaxQueue({
				queue: queue
			});
		},

		changeUnitAssocs: function(unitID, dataObj)
		{
			// Send requests to add admins / supervisors / roles
			var queue = [];
			if(dataObj.assoc_alvexoc_admin_added 
					&& dataObj.assoc_alvexoc_admin_added.length > 0)
			{
				queue.push({
					url: Alfresco.constants.PROXY_URI + "api/alvex/orgchart/units/" 
							+ encodeURIComponent(unitID) + "/admins",
					method: Alfresco.util.Ajax.PUT,
					dataObj: { data: { nodeRefs: dataObj.assoc_alvexoc_admin_added } },
					requestContentType: Alfresco.util.Ajax.JSON
				});
			}
			
			if(dataObj.assoc_alvexoc_admin_removed.length 
					&& dataObj.assoc_alvexoc_admin_removed.length > 0)
			{
				queue.push({
					url: Alfresco.constants.PROXY_URI + "api/alvex/orgchart/units/" 
							+ encodeURIComponent(unitID) + "/admins?alf_method=DELETE",
					method: Alfresco.util.Ajax.POST,
					dataObj: { data: { nodeRefs: dataObj.assoc_alvexoc_admin_removed } },
					requestContentType: Alfresco.util.Ajax.JSON
				});
			}
			
			if(dataObj.assoc_alvexoc_supervisor_added 
					&& dataObj.assoc_alvexoc_supervisor_added.length > 0)
			{
				queue.push({
					url: Alfresco.constants.PROXY_URI + "api/alvex/orgchart/units/" 
							+ encodeURIComponent(unitID) + "/supervisors",
					method: Alfresco.util.Ajax.PUT,
					dataObj: { data: { nodeRefs: dataObj.assoc_alvexoc_supervisor_added } },
					requestContentType: Alfresco.util.Ajax.JSON
				});
			}
			
			if(dataObj.assoc_alvexoc_supervisor_removed 
					&& dataObj.assoc_alvexoc_supervisor_removed.length > 0)
			{
				queue.push({
					url: Alfresco.constants.PROXY_URI + "api/alvex/orgchart/units/" 
							+ encodeURIComponent(unitID) + "/supervisors?alf_method=DELETE",
					method: Alfresco.util.Ajax.POST,
					dataObj: { data: { nodeRefs: dataObj.assoc_alvexoc_supervisor_removed } },
					requestContentType: Alfresco.util.Ajax.JSON
				});
			}
									
			if(queue.length > 0)
					Alvex.util.processAjaxQueue({
						queue: queue
					});
		}
	});

	/**
	* Alfresco.widget.InsituEditor.orgchartUnit constructor.
	*
	* @param p_params {Object} Instance configuration parameters
	* @return {Alfresco.widget.InsituEditor.textBox} The new textBox editor instance
	* @constructor
	*/
	Alfresco.widget.InsituEditor.orgchartUnit = function(p_params)
	{
		// We do not call superclass because we really do not need all that form-related stuff
		
		this.params = YAHOO.lang.merge({}, p_params);
		
		// Create icons instances
		this.openIcon = new Alfresco.widget.InsituEditorOrgchartOpen(this, p_params);
		this.rolesIcon = new Alfresco.widget.InsituEditorOrgchartRoles(this, p_params);
		this.editIcon = new Alfresco.widget.InsituEditorOrgchartEdit(this, p_params);
		this.addIcon = new Alfresco.widget.InsituEditorOrgchartAdd(this, p_params);
		this.deleteIcon = new Alfresco.widget.InsituEditorOrgchartDelete(this, p_params);
		
		return this;
	};
	
	YAHOO.extend(Alfresco.widget.InsituEditor.orgchartUnit, Alfresco.widget.InsituEditor.textBox,
	{
		doShow: function InsituEditor_textBox_doShow()
		{
			if (this.contextStyle === null)
				this.contextStyle = Dom.getStyle(this.params.context, "display");
			Dom.setStyle(this.params.context, "display", "none");
			Dom.setStyle(this.editForm, "display", "inline");
		},
		
		doHide: function InsituEditor_textBox_doHide(restoreUI)
		{
			if (restoreUI)
			{
				Dom.setStyle(this.editForm, "display", "none");
				Dom.setStyle(this.params.context, "display", this.contextStyle);
			}
		},
		
		_generateMarkup: function InsituEditor_textBox__generateMarkup()
		{
			return;
		}
	});

	Alfresco.widget.InsituEditorOrgchartOpen = function(p_editor, p_params)
	{
		this.editor = p_editor;
		this.params = YAHOO.lang.merge({}, p_params);
		this.disabled = p_params.disabled;
		
		this.editIcon = document.createElement("span");
		this.editIcon.title = Alfresco.util.encodeHTML(p_params.title);
		Dom.addClass(this.editIcon, "insitu-open-orgchart");
		
		this.params.context.appendChild(this.editIcon, this.params.context);
		Event.on(this.params.context, "mouseover", this.onContextMouseOver, this);
		Event.on(this.params.context, "mouseout", this.onContextMouseOut, this);
		Event.on(this.editIcon, "mouseover", this.onContextMouseOver, this);
		Event.on(this.editIcon, "mouseout", this.onContextMouseOut, this);
	};
   
	YAHOO.extend(Alfresco.widget.InsituEditorOrgchartOpen, Alfresco.widget.InsituEditorIcon,
	{
		onIconClick: function InsituEditorOrgchartOpen_onIconClick(e, obj)
		{
			var curNode = {};
			curNode.id = obj.params.unitID;
			curNode.displayName = obj.params.unitName;
			obj.params.orgchartAdmin.showViewDialog(curNode);
			Event.stopEvent(e);
		}
	});

	Alfresco.widget.InsituEditorOrgchartRoles = function(p_editor, p_params)
	{
		this.editor = p_editor;
		this.params = YAHOO.lang.merge({}, p_params);
		this.disabled = p_params.disabled;
		
		this.editIcon = document.createElement("span");
		this.editIcon.title = Alfresco.util.encodeHTML(p_params.title);
		Dom.addClass(this.editIcon, "insitu-roles-orgchart");
		
		this.params.context.appendChild(this.editIcon, this.params.context);
		Event.on(this.params.context, "mouseover", this.onContextMouseOver, this);
		Event.on(this.params.context, "mouseout", this.onContextMouseOut, this);
		Event.on(this.editIcon, "mouseover", this.onContextMouseOver, this);
		Event.on(this.editIcon, "mouseout", this.onContextMouseOut, this);
	};
   
	YAHOO.extend(Alfresco.widget.InsituEditorOrgchartRoles, Alfresco.widget.InsituEditorIcon,
	{
		onIconClick: function InsituEditorOrgchartRoles_onIconClick(e, obj)
		{
			var curNode = {};
			curNode.id = obj.params.unitID;
			curNode.displayName = obj.params.unitName;
			obj.params.orgchartAdmin.editUnitRoles(curNode);
			Event.stopEvent(e);
		}
	});

	Alfresco.widget.InsituEditorOrgchartEdit = function(p_editor, p_params)
	{
		this.editor = p_editor;
		this.params = YAHOO.lang.merge({}, p_params);
		this.disabled = p_params.disabled;
		
		this.editIcon = document.createElement("span");
		this.editIcon.title = Alfresco.util.encodeHTML(p_params.title);
		Dom.addClass(this.editIcon, "insitu-edit-orgchart");
		
		this.params.context.appendChild(this.editIcon, this.params.context);
		Event.on(this.params.context, "mouseover", this.onContextMouseOver, this);
		Event.on(this.params.context, "mouseout", this.onContextMouseOut, this);
		Event.on(this.editIcon, "mouseover", this.onContextMouseOver, this);
		Event.on(this.editIcon, "mouseout", this.onContextMouseOut, this);
	};
   
	YAHOO.extend(Alfresco.widget.InsituEditorOrgchartEdit, Alfresco.widget.InsituEditorIcon,
	{
		onIconClick: function InsituEditorOrgchartEdit_onIconClick(e, obj)
		{
			var oa = obj.params.orgchartAdmin;
			var id = obj.params.unitID;
			var curElem = obj.params.curElem;
			
			// Intercept before dialog show
			var doBeforeDialogShow = function(p_form, p_dialog)
			{
				Alfresco.util.populateHTML(
					[ p_dialog.id + "-dialogTitle", oa.msg("alvex.orgchart.edit_unit") ],
					[ p_dialog.id + "-dialogHeader", oa.msg("alvex.orgchart.edit_unit") ]
				);
			};

			var templateUrl = YAHOO.lang.substitute(
					Alfresco.constants.URL_SERVICECONTEXT 
						+ "components/form?itemKind={itemKind}&itemId={itemId}&mode={mode}" 
						+ "&submitType={submitType}&showCancelButton=true",
				{
					itemKind: "node",
					itemId: 'workspace://SpacesStore/' + id,
					mode: "edit",
					submitType: "json"
				});

			// Using Forms Service, so always create new instance
			var editUnitDialog = new Alfresco.module.SimpleDialog(oa.id + "-editUnitDialog");

			editUnitDialog.setOptions(
			{
				width: "33em",
				templateUrl: templateUrl,
				actionUrl: null,
				destroyOnHide: true,

				doBeforeDialogShow:
				{
					fn: doBeforeDialogShow,
					scope: oa
				},
				// Intercept form submit and send requests to our API instead
				doBeforeAjaxRequest:
				{
					fn: function(config, obj)
					{
						// The first 'queue' - update unit
						// We need ID from server to start adding admins / supervisors / roles
						var queue = [];
						queue.push({
							url: Alfresco.constants.PROXY_URI + "api/alvex/orgchart/units/" + id,
							method: Alfresco.util.Ajax.POST,
							dataObj: {
								data: {
									displayName : config.dataObj.prop_alvexoc_unitDisplayName,
									weight : config.dataObj.prop_alvexoc_unitWeight
								}
							},
							requestContentType: Alfresco.util.Ajax.JSON,
							successCallback:
							{
								fn: function (response, obj)
								{
									curElem.label = response.json.data.displayName;
									curElem.refresh();
									this.onExpandComplete(null);
									if (response.serverResponse.statusText)
									{
										Alfresco.util.PopupManager.displayMessage({ text: response.serverResponse.statusText });
									}
																		
									// Change admins / supervisors / roles
									this.changeUnitAssocs(response.json.data.id, obj.dataObj);
								},
								obj: { dataObj: config.dataObj },
								scope: this
							},
							failureCallback: 
							{
								fn: function (response, obj)
								{
									Alfresco.util.PopupManager.displayMessage({ text: "Failure" });
								},
								scope: this
							}
						});

						Alvex.util.processAjaxQueue({
							queue: queue
						});
						
						return false;
					},
					scope: oa
				}
			}).show();
			Event.stopEvent(e);
		}
	});
	
	Alfresco.widget.InsituEditorOrgchartAdd = function(p_editor, p_params)
	{
		this.editor = p_editor;
		this.params = YAHOO.lang.merge({}, p_params);
		this.disabled = p_params.disabled;
		
		this.editIcon = document.createElement("span");
		this.editIcon.title = Alfresco.util.encodeHTML(p_params.title);
		Dom.addClass(this.editIcon, "insitu-add-orgchart");
		
		this.params.context.appendChild(this.editIcon, this.params.context);
		Event.on(this.params.context, "mouseover", this.onContextMouseOver, this);
		Event.on(this.params.context, "mouseout", this.onContextMouseOut, this);
		Event.on(this.editIcon, "mouseover", this.onContextMouseOver, this);
		Event.on(this.editIcon, "mouseout", this.onContextMouseOut, this);
	};
   
	YAHOO.extend(Alfresco.widget.InsituEditorOrgchartAdd, Alfresco.widget.InsituEditorIcon,
	{
		onIconClick: function InsituEditorOrgchartAdd_onIconClick(e, obj)
		{
			var oa = obj.params.orgchartAdmin;
			var parent = obj.params.unitID;
			var curElem = obj.params.curElem;
			
			// Intercept before dialog show
			var doBeforeDialogShow = function(p_form, p_dialog)
			{
				Alfresco.util.populateHTML(
					[ p_dialog.id + "-dialogTitle", oa.msg("alvex.orgchart.add_unit") ],
					[ p_dialog.id + "-dialogHeader", oa.msg("alvex.orgchart.add_unit") ]
				);
			};

			var templateUrl = YAHOO.lang.substitute(
					Alfresco.constants.URL_SERVICECONTEXT 
						+ "components/form?itemKind={itemKind}&itemId={itemId}&mode={mode}" 
						+ "&submitType={submitType}&showCancelButton=true",
				{
					itemKind: "type",
					itemId: "alvexoc:unit",
					mode: "create",
					submitType: "json"
				});

			// Using Forms Service, so always create new instance
			var addUnitDialog = new Alfresco.module.SimpleDialog(oa.id + "-addUnitDialog");

			addUnitDialog.setOptions(
			{
				width: "33em",
				templateUrl: templateUrl,
				actionUrl: null,
				destroyOnHide: true,

				doBeforeDialogShow:
				{
					fn: doBeforeDialogShow,
					scope: oa
				},
				// Intercept form submit and send requests to our API instead
				doBeforeAjaxRequest:
				{
					fn: function(config, obj)
					{
						// The first 'queue' - create unit
						// We need ID from server to start adding admins / supervisors / roles
						var queue = [];
						queue.push({
							url: Alfresco.constants.PROXY_URI + "api/alvex/orgchart/units/" + parent,
							method: Alfresco.util.Ajax.PUT,
							dataObj: {
								data: {
									name : config.dataObj.prop_alvexoc_unitDisplayName,
									displayName : config.dataObj.prop_alvexoc_unitDisplayName,
									weight : config.dataObj.prop_alvexoc_unitWeight
								}
							},
							requestContentType: Alfresco.util.Ajax.JSON,
							successCallback:
							{
								fn: function (response, obj)
								{
									var newNode = {};
									newNode.name = response.json.data.displayName;
									newNode.displayName = response.json.data.displayName;
									newNode.id = response.json.data.id;
									
									// Update UI
									this.insertTreeLabel( curElem, newNode );
									curElem.refresh();
									this.onExpandComplete(null);
								
									if (response.serverResponse.statusText)
									{
										Alfresco.util.PopupManager.displayMessage({ text: response.serverResponse.statusText });
									}
									
									// Add admins / supervisors / roles
									this.changeUnitAssocs(newNode.id, obj.dataObj);
								},
								obj: { dataObj: config.dataObj },
								scope: this
							},
							failureCallback: 
							{
								fn: function (response, obj)
								{
									Alfresco.util.PopupManager.displayMessage({ text: "Failure" });
								},
								scope: this
							}
						});

						Alvex.util.processAjaxQueue({
							queue: queue
						});
						
						return false;
					},
					scope: oa
				}
			}).show();
			Event.stopEvent(e);
		}
	});

	Alfresco.widget.InsituEditorOrgchartDelete = function(p_editor, p_params)
	{
		this.editor = p_editor;
		this.params = YAHOO.lang.merge({}, p_params);
		this.disabled = p_params.disabled;
		
		this.editIcon = document.createElement("span");
		this.editIcon.title = Alfresco.util.encodeHTML(p_params.title);
		Dom.addClass(this.editIcon, "insitu-delete-orgchart");
		
		this.params.context.appendChild(this.editIcon, this.params.context);
		Event.on(this.params.context, "mouseover", this.onContextMouseOver, this);
		Event.on(this.params.context, "mouseout", this.onContextMouseOut, this);
		Event.on(this.editIcon, "mouseover", this.onContextMouseOver, this);
		Event.on(this.editIcon, "mouseout", this.onContextMouseOut, this);
	};
   
	YAHOO.extend(Alfresco.widget.InsituEditorOrgchartDelete, Alfresco.widget.InsituEditorIcon,
	{
		onIconClick: function InsituEditorOrgchartDelete_onIconClick(e, obj)
		{
			var oa = obj.params.orgchartAdmin;
			Alfresco.util.PopupManager.displayPrompt(
			{
				title: oa.msg("alvex.orgchart.delete_unit"),
				text: oa.msg("alvex.orgchart.delete_unit_text",  Alfresco.util.encodeHTML(obj.params.unitName)),
				buttons: [
				{
					text: oa.msg("button.delete"),
					handler: function()
					{
						// Delete org chart unit
						Alfresco.util.Ajax.jsonRequest({
							url: Alfresco.constants.PROXY_URI 
								+ "api/alvex/orgchart/units/" + encodeURIComponent(obj.params.unitID) + "?alf_method=DELETE",
							method: Alfresco.util.Ajax.POST,
							dataObj: null,
							successCallback:
							{
								fn: function (response)
								{
									var parent = obj.params.curElem.parent;
									obj.params.orgchartAdmin.widgets.pageTreeView.removeNode( obj.params.curElem );
									parent.refresh();
									obj.params.orgchartAdmin.onExpandComplete(null);

									if (response.serverResponse.statusText)
									{
										Alfresco.util.PopupManager.displayMessage({ text: response.serverResponse.statusText });
									}
								},
								scope:this
							},
							failureCallback:
							{
								fn: function (response)
								{
									if (response.serverResponse.statusText)
									{
										Alfresco.util.PopupManager.displayMessage({ text: response.serverResponse.statusText });
									}
								},
								scope:this
							}
						});
						this.destroy();
					}
				},
				{
					text: oa.msg("button.cancel"),
					handler: function()
					{
						this.destroy();
					},
					isDefault: true
				}]
			});
			Event.stopEvent(e);
		}
	});

})();