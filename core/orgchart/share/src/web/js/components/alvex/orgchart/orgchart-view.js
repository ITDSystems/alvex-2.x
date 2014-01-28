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
		DDM = YAHOO.util.DragDropMgr,
		DDTarget = YAHOO.util.DDTarget,
		KeyListener = YAHOO.util.KeyListener;
	var $html = Alfresco.util.encodeHTML;

	Alvex.OrgchartViewer = function(htmlId)
	{
		Alvex.OrgchartViewer.superclass.constructor.call(this, "OrgchartViewer", htmlId);
		YAHOO.Bubbling.on("formContentReady", this.onFormContentReady, this);
		YAHOO.Bubbling.on("formContainerDestroyed", this.onFormDestroyed, this);
		YAHOO.Bubbling.on("orgchartSubTreeMove", this.onSubtreeMove, this);
		return this;
	};

	YAHOO.extend(Alvex.OrgchartViewer, Alfresco.component.Base,
	{
		options:
		{
			// Control mode - 'viewer', 'picker', 'admin'
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
			// Selected group
			selectedGroup: null,
			// Role instances created for selected group
			selectedGroupRoles: [],
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
			initialized: false,
			// NodeRef of the node that stores UI config ('admin' mode only)
			uiConfigNodeRef: '',
			// NodeRef of the node that stores orgchart sync config ('admin' mode only)
			syncConfigNodeRef: '',
			// Org chart sync source
			syncSource: 'none',
			// Maps nodes from TreeView to org chart units
			treeNodesMap: {},
			// Orgchart branch we are working with
			curBranch: 'default',
			// All orgchart branches
			branches: []
		},

		onFormDestroyed: function()
		{
			YAHOO.Bubbling.unsubscribe("formContentReady", this.onFormContentReady, this);
			YAHOO.Bubbling.unsubscribe("formContainerDestroyed", this.onFormDestroyed, this);
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
			this.options.userRolesDialogId = this.id + "-cntrl-user-roles-dialog";
			this.options.unitRolesDialogId = this.id + "-cntrl-unit-roles-dialog";
			
			if(this.options.defaultRoleName == '')
				this.options.defaultRoleName = this.msg("alvex.orgchart.default_group");
			
			if(this.options.mode == "viewer") {
				this.initViewer();
			} else if (this.options.mode == "picker") {
				this.initPicker();
			} else if (this.options.mode == "admin") {
				this.initAdmin();
			}
		},

		initViewer: function()
		{
			// In viewer mode init selector and JIT canvas on the page
			
			// If we are going to draw the graph - prepare canvas
			if (this.options.style == 'graph')
			{
				var header = Dom.get("alf-hd");
				var wrapper = header.parentNode.parentNode;
				var footer = Dom.get("alf-ft").parentNode;
				var selector = Dom.get(this.id + "-top-group-selector");

				this.options.jitHeight = wrapper.clientHeight - header.clientHeight 
									- selector.clientHeight - footer.clientHeight - 55;

				Dom.get(this.id + '-infovis').style.height = this.options.jitHeight + 'px';
			}

			this.activateWaitMessage();
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
						if(resp.json.branches.length == 0) {
							this.hideWaitMessage();
							return;
						}
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
									this.hideWaitMessage();

									this.options.orgchart = resp.json.data[0];

									if(this.options.orgchart.children.length >= 0)
									{
										this.createViewDialog();
										if (this.options.style == 'graph')
										{
											Dom.removeClass( Dom.get(this.id + '-infovis'), "hidden" );
											this.createJIT();
											var selector = Dom.get(this.id + '-top-group-selector');

											var link = document.createElement("a");
											link.href = "#";
											link.id = this.id + '-top-group-0';
											link.innerHTML = this.options.orgchart.displayName;
											selector.appendChild(link);
											selector.innerHTML += ' ';
											YAHOO.util.Event.onAvailable(this.id + '-top-group-0', 
												this.attachTopGroupSelectorListener, '0', this);
											this.selectTopGroup(null, 0);
										}
										else if (this.options.style == 'tree')
										{
											Dom.removeClass( 
												Dom.get(this.id + '-page-tree-view'), "hidden" );
											this.createTree();
										}
									}
								},
								scope:this
							},
							failureCallback:
							{
								fn: function (resp)
								{
									this.hideWaitMessage();
									if (resp.serverResponse.statusText) {
										Alfresco.util.PopupManager.displayMessage( { 
												text: resp.serverResponse.statusText 
										} );
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
						this.hideWaitMessage();
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
			
			this.createUserRolesDialog();
			this.createUnitRolesDialog();
			this.createRolesTable();
		},

		activateWaitMessage: function()
		{
			this.loading = true;
			YAHOO.lang.later(1000, this, function() 
				{
					if (this.loading)
					{
						if (!this.widgets.waitMessage)
						{
							this.widgets.waitMessage = Alfresco.util.PopupManager.displayMessage(
							{
								text: this.msg("alvex.orgchart.waitingForLoad"),
								spanClass: "wait",
								displayTime: 0
							});
						}
						else if (!this.widgets.waitMessage.cfg.getProperty("visible"))
						{
							this.widgets.waitMessage.show();
						}
					}
				}, [] );
		},

		hideWaitMessage: function()
		{
			this.loading = false;
			if( this.widgets.waitMessage )
				this.widgets.waitMessage.hide();
		},

		initPicker: function()
		{
			// In picker mode - load assignees info and create button if necessary

			// Get existing assignees (if any)

			var cur_assignees_refs = [];
			if( Dom.get(this.id).value && Dom.get(this.id).value != '')
				cur_assignees_refs = Dom.get(this.id).value.split(',');

			// Prepare req to get names from nodeRefs
			var req = {};
			req['items'] = cur_assignees_refs;
			req['itemValueType'] = 'nodeRef';

			Alfresco.util.Ajax.jsonRequest({
				url: Alfresco.constants.PROXY_URI + "api/alvex/picker/users/byrefs",
				method: Alfresco.util.Ajax.POST,
				dataObj: req,
				successCallback:
				{
					fn: function (resp)
					{
						// Remember current assignees details
						this.options.assignees = resp.json.data.people;
						// And show them in HTML
						for (m in this.options.assignees) {
							Dom.get(this.id + "-cntrl-currentValueDisplay").innerHTML 
									+= '<div><img src="/share/res/components/images/filetypes/generic-user-16.png" '
									+ 'width="16" alt="" title="' + this.options.assignees[m].name + '"> ' 
									+ '<a href="/share/page/user/' + this.options.assignees[m].userName + '/profile">' 
									+ this.options.assignees[m].name + '</a> </div>';
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

				this.activateWaitMessage();

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
							{
								me.hideWaitMessage();
								me.createPickerDialog();
								me.updateUI();
								return;
							}
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
										me.hideWaitMessage();
										me.options.orgchart = resp.json.data[0];
										me.createPickerDialog();
										me.updateUI();
									}
								},
								failureCallback:
								{
									fn: function (resp)
									{
										me.hideWaitMessage();
										if (resp.serverResponse.statusText) {
											Alfresco.util.PopupManager.displayMessage({ 
													text: resp.serverResponse.statusText });
										}
									},
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
							me.hideWaitMessage();
							if (resp.serverResponse.statusText)
								Alfresco.util.PopupManager.displayMessage({ text: resp.serverResponse.statusText });
						},
						scope:this
					}
				});
			}
		},

		initAdmin: function()
		{
			this.options.treeNodesMap = {};

			this.createUserRolesDialog();
			this.createUnitRolesDialog();
			this.createRolesTable();

			if( Dom.get( this.id + "-ui-config" ) )
				this.widgets.uiConfig = new YAHOO.widget.Button(this.id + "-ui-config",
							{ onclick: { fn: this.onUIConfig, obj: null, scope: this } });

			if( Dom.get( this.id + "-sync-config" ) )
				this.widgets.syncConfig = new YAHOO.widget.Button(this.id + "-sync-config",
							{ onclick: { fn: this.onSyncConfig, obj: null, scope: this } });

			if( Dom.get( this.id + "-sync-now" ) )
				this.widgets.syncNow = new YAHOO.widget.Button(this.id + "-sync-now",
							{ onclick: { fn: this.onSyncNow, obj: null, scope: this } });

			if( Dom.get( this.id + "-add-role" ) )
				this.widgets.addRole = new YAHOO.widget.Button(this.id + "-add-role",
							{ onclick: { fn: this.onAddRole, obj: null, scope: this } });

			// TODO - How can we handle links outside of the table?
			// May be just create static event listeners?
			// Or create additional insituEditors?

			this.activateWaitMessage();

			this.adminLoadBranches();

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

		adminLoadBranches: function()
		{
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
							this.hideWaitMessage();
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
						this.hideWaitMessage();
						if (resp.serverResponse.statusText)
							Alfresco.util.PopupManager.displayMessage({ text: resp.serverResponse.statusText });
					},
					scope:this
				}
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
									+ encodeURIComponent(
										Alvex.util.createClearNodeName(this.options.curBranch)
									),
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
									if (resp.serverResponse.statusText) {
										Alfresco.util.PopupManager.displayMessage( { 
											text: resp.serverResponse.statusText });
									}
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
						this.hideWaitMessage();

						this.options.orgchart = resp.json.data[0];
						
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
						this.hideWaitMessage();
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

		onSyncConfig: function()
		{
			// Intercept before dialog show
			var doBeforeDialogShow = function(p_form, p_dialog)
			{
				Alfresco.util.populateHTML(
					[ p_dialog.id + "-dialogTitle", this.msg("alvex.orgchart.configureSync") ],
					[ p_dialog.id + "-dialogHeader", this.msg("alvex.orgchart.configureSync") ]
				);
			};

			var templateUrl = YAHOO.lang.substitute(
					Alfresco.constants.URL_SERVICECONTEXT 
						+ "components/form?itemKind={itemKind}&itemId={itemId}&mode={mode}" 
						+ "&submitType={submitType}&showCancelButton=true",
				{
					itemKind: "node",
					itemId: this.options.syncConfigNodeRef,
					mode: "edit",
					submitType: "json"
				});

			// Using Forms Service, so always create new instance
			var syncConfigDialog = new Alfresco.module.SimpleDialog(this.id + "-syncConfigDialog");

			syncConfigDialog.setOptions(
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
					fn: function syncConfigDialogSuccess(response)
					{
						Alfresco.util.PopupManager.displayMessage(
						{
							text: this.msg("alvex.orgchart.configureSync.success")
						});
					},
					scope: this
				},
				onFailure:
				{
					fn: function syncConfigDialogFailure(response)
					{
						Alfresco.util.PopupManager.displayMessage(
						{
							text: this.msg("alvex.orgchart.configureSync.failure")
						});
					},
					scope: this
				}
			}).show();
		},

		onSyncNow: function()
		{
			Alfresco.util.PopupManager.displayMessage(
			{
				text: this.msg("alvex.orgchart.syncStarted")
			});

			Alfresco.util.Ajax.jsonRequest({
				url: Alfresco.constants.PROXY_URI + "api/alvex/orgchart/sync-start",
				method: Alfresco.util.Ajax.GET,
				dataObj: null,
				successCallback:
				{
					fn: function (resp)
					{
						Alfresco.util.PopupManager.displayMessage(
						{
							text: this.msg("alvex.orgchart." + resp.json.syncStatus)
						});
						this.adminLoadBranches();
					},
					scope:this
				},
				failureCallback:
				{
					fn: function (resp)
					{
						Alfresco.util.PopupManager.displayMessage(
						{
							text: this.msg("alvex.orgchart.syncFailed")
						});
					},
					scope:this
				}
			});
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
						var id = Alvex.util.createClearNodeName(role.displayName);
						
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
						
						if( obj )
							obj.hide();

						return false;
					},
					scope: this,
					obj: addRoleDialog
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

		createTree: function()
		{
			this.options.tree = new YAHOO.widget.TreeView(this.id + "-page-tree-view");
			
			this.options.tree.singleNodeHighlight = true;
			this.options.tree.subscribe("clickEvent",this.options.tree.onEventToggleHighlight);
			this.options.insituEditors = [];
			
			if(this.options.orgchart) {
				var node = this.insertTreeLabel(this.options.tree.getRoot(), this.options.orgchart);
				node.expand();
			}
			this.options.tree.subscribe("expandComplete", this.onExpandComplete, this, true);
			this.options.tree.draw();
			this.onExpandComplete(null);
			this.showMyUnit();
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

		onAddUserPanelCancel: function(e, p_obj)
		{
			this.widgets.addUserPanel.hide();
			if (e) {
				Event.preventDefault(e);
			}
		},

		onSearch: function()
		{
			this.options.selectedGroup = null;
			var searchTerm = Dom.get(this.options.pickerId + "-searchText").value;
			var url = Alfresco.constants.PROXY_URI
						+ "api/alvex/picker/users/search?" 
						+ "searchTerm=" + encodeURIComponent(searchTerm) + "&size=100";

			Alfresco.util.Ajax.jsonRequest({
				url: url,
				method: Alfresco.util.Ajax.GET,
				dataObj: null,
				successCallback:
				{
					fn: function (resp)
					{
						var users = resp.json.data.people;

						for (x in users)
							users[x].roleDisplayName = this.msg("alvex.orgchart.people_found");

						// clear data for display
						this.options.usersDataStore.length = 0;

						// sort alphabetically
						this.sortPeople(users);

						// push all users to datasource to display placing them into default role
						for (x in users) {	
							this.options.usersDataStore.push(
								{
									name: users[x].name,
									userName: users[x].userName,
									nodeRef: users[x].nodeRef,
									role: users[x].role
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

			this.showMyUnit();
		},

		showMyUnit: function()
		{
			// Expand the tree to show the unit current user belongs to
			Alfresco.util.Ajax.request(
			{
				url: Alfresco.constants.PROXY_URI + "api/alvex/orgchart/user/" 
						+ encodeURIComponent(Alfresco.constants.USERNAME) + "/roles",
				successCallback:
				{
					fn: this.autoExpandTree,
					scope: this
				},
				failureMessage: "Can not get roles for current user"
			});
		},

		autoExpandTree: function(resp)
		{
			if( this.options.mode == 'admin' )
				return;
			var nodes = resp.json.data;
			if( nodes.length == 0 )
				return;
			// Traverse all nodes up to the tree root
			var traverse = [];
			for( var i in nodes )
			{
				traverse[i] = [];
				var node = this.options.tree.getNodeByProperty('labelElId', nodes[i].unitId);
				while( node.depth >= 0 ) {
					traverse[i].push(node);
					node = node.parent;
				}
			}
			// Find common anchestor
			var targetIndex = 0;
			for( var i = 1; i < traverse.length; i++ )
			{
				var found = false;
				while( !found && targetIndex < traverse[0].length )
				{
					for( var k = 0; k < traverse[i].length; k++ )
					{
						if( traverse[0][targetIndex].labelElId == traverse[i][k].labelElId )
						{
							found = true;
							break;
						}
					}
					if( !found )
						targetIndex++;
				}
			}
			//Highlight and expand common anchestor
			var targetNode = ( targetIndex < traverse[0].length ? traverse[0][targetIndex] : traverse[0][traverse[0].length] );
			if( targetNode ) {
				targetNode.highlight();
				var parent = targetNode;
				while( parent.depth > 0 ) {
					parent.expand();
					parent = parent.parent;
				}
			}
			// Emulate click for picker - fill user table automatically
			if( this.options.mode == 'picker' )
				this.treeViewClicked(targetNode);
		},
		
		onSubtreeMove: function(ev, arg)
		{
			var data = arg[1];
			var dest = data.dest;
			var src = this.options.treeNodesMap[data.src];
			if( dest == src )
				return;

			// Move subtree
			Alfresco.util.Ajax.jsonRequest({
				url: Alfresco.constants.PROXY_URI 
							+ "api/alvex/orgchart/units/" + src + "/move/" + dest,
				method: Alfresco.util.Ajax.POST,
				dataObj: {},
				successCallback:
				{
					fn: function (resp)
					{
						// We have some issues with stalled Insitu Editor after subtree move.
						// So we will go with hardcore solution now, just to be on the safe side.
						// this.loadOrgchartBranch(this.options.curBranch)
						Alfresco.util.PopupManager.displayMessage( 
						{
							text: this.msg("message.please-wait"), 
							spanClass: 'wait' 
						} );
						YAHOO.lang.later(1000, this, function() 
						{
							location.reload();
						}, [] );
					},
					scope:this
				},
				failureCallback:
				{
					fn: function (resp)
					{
						if (resp.serverResponse.statusText)
						{
							Alfresco.util.PopupManager.displayMessage(
									{ text: resp.serverResponse.statusText });
						}
					},
					scope:this
				}
			});
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
			
			if( ! this.canAdminUnit(node) )
			{
				Dom.addClass( Dom.get(this.options.pickerId + "-add-users"), "hidden" );
				this.fillDetailsDialog();
				// Show the dialog
				this.widgets.dialog.show();
				Dom.removeClass(this.options.pickerId, "hidden");
				this.widgets.dialog.center();
			} else {
				Dom.removeClass( Dom.get(this.options.pickerId + "-add-users"), "hidden" );
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
							Dom.removeClass(me.options.pickerId, "hidden");
							me.widgets.dialog.center();
						},
						scope: this
					},
					failureMessage: "Can not get roles for group"
				});
			}
		},

		// Fill tree view group selector with orgchart data
		fillPickerDialog: function OrgchartViewerDialog_fillPickerDialog()
		{
			if( this.options.orgchart === null)
				return;
			
			this.options.tree = new YAHOO.widget.TreeView(this.options.pickerId + "-groups");
			this.options.tree.singleNodeHighlight = true;
			this.options.tree.subscribe("clickEvent",this.options.tree.onEventToggleHighlight);
			this.options.insituEditors = [];

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
			var me = this;
			var curElem = new YAHOO.widget.TextNode(newNode.displayName, curRoot, false);
			curElem.labelElId = newNode.id;
			new DDList("ygtv" + curElem.index);
			new DDTarget(curElem.labelElId);
			this.options.treeNodesMap["ygtv" + curElem.index] = curElem.labelElId;
			this.options.insituEditors.push( 
				{
					context: newNode.id, 
					params: {
							showDelay: 300,
							hideDelay: 300,
							type: "orgchartUnit",
							mode: this.options.mode,
							syncSource: this.options.syncSource,
							unitID: newNode.id,
							unitName: newNode.displayName,
							curElem: curElem,
							orgchartAdmin: me,
							unit: newNode
						}, 
					callback: null 
				} );
			for(var c in newNode.children)
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
			YAHOO.Bubbling.addDefaultAction(this.id + "-action-link", fnActionHandler, true);

			var actionsWidth;
			if(this.options.mode == "picker")
				actionsWidth = 52;
			else
				actionsWidth = 80;

			var myColumnDefs = [
				{key:'icon', sortable:false, width:32, formatter: this.formatIconField},
				{key:'name', sortable:false, minWidth: 10000, formatter: this.formatNameField},
				{key:'action', sortable:false, width:actionsWidth, formatter: this.formatActionsField}
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

		formatActionsField: function (elLiner, oRecord, oColumn, oData)
		{
			var id = this.orgchart.id;
			var html = '<div id="' + id + '-actions-' + oRecord.getId() + '" class="action hidden">';

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
			
			if( this.orgchart.canEditUser(this.orgchart.options.selectedGroup) )
			{
				html += '<div class="' + 'editUserRoles' + '"><a rel="edit-roles" href="" ' 
						+ 'class="orgchart-action-link ' + id + '-action-link"'
						+ 'title="' + this.orgchart.msg("alvex.orgchart.button.edit-roles") +'">' 
						+ '<span>' + this.orgchart.msg("alvex.orgchart.button.edit-roles") + '</span></a></div>';
			}

			if( this.orgchart.canDeleteUser(this.orgchart.options.selectedGroup) )
			{
				html += '<div class="' + 'deleteUser' + '"><a rel="delete" href="" ' 
						+ 'class="orgchart-action-link ' + id + '-action-link"'
						+ 'title="' + this.orgchart.msg("alvex.orgchart.button.delete") +'">' 
						+ '<span>' + this.orgchart.msg("alvex.orgchart.button.delete") + '</span></a></div>';
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
				html += '<div class="' + 'showUserInfoTitle' + '"><a rel="view" href="" ' 
						+ 'class="orgchart-action-link ' + id + '-action-link"'
						+ 'title="' + this.orgchart.msg("alvex.orgchart.button.view") +'"><img' 
						+ ' src="/share/res/components/images/filetypes/generic-user-32.png"' 
						+ ' width="32"/></a></div>';
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
				html = '<div class="' + 'showUserInfoTitle' + '">' 
						+ '<h4 class="name"><a rel="view" href="" ' 
						+ 'class="orgchart-action-link ' + id + '-action-link"'
						+ 'title="' + this.orgchart.msg("alvex.orgchart.button.view") +'">' 
						+ '<span>' + user.name + '</span></a></h4></div>';
			}

			elLiner.innerHTML = html;
		},

		canAddAssignee: function()
		{
			return ( ! ( this.options.mode != 'picker' 
						|| this.options.disabled
						|| ( (this.options.multipleSelectMode == false) 
							&& (this.options.assignees.length 
							+ this.options.assignees_added.length 
							- this.options.assignees_removed.length > 0) )	) );
		},

		canEditUser: function(unit)
		{
			return ( ( this.options.mode == 'admin' ) 
						|| ( (unit != null) && ( unit.isAdmin == "true" ) ) );
		},

		canDeleteUser: function(unit)
		{
			return ( ( ( this.options.mode == 'admin' ) || ( (unit != null) && ( unit.isAdmin == "true" ) ) )
					&& ( this.options.syncSource == 'none' )
				);
		},

		canAdminUnit: function(node)
		{
			return ( ( this.options.mode == 'admin' ) || ( node.isAdmin == "true" ) );
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
					[ p_dialog.id + "-dialogTitle", this.msg("alvex.orgchart.editRoleDef") ],
					[ p_dialog.id + "-dialogHeader", this.msg("alvex.orgchart.editRoleDef") ]
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

						if( obj )
							obj.hide();

						return false;
					},
					scope: this,
					obj: editRoleDialog
				}
			}).show();
			
		},
		
		deleteRoleDef: function(roleDef)
		{
			var me = this;
			Alfresco.util.PopupManager.displayPrompt(
			{
				title: me.msg("alvex.orgchart.deleteRoleDef"),
				text: me.msg("alvex.orgchart.deleteRoleDefText",  Alfresco.util.encodeHTML(roleDef.displayName)),
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
									if (resp.json.details)
									{
										var parts = resp.json.details.split('|');
										Alfresco.util.PopupManager.displayMessage({ text: me.msg(parts[0], parts[1]) });
									}
									else if (resp.serverResponse.statusText)
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
		},

		fillPeopleTable: function OrgchartViewerDialog_fillPeopleTable(node_id)
		{
			Dom.addClass( this.options.pickerId + "-view-people", "badge-highlight" );
			Dom.removeClass( this.options.pickerId + "-view-roles", "badge-highlight" );
			this.fillTable(node_id, false);
		},

		fillRolesTable: function OrgchartViewerDialog_fillRolesTable(node_id)
		{
			Dom.removeClass( this.options.pickerId + "-view-people", "badge-highlight" );
			Dom.addClass( this.options.pickerId + "-view-roles", "badge-highlight" );
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

						// Sort by name only for 'by name' view
						// For view 'by role' sorting is performed server-side
						if( !showRoles )
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
						Dom.get(this.options.pickerId + '-person-telephone').innerHTML = $html(profile.telephone);
						Dom.get(this.options.pickerId + '-person-mobile').innerHTML = $html(profile.mobile);
						Dom.get(this.options.pickerId + '-person-email').innerHTML = $html(profile.email);
						Dom.get(this.options.pickerId + '-person-skype').innerHTML = $html(profile.skype);
						Dom.get(this.options.pickerId + '-person-im').innerHTML = $html(profile.instantmsg);
						// Dom.get(this.options.pickerId + '-person-loc').innerHTML = $html(profile.location);
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
				var nameA;
				if( (a.lastName != undefined) && (a.firstName != undefined ) )
					nameA = a.lastName.toLowerCase() + ' ' + a.firstName.toLowerCase();
				else
					nameA = a.name.toLowerCase();
				var nameB;
				if( (b.lastName != undefined) && (b.firstName != undefined ) )
					nameB = b.lastName.toLowerCase() + ' ' + b.firstName.toLowerCase();
				else
					nameB = b.name.toLowerCase();
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
			return '<span class="remove-item" id="' + person.nodeRef 
					+ '"><img src="/share/res/components/images/remove-icon-16.png" width="16"/></span>';
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
		if( ( this.params.mode == "admin" ) || ( this.params.unit.isAdmin == "true" ) )
		{
			this.rolesIcon = new Alfresco.widget.InsituEditorOrgchartRoles(this, p_params);
			this.editIcon = new Alfresco.widget.InsituEditorOrgchartEdit(this, p_params);
			if( this.params.syncSource == 'none' )
			{
				this.addIcon = new Alfresco.widget.InsituEditorOrgchartAdd(this, p_params);
				this.deleteIcon = new Alfresco.widget.InsituEditorOrgchartDelete(this, p_params);
			}
		}
		
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
		this.editIcon.title = Alfresco.util.encodeHTML(p_params.orgchartAdmin.msg("alvex.orgchart.unit_members"));
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
			curNode.name = obj.params.unitName;
			curNode.isAdmin = obj.params.unit.isAdmin;
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
		this.editIcon.title = Alfresco.util.encodeHTML(p_params.orgchartAdmin.msg("alvex.orgchart.unit_roles"));
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
		this.editIcon.title = Alfresco.util.encodeHTML(p_params.orgchartAdmin.msg("alvex.orgchart.edit_unit"));
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
						
						if( obj )
							obj.hide();

						return false;
					},
					scope: oa,
					obj: editUnitDialog
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
		this.editIcon.title = Alfresco.util.encodeHTML(p_params.orgchartAdmin.msg("alvex.orgchart.add_unit"));
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
									name : Alvex.util.createClearNodeName(
											config.dataObj.prop_alvexoc_unitDisplayName),
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
									newNode.isAdmin = "true";
									
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
						
						if( obj )
							obj.hide();

						return false;
					},
					scope: oa,
					obj: addUnitDialog
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
		this.editIcon.title = Alfresco.util.encodeHTML(p_params.orgchartAdmin.msg("alvex.orgchart.delete_unit"));
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
									obj.params.orgchartAdmin.options.tree.removeNode( obj.params.curElem );
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
	
	//////////////////////////////////////////////////////////////////////////////
	// Custom drag and drop implementation. Original ideas and code are from 
	// http://www.coderfoo.com/2009/07/yui-treeview-with-drag-and-drop-nodes.html
	// and 
	// http://developer.yahoo.com/yui/examples/dragdrop/dd-reorder.html
	//////////////////////////////////////////////////////////////////////////////
	
	DDList = function(id, sGroup, config)
	{
		DDList.superclass.constructor.call(this, id, sGroup, config);
		var el = this.getDragEl();
		Dom.setStyle(el, "opacity", 0.67); // The proxy is slightly transparent
	};
	
	YAHOO.extend(DDList, YAHOO.util.DDProxy, 
	{
		startDrag: function(x, y)
		{
			// make the proxy look like the source element
			var dragEl = this.getDragEl();
			var clickEl = this.getEl();
			var pEl = clickEl.parentNode;
			Dom.setStyle(clickEl, "visibility", "hidden");
			dragEl.innerHTML = clickEl.innerHTML;
			Dom.setStyle(dragEl, "width", "100px");
			Dom.setStyle(dragEl, "border", "2px solid gray");
		},
		
		onDragDrop: function(e, id)
		{
			if( Dom.get( id ).nodeName.toLowerCase() == 'span' )
			{
				var destEl = Dom.get( id );
				var srcEl = this.getEl();
				YAHOO.Bubbling.fire('orgchartSubTreeMove',
				{
					'src': srcEl.id,
					'dest': destEl.id
				});
			}
		}
	});
	
})();
