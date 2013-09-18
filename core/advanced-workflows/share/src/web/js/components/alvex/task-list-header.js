/**
  * Copyright (C) 2013 ITD Systems LLC.
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

// Ensure root object exists
if (typeof Alvex == "undefined" || !Alvex)
{
	var Alvex = {};
}

(function()
{
	/**
	* YUI Library aliases
	*/
	var Dom = YAHOO.util.Dom,
		Event = YAHOO.util.Event,
		KeyListener = YAHOO.util.KeyListener,
		Selector = YAHOO.util.Selector;
	
	var $html = Alfresco.util.encodeHTML;

	/**
	 * Preferences
	 */
	var PREFERENCES_MY_TASKS = "org.alfresco.share.my.tasks";
	var PREFERENCES_MY_TASKS_FILTER = PREFERENCES_MY_TASKS + ".filter";
	var PREFERENCES_MY_TASKS_SORTER = PREFERENCES_MY_TASKS + ".sorter";
	var PREFERENCES_MY_TASKS_COLUMNS = PREFERENCES_MY_TASKS + ".columns";
	var PREFERENCES_MY_TASKS_STYLE = PREFERENCES_MY_TASKS + ".style";

	/**
	* TaskListHeader constructor.
	*
	* @param {String} htmlId The HTML id of the parent element
	* @return {Alvex.TaskListHeader} The new TaskListHeader instance
	* @constructor
	*/
	Alvex.TaskListHeader = function TDH_constructor(htmlId)
	{
		Alvex.TaskListHeader.superclass.constructor.call(this, "Alvex.TaskListHeader", htmlId, ["button"]);
		
		// Services
		this.services.preferences = new Alfresco.service.Preferences();
		
		YAHOO.Bubbling.on("filterChanged", this.onFilterChanged, this);
		YAHOO.Bubbling.on("taskListPreferencesLoaded", this.onTaskListPreferencesLoaded, this);
		
		return this;
	};

	YAHOO.extend(Alvex.TaskListHeader, Alfresco.component.Base,
	{
		onReady: function WLT_onReady()
		{
			this.widgets.configurePageButton = Alfresco.util.createYUIButton(this, "configurePage-button", this.onConfigurePageButtonClick, {});
			
			var dialogId = this.id + '-conf-dialog';
			
			this.widgets.configurePageDialogOk = new YAHOO.widget.Button(dialogId + '-ok',
						{ onclick: { fn: this.onConfigureOk, obj: null, scope: this } });
			this.widgets.configurePageDialogCancel = new YAHOO.widget.Button(dialogId + '-cancel',
						{ onclick: { fn: this.onConfigureCancel, obj: null, scope: this } });
			
			this.widgets.configurePageDialog = Alfresco.util.createYUIPanel(dialogId, { width: "800px" });
			this.widgets.configurePageDialog.hideEvent.subscribe(this.onConfigureCancel, null, this);

			this.createStartWorkflowMenu();
		},
		
		createStartWorkflowMenu: function()
		{
			// Start workflow menu
			var me = this;
			var urlDefs = YAHOO.lang.substitute(
				"{proxy}api/alvex/list-definitions?filter={filter}",
				{
					proxy: Alfresco.constants.PROXY_URI,
					filter: ''
				}
				);

			var urlAllowed = YAHOO.lang.substitute(
				"{proxy}api/alvex/workflow-shortcut/allowed-workflows",
				{
					proxy: Alfresco.constants.PROXY_URI
				}
				);

			Alvex.util.processAjaxQueue({
				queue: [
					{
						url: urlAllowed,
						responseContentType: Alfresco.util.Ajax.JSON,
						successCallback: {
							fn: function(response)
							{
								this.options.allowedWorkflows = response.json.workflows;
							},
							scope: this
						}
					},
					{
						url: urlDefs,
						responseContentType: Alfresco.util.Ajax.JSON,
						successCallback: {
							fn: function(response)
							{
								var menuEl = Dom.get(me.id + '-startWorkflow-button-menu');
								for (var key in response.json.data)  {
									var task = response.json.data[key];
									for (var i in this.options.allowedWorkflows)
										if(this.options.allowedWorkflows[i].name === task.name)
											menuEl.options.add(new Option(task.title, task.name));
								}
								me.widgets.startWorkflowButton = new YAHOO.widget.Button(
									this.id + "-startWorkflow-button",
									{
										type: "menu",
										menu: me.id + '-startWorkflow-button-menu'
									} );
								me.widgets.startWorkflowButton.getMenu().subscribe("click", me.onStartWorkflowClick, null, me)
								Dom.removeClass(Selector.query(".hidden", me.id + "-body", true), "hidden");
							},
							scope: this
						}						
					}
				]
			});
		},

		createDNDArea: function()
		{
			this.widgets.availListEl = Dom.get(this.id + "-conf-dialog-column-ul-0");
			this.widgets.usedListEl = Dom.get(this.id + "-conf-dialog-column-ul-1");
			this.widgets.shadowEl = Dom.get(this.id + "-conf-dialog-dashlet-li-shadow");

			var dndConfig =
			{
				shadow: this.widgets.shadowEl,
				draggables: [
					{
						container: this.widgets.availListEl,
						groups: [Alfresco.util.DragAndDrop.GROUP_MOVE],
						cssClass: "availableDashlet",
					},
					{
						container: this.widgets.usedListEl,
						groups: [Alfresco.util.DragAndDrop.GROUP_MOVE],
						cssClass: "usedDashlet",
					}
				],
				targets: [
					{
						container: this.widgets.availListEl,
						group: Alfresco.util.DragAndDrop.GROUP_MOVE
					},
					{
						container: this.widgets.usedListEl,
						group: Alfresco.util.DragAndDrop.GROUP_MOVE
					}
				]
			};
			var dnd = new Alfresco.util.DragAndDrop(dndConfig);
		},
		
		onStartWorkflowClick: function(ev, obj)
		{
			var workflow = obj[1].value;
			document.location.href = Alfresco.util.siteURL(
					"start-workflow?workflow=" + workflow + "&referrer=tasks&myTasksLinkBack=true");
		},

		onFilterChanged: function BaseFilter_onFilterChanged(layer, args)
		{
			var filter = Alfresco.util.cleanBubblingObject(args[1]);
			Dom.get(this.id + "-subtitle").innerHTML = $html(this.msg("filter." + filter.filterId + (filter.filterData ? "." + filter.filterData : ""), filter.filterData));
		},
		
		onTaskListPreferencesLoaded: function(layer, args)
		{
			this.widgets.availListEl = Dom.get(this.id + "-conf-dialog-column-ul-0");
			this.widgets.usedListEl = Dom.get(this.id + "-conf-dialog-column-ul-1");

			this.widgets.availListEl.innerHTML = '';
			this.widgets.usedListEl.innerHTML = '';
			
			var data = args[1];
			for(var k in data.currentColumns )
			{
				for(var c in data.availableColumns)
				{
					if(data.availableColumns[c].id !== data.currentColumns[k])
						continue;
					var el = this.createColumnDND(data.availableColumns[c]);
					this.widgets.usedListEl.appendChild(el);
				}
			}
			for(var c in data.availableColumns)
			{
				var used = false;
				for(var k in data.currentColumns )
					if(data.availableColumns[c].id === data.currentColumns[k])
						used = true;
				if( !used )
				{
					var el = this.createColumnDND(data.availableColumns[c]);
					this.widgets.availListEl.appendChild(el);
				}
			}
			
			this.createDNDArea();
		},
		
		createColumnDND: function(column)
		{
			var li= document.createElement("li");
			li.className = 'tableColumn';
			var a = document.createElement('a');
			a.href = "#";
			var img = document.createElement('img');
			img.className = "dnd-draggable";
			img.src = Alfresco.constants.URL_CONTEXT + "res/yui/assets/skins/default/transparent.gif";
			img.alt = '';
			var span = document.createElement('span');
			span.innerHTML = column.label;
			var div = document.createElement('div');
			div.className = "dnd-draggable";
			div.title = this.msg("dnd.help.message");
			var hidden = document.createElement('input');
			hidden.type = "hidden";
			hidden.name = "columnid";
			hidden.value = column.id;

			a.appendChild(img);
			li.appendChild(a);
			li.appendChild(span);
			li.appendChild(div);
			li.appendChild(hidden);
			return li;
		},
		
		onConfigurePageButtonClick: function(event, p_obj)
		{
			Event.preventDefault(event);
			var me = this;
			
			if( ! this.widgets.configurePageDialog )
				return;
			
			// Enable esc listener
			if (!this.widgets.configurePageDialogEscapeListener)
			{
				this.widgets.configurePageDialogEscapeListener = new KeyListener(
					this.id + "-conf-dialog",
					{
						keys: KeyListener.KEY.ESCAPE
					},
					{
						fn: function(eventName, keyEvent)
						{
							this.onConfigureCancel();
							Event.stopEvent(keyEvent[1]);
						},
						scope: this,
						correctScope: true
					});
			}
			this.widgets.configurePageDialogEscapeListener.enable();

			// Show the dialog
			this.widgets.configurePageDialog.show();
			Dom.removeClass(this.id + "-conf-dialog", "hidden");
			this.widgets.configurePageDialog.center();
		},

		onConfigureCancel: function(e, p_obj)
		{
			this.widgets.configurePageDialogEscapeListener.disable();
			this.widgets.configurePageDialog.hide();
			if (e) {
				Event.preventDefault(e);
			}
		},
				
		onConfigureOk: function(e, p_obj)
		{
			var result = [];
			
			var ul = Dom.get(this.id + "-conf-dialog-column-ul-1");
			var lis = Dom.getElementsByClassName("tableColumn", "li", ul);
			for (var j = 0; j < lis.length; j++)
			{
				var li = lis[j];
				if(Dom.hasClass(li, "dnd-shadow"))
					continue;
				var id = Selector.query("input[type=hidden][name=columnid]", li, true).value
				result.push(j + '$' + id);
			}
			
			this.services.preferences.set(PREFERENCES_MY_TASKS_COLUMNS, result.join(','), 
				{
					successCallback: {
						fn: this.onPreferencesSaved,
						scope: this
					}
				});
			
			this.widgets.configurePageDialogEscapeListener.disable();
			this.widgets.configurePageDialog.hide();
			if (e) {
				Event.preventDefault(e);
			}
		},
				
		onPreferencesSaved: function()
		{
			YAHOO.Bubbling.fire("taskListPrefsUpdated");
		}
   });

})();
