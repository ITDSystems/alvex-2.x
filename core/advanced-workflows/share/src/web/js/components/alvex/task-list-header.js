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
			this.widgets.startWorkflowButton = Alfresco.util.createYUIButton(this, "startWorkflow-button", this.onStartWorkflowButtonClick, {});
			this.widgets.configurePageButton = Alfresco.util.createYUIButton(this, "configurePage-button", this.onConfigurePageButtonClick, {});
			Dom.removeClass(Selector.query(".hidden", this.id + "-body", true), "hidden");
			
			var dialogId = this.id + '-conf-dialog';
			
			this.widgets.configurePageDialogOk = new YAHOO.widget.Button(dialogId + '-ok',
						{ onclick: { fn: this.onConfigureOk, obj: null, scope: this } });
			this.widgets.configurePageDialogCancel = new YAHOO.widget.Button(dialogId + '-cancel',
						{ onclick: { fn: this.onConfigureCancel, obj: null, scope: this } });
			
			this.widgets.configurePageDialog = Alfresco.util.createYUIPanel(dialogId, { width: "540px" });
			this.widgets.configurePageDialog.hideEvent.subscribe(this.onConfigureCancel, null, this);
		},

		onFilterChanged: function BaseFilter_onFilterChanged(layer, args)
		{
			var filter = Alfresco.util.cleanBubblingObject(args[1]);
			Dom.get(this.id + "-subtitle").innerHTML = $html(this.msg("filter." + filter.filterId + (filter.filterData ? "." + filter.filterData : ""), filter.filterData));
		},
		
		onTaskListPreferencesLoaded: function(layer, args)
		{
			var contId = this.id + '-conf-dialog-container';
			var cont = Dom.get( contId );
			cont.innerHTML = '';
			var data = args[1];
			for(var c in data.availableColumns)
			{
				// create the necessary elements
				var label= document.createElement("div");
				label.className = 'column-config-container';
				var description = document.createElement('span');
				description.className = 'column-config-label';
				description.innerHTML = data.availableColumns[c].label;
				var checkbox = document.createElement("input");
				checkbox.type = "checkbox";
				checkbox.value = data.availableColumns[c].id;
				checkbox.className = 'column-config-checkbox';
				for(var k in data.currentColumns )
					if(data.availableColumns[c].id === data.currentColumns[k])
						checkbox.checked = true;
				label.appendChild(checkbox);
				label.appendChild(description);
				cont.appendChild(label);
			}
		},

		onStartWorkflowButtonClick: function WLT_onNewFolder(e, p_obj)
		{
			document.location.href = Alfresco.util.siteURL("start-workflow?referrer=tasks&myTasksLinkBack=true");
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
			var fields = Selector.query(".column-config-checkbox", this.id + '-conf-dialog-container');
			var result = [];
			for( var f in fields )
				if( fields[f].checked )
					result.push(fields[f].value);
			
			this.services.preferences.set(PREFERENCES_MY_TASKS_COLUMNS, result.join(','));
			
			this.widgets.configurePageDialogEscapeListener.disable();
			this.widgets.configurePageDialog.hide();
			if (e) {
				Event.preventDefault(e);
			}
		}
   });

})();
