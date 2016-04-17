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


	Alvex.ManageesWorkflowsViewer = function (htmlId)
	{
		Alvex.ManageesWorkflowsViewer.superclass.constructor.call(this, "ManageesWorkflowsViewer", htmlId);
		return this;
	};


	YAHOO.extend(Alvex.ManageesWorkflowsViewer, Alfresco.component.Base,
	{
		options:
		{
			managees: [],
			hiddenTaskTypes: [],
			maxItems: 50,
			compactMode: false
		},


		onReady: function ManageesWorkflowsViewer_onReady()
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
								+ '<div id="' + this.id + '-workflows-' + m + '" class="workflows" style="margin: 0">'
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


		createTasksDataTable: function ManageesWorkflowsViewer_createTasksDataTable(m)
		{
			// Width of dataTable columns
			var w1, w2;

			if(this.options.compactMode) { //switch between 2 modes
				w1 = 24; // width of icon in compact
				w2 = 80; // width of half visible column
			} else {
				w1 = 40;  // width of icon in full mode
				w2 = 200; // ....
			}

			this.widgets.pagingDataTable[m] = new Alfresco.util.DataTable(
			{
				dataTable:
				{
					container: this.id + "-workflows-" + m,
					columnDefinitions:
					[
						{ key: "id", sortable: false, formatter: this.bind(this.renderCellIcons), width: w1},
						{ key: "title", sortable: false, formatter: this.bind(this.renderCellTaskInfo)},
                        { key: "name", sortable: false, formatter: this.bind(this.renderCellActions), width: w2}
					],
					config:
					{
						MSG_EMPTY: this.msg("message.noWorkflows")
					}
				},
				dataSource: {
					url: Alfresco.constants.PROXY_URI + "api/workflow-instances?"
							+ "initiator=" + this.options.managees[m].userName

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
         * DONE
		* Priority icon custom datacell formatter
		*
		* @method TL_renderCellIcons
		* @param elCell {object}
		* @param oRecord {object}
		* @param oColumn {object}
		* @param oData {object|string}
		*/

		renderCellIcons: function WL_renderCellIcons(elCell, oRecord, oColumn, oData)
		{
			var priority = oRecord.getData("priority"),
				priorityMap = { "1": "high", "2": "medium", "3": "low" },
				priorityKey = priorityMap[priority + ""];

			var desc = '<img src="' + Alfresco.constants.URL_RESCONTEXT + 'components/images/priority-' + priorityKey
					+ '-16.png" title="' + this.msg("label.priority", this.msg("priority." + priorityKey)) + '"/>';

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
		renderCellTaskInfo: function WL_renderCellTaskInfo(elCell, oRecord, oColumn, oData)
		{
			var workflowId = oRecord.getData("id"),
				message = $html(oRecord.getData("message")), //main name for workflow
                dueDateStr = oRecord.getData("dueDate"),
                dueDate = dueDateStr ? Alfresco.util.fromISO8601(dueDateStr) : null,
                title = $html(oRecord.getData("title")),
				type = $html(oRecord.getData("title")),

                description = $html(oRecord.getData("description"));
			var info = '<h3 style="padding-top: 4px"><a href="' + $siteURL('workflow-details?workflowId=' + workflowId )
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

				info += '<div class="type"><label>' + this.msg("label.type", type) + ':</label>'
						+ '<span>' + type + '</span></div>';

                    info += '<div class="type"><label>' + this.msg("label.description", description) + ':</label>'
                    + '<span>' + description + '</span></div>';

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
		renderCellActions: function WL_renderCellActions(elCell, oRecord, oColumn, oData)
		{
			var info = '';

			if(this.options.compactMode)
			{
				info += '<a href="' + $siteURL('workflow-details?workflowId=' + oRecord.getData('id'))
						+ '" class="workflow-view-link" title="' + this.msg("link.viewWorkflow") + '">&nbsp;</a>';

			}
			else
			{
				info += '<div class="workflow-view-link"><a href="' + $siteURL('workflow-details?workflowId='
					+ oRecord.getData('id')) + '" class="theme-color-1" title="' + this.msg("link.viewWorkflow") + '">'
					+ this.msg("link.viewWorkflow") + '</a></div>';
			}

			elCell.innerHTML = info;
		},

		manageesSortAndUnique: function WL_manageesSortAndUnique(managees)
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
