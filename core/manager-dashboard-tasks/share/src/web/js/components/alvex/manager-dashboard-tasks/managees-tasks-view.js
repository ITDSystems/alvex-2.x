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
	/**
	* YUI Library aliases
	*/
	var Dom = YAHOO.util.Dom,
		Event = YAHOO.util.Event;

	/**
	* Alfresco Slingshot aliases
	*/
	var $html = Alfresco.util.encodeHTML,
		$siteURL = Alfresco.util.siteURL;


	Alvex.ManageesTasksViewer = function(htmlId)
	{
		Alvex.ManageesTasksViewer.superclass.constructor.call(this, "ManageesTasksViewer", htmlId);
		return this;
	};


	YAHOO.extend(Alvex.ManageesTasksViewer, Alfresco.component.Base,
	{
		options:
		{
			managees: [],
			hiddenTaskTypes: [],
			maxItems: 50,
			compactMode: false
		},


		onReady: function ManageesTasksViewer_onReady()
		{
			Alfresco.util.Ajax.request(
			{
				url: Alfresco.constants.PROXY_URI + "api/alvex/orgchart/user/" 
						+ encodeURIComponent(Alfresco.constants.USERNAME) + "/managees",
				successCallback:
				{
					fn: function(resp)
					{
						for(var u in resp.json.managees)
							if(resp.json.managees[u].userName != Alfresco.constants.USERNAME)
								this.options.managees.push(resp.json.managees[u]);

						this.options.managees = this.manageesSortAndUnique( this.options.managees );

						this.widgets.pagingDataTable = [];

						for(var m in this.options.managees)
						{
							document.getElementById(this.id + "-body").innerHTML += 
								'<div id="' + this.id + '-user-' + m + '">' 
								+ '<div class="yui-ge task-list-bar flat-button" ' 
								+ 'style="width:100%; background-color: #eeeeee; margin: 0;">' 
								+ '<div class="yui-u first"><h2 id="' + this.id + '-title-' + m 
								+ '" class="thin"><a href="' + Alfresco.constants.URL_PAGECONTEXT 
								+ 'user/' + this.options.managees[m].userName + '/profile">' 
								+ this.options.managees[m].name + '</a></h2></div><div class="yui-u"><div id="' 
								+ this.id + '-paginator-' + m + '" class="paginator">&nbsp;</div></div></div>' 
								+ '<div id="' + this.id + '-tasks-' + m + '" class="tasks" style="margin: 0">' 
								+ '</div></div>';
							YAHOO.util.Event.onContentReady(this.id + '-user-' + m,
										this.createTasksDataTable, m, this);
						}
					},
					scope: this
				},
				failureMessage: "Can not get managees"
			});
		},


		createTasksDataTable: function ManageesTasksViewer_createTasksDataTable(m)
		{
			// Width of dataTable columns
			var w1, w2;

			if(this.options.compactMode) {
				w1 = 24;
				w2 = 80;
			} else {
				w1 = 40;
				w2 = 200;
			}

			this.widgets.pagingDataTable[m] = new Alfresco.util.DataTable(
			{
				dataTable:
				{
					container: this.id + "-tasks-" + m,
					columnDefinitions:
					[
						{ key: "id", sortable: false, formatter: this.bind(this.renderCellIcons), width: w1},
						{ key: "title", sortable: false, formatter: this.bind(this.renderCellTaskInfo)},
						{ key: "name", sortable: false, formatter: this.bind(this.renderCellActions), width: w2}
					],
					config:
					{
						MSG_EMPTY: this.msg("message.noTasks")
					}
				},
				dataSource:
				{
					url: Alfresco.constants.PROXY_URI + "api/alvex/task-instances?" 
							+ "authority=" + this.options.managees[m].userName
							+ "&properties=bpm_priority,bpm_status,bpm_dueDate,bpm_description"
							+ "&exclude=" + this.options.hiddenTaskTypes.join(",")
							+ "&state=IN_PROGRESS"
				},
				paginator:
				{
					config:
					{
						containers: [this.id + "-paginator-" + m],
						rowsPerPage: this.options.maxItems
					}
				}
			});
		},


		/**
		* Priority & pooled icons custom datacell formatter
		*
		* @method TL_renderCellIcons
		* @param elCell {object}
		* @param oRecord {object}
		* @param oColumn {object}
		* @param oData {object|string}
		*/
		renderCellIcons: function TL_renderCellIcons(elCell, oRecord, oColumn, oData)
		{
			var priority = oRecord.getData("properties")["bpm_priority"],
				priorityMap = { "1": "high", "2": "medium", "3": "low" },
				priorityKey = priorityMap[priority + ""],
				pooledTask = oRecord.getData("isPooled");

			var desc = '<img src="' + Alfresco.constants.URL_RESCONTEXT + 'components/images/priority-' + priorityKey 
					+ '-16.png" title="' + this.msg("label.priority", this.msg("priority." + priorityKey)) + '"/>';
			if (pooledTask)
			{
				desc += '<br/><img src="' + Alfresco.constants.URL_RESCONTEXT 
					+ 'components/images/pooled-task-16.png" title="' + this.msg("label.pooledTask") + '"/>';
			}
			elCell.innerHTML = desc;
		},


		/**
		* Task info custom datacell formatter
		*
		* @method TL_renderCellTaskInfo
		* @param elCell {object}
		* @param oRecord {object}
		* @param oColumn {object}
		* @param oData {object|string}
		*/
		renderCellTaskInfo: function TL_renderCellTaskInfo(elCell, oRecord, oColumn, oData)
		{
			var taskId = oRecord.getData("id"),
				message = $html(oRecord.getData("properties")["bpm_description"]),
				dueDateStr = oRecord.getData("properties")["bpm_dueDate"],
				dueDate = dueDateStr ? Alfresco.util.fromISO8601(dueDateStr) : null,
				type = $html(oRecord.getData("title")),
				status = $html(oRecord.getData("properties")["bpm_status"]),
				assignee = oRecord.getData("owner");

			// if there is a property label available for the status use that instead
			var data = oRecord.getData();
			if (data.propertyLabels && Alfresco.util.isValueSet(data.propertyLabels["bpm_status"], false))
				status = data.propertyLabels["bpm_status"];

			// if message is the same as the task type show the <no message> label
			if (message == type)
				message = this.msg("workflow.no_message");

			var info = '<h3 style="padding-top: 4px"><a href="' + $siteURL('task-details?taskId=' + taskId ) 
					+ '" class="theme-color-1" title="' 
					+ this.msg("link.viewTask") + '">' + message + '</a></h3>';

			if(this.options.compactMode)
			{
				info += '<div style="margin: 0; padding-bottom: 4 px;"><strong style="color: #515D6B">' 
					+ this.msg("label.due") + ':</strong> ' 
					+ (dueDate ? Alfresco.util.formatDate(dueDate, "longDate") : this.msg("label.none")) + '<br/>';

				info += '<strong style="color: #515D6B">' 
					+ this.msg("label.type", type) + ':</strong> ' + type + '</div>';
			}
			else
			{
				info += '<div class="due"><label>' + this.msg("label.due") + ':</label><span>' 
						+ (dueDate ? Alfresco.util.formatDate(dueDate, "longDate") : this.msg("label.none")) 
							+ '</span></div>';

				info += '<div class="status"><label>' + this.msg("label.status") + ':</label>' 
						+ '<span>' + status + '</span></div>';

				info += '<div class="type"><label>' + this.msg("label.type", type) + ':</label>' 
						+ '<span>' + type + '</span></div>';

				if (!assignee || !assignee.userName)
					info += '<div class="unassigned"><span class="theme-bg-color-5 theme-color-5 unassigned-task">' 
						+ this.msg("label.unassignedTask") + '</span></div>';
			}

			elCell.innerHTML = info;
		},


		/**
		* Actions custom datacell formatter
		*
		* @method TL_renderCellSelected
		* @param elCell {object}
		* @param oRecord {object}
		* @param oColumn {object}
		* @param oData {object|string}
		*/
		renderCellActions: function TL_renderCellActions(elCell, oRecord, oColumn, oData)
		{
			var info = '';

			if(this.options.compactMode)
			{
				info += '<a href="' + $siteURL('task-details?taskId=' + oRecord.getData('id') + '&referrer=tasks') 
						+ '" class="task-view-link" title="' + this.msg("link.viewTask") + '">&nbsp;</a>';

				info += '<a href="' + $siteURL('workflow-details?workflowId=' + oRecord.getData('workflowInstance').id 
						+ '&referrer=workflows') 
						+ '" class="workflow-view-link" title="' + this.msg("link.viewWorkflow") + '">&nbsp;</a>';
			}
			else
			{
				info += '<div class="task-view-link"><a href="' + $siteURL('task-details?taskId=' + oRecord.getData('id')
					+ '&referrer=tasks') + '" class="theme-color-1" title="' + this.msg("link.viewTask") + '">' 
					+ this.msg("link.viewTask") + '</a></div>';

				info += '<div class="workflow-view-link"><a href="' + $siteURL('workflow-details?workflowId=' 
					+ oRecord.getData('workflowInstance').id + '&' + 'taskId=' + oRecord.getData('id')
					+ '&referrer=tasks') + '" class="theme-color-1" title="' + this.msg("link.viewWorkflow") + '">' 
					+ this.msg("link.viewWorkflow") + '</a></div>';
			}

			elCell.innerHTML = info;
		},

		manageesSortAndUnique: function TL_manageesSortAndUnique(managees)
		{
			if(managees.length == 0)
				return;

			managees.sort(
				function(a,b)
				{
					var nameA=a.name.toLowerCase();
					var nameB=b.name.toLowerCase();
					if (nameA < nameB) //sort string ascending
						return -1;
					if (nameA > nameB)
						return 1;
					return 0;
				});

			var ret = [managees[0]];
			for (var i = 1; i < managees.length; i++)
				if (managees[i-1].userName !== managees[i].userName)
					ret.push(managees[i]);
			return ret;
		}
	});
})();
