/**
 * Copyright (C) 2014 ITD Systems LLC.
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

Alvex.DatagridTextRenderer = function (elCell, oRecord, oColumn, oData)
{
	oData = oRecord.getData("itemData")[oColumn.field];
	if( !oData )
		return;
	
	elCell.innerHTML = Alfresco.util.activateLinks(
			Alfresco.util.encodeHTML(oData.displayValue)
		);
};

Alvex.DatagridDateRenderer = function (elCell, oRecord, oColumn, oData)
{
	oData = oRecord.getData("itemData")[oColumn.field];
	if( !oData )
		return;
	
	var dg = Alfresco.util.ComponentManager.findFirst("Alvex.DataGrid");
	// Commented out since it causes TZ issues - see ALV-847 for details
	//var date = Alfresco.util.fromISO8601(oData.displayValue);
	//elCell.innerHTML = ( date !== null ?
	//		Alfresco.util.formatDate(date, "dd.mm.yyyy") : dg.msg("label.none") );
	// WA: parse date from format 2012-10-08T00:00:00.000+04:00 manually
	var datePart = oData.displayValue.replace(/T.*/, "");
	var parts = datePart.split("-");
	elCell.innerHTML = parts[2] + "." + parts[1] + "." + parts[0];
};

Alvex.DatagridBoolRenderer = function (elCell, oRecord, oColumn, oData)
{
	oData = oRecord.getData("itemData")[oColumn.field];
	if( !oData )
		return;
	
	if(oData.value)
		elCell.innerHTML = Alfresco.util.message("label.yes");
	else
        elCell.innerHTML = Alfresco.util.message("label.no");
};

Alvex.DatagridPersonRenderer = function (elCell, oRecord, oColumn, oData)
{
	oData = oRecord.getData("itemData")[oColumn.field];
	if( !oData )
		return;
	oData = YAHOO.lang.isArray(oData) ? oData : [oData];
	
	var html = '';
	for (var i = 0, ii = oData.length, data; i < ii; i++)
	{
		data = oData[i];
		html += '<span class="person">' 
					+ Alfresco.util.userProfileLink(data.metadata, data.displayValue) 
					+ '</span>';
		if (i < ii - 1)
		{
			html += "<br />";
		}
	}
	elCell.innerHTML = html;
};

Alvex.DatagridAssocRenderer = function (elCell, oRecord, oColumn, oData)
{
	oData = oRecord.getData("itemData")[oColumn.field];
	if( !oData )
		return;
	oData = YAHOO.lang.isArray(oData) ? oData : [oData];
	
	var html = '';
	for (var i = 0, ii = oData.length, data; i < ii; i++)
	{
		data = oData[i];
		html += '<a href="' 
				+ Alfresco.util.siteURL((data.metadata == "container" ? 'folder' : 'document') 
				+ '-details?nodeRef=' + data.value) + '">';
		html += '<img src="' + Alfresco.constants.URL_RESCONTEXT + 'components/images/filetypes/' 
				+ Alfresco.util.getFileIcon(data.displayValue, (data.metadata == "container" ? 'cm:folder' : null), 16) 
				+ '" width="16" alt="' + Alfresco.util.encodeHTML(data.displayValue) + '" title="' 
				+ Alfresco.util.encodeHTML(data.displayValue) + '" />';
		html += ' ' + Alfresco.util.encodeHTML(data.displayValue) + '</a>'
		if (i < ii - 1)
		{
			html += "<br />";
		}
	}
	elCell.innerHTML = html;
};

Alvex.DatagridRecordRenderer = function (elCell, oRecord, oColumn, oData)
{
	oData = oRecord.getData("itemData")[oColumn.field];
	if( !oData )
		return;
	oData = YAHOO.lang.isArray(oData) ? oData : [oData];
	
	var html = '';
	for (var i = 0, ii = oData.length, data; i < ii; i++)
	{
		data = oData[i];
		html += '<a href="' 
				+ Alfresco.util.siteURL('view-metadata?nodeRef=' + data.value) + '">';
		html += '<img src="' + Alfresco.constants.URL_RESCONTEXT + 'components/images/filetypes/' 
				+ 'generic-file-16.png' 
				+ '" width="16" alt="' + Alfresco.util.encodeHTML(data.displayValue) + '" title="' 
				+ Alfresco.util.encodeHTML(data.displayValue) + '" />';
		html += ' ' + Alfresco.util.encodeHTML(data.displayValue) + '</a>'
		if (i < ii - 1)
		{
			html += "<br />";
		}
	}
	elCell.innerHTML = html;
};

Alvex.DatagridTaskDescRenderer = function (elCell, oRecord, oColumn, oData)
{
	var dg = Alfresco.util.ComponentManager.findFirst("Alvex.DataGrid");
	var data = oRecord.getData();
	var taskId = data.id;
	var type = Alfresco.util.encodeHTML(data.title);
	oData = oRecord.getData("itemData")[oColumn.field];

	var message;
	if (oData.value === type)
		message = dg.msg("workflow.no_message");
	else
		message = oData.displayValue;
	
	var due = oRecord.getData("itemData")["prop_bpm_dueDate"];
	var dueDate = (due ? Alfresco.util.fromISO8601( due.value ) : null );
	var overdue = (dueDate !== null && dueDate.getTime() < (new Date()).getTime());

	var href;
	if (oRecord.getData('isEditable'))
		href = Alfresco.util.siteURL('task-edit?taskId=' + taskId + '&referrer=tasks&myTasksLinkBack=true');
	else
		href = Alfresco.util.siteURL('task-details?taskId=' + taskId + '&referrer=tasks&myTasksLinkBack=true');

	var info = '<h3' + (overdue ? ' class="task-delayed" title="' + dg.msg("status.overdue") + '"' : '') + '>' 
			+ '<a href="' + href + '">' + message + '</a></h3>';
	elCell.innerHTML = info;
};

Alvex.DatagridTaskPrioRenderer = function (elCell, oRecord, oColumn, oData)
{
	oData = oRecord.getData("itemData")[oColumn.field];
	if( !oData )
		return;
	
	var priorityMap = {"1": "high", "2": "medium", "3": "low"};
	var	priorityKey = priorityMap[oData.value + ""];
	var dg = Alfresco.util.ComponentManager.findFirst("Alvex.DataGrid");
	
	var desc = '<div class="cell-centered cell-spaced">' 
			+ '<img src="' + Alfresco.constants.URL_RESCONTEXT 
			+ 'components/images/priority-' + priorityKey + '-16.png" ' + 'title="' 
			+ dg.msg("label.priority", dg.msg("priority." + priorityKey)) + '"/></div>';
	elCell.innerHTML = desc;
};

Alvex.DatagridTaskStateRenderer = function(elCell, oRecord, oColumn, oData)
{
	var dg = Alfresco.util.ComponentManager.findFirst("Alvex.DataGrid");
	var record = oRecord.getData();
	var msgId, imgSrc;
	if( !record.isWorkflowActive ) {
		msgId = "label.completedWorkflow";
		imgSrc = Alfresco.constants.URL_RESCONTEXT + "components/images/completed-16.png";
	} else {
		if( record.taskState === "IN_PROGRESS" ) {
			msgId = "label.activeTask";
			imgSrc = Alfresco.constants.URL_RESCONTEXT + "components/images/to-do-16.png";
		} else {
			msgId = "label.completedTaskActiveWorkflow";
			imgSrc = Alfresco.constants.URL_RESCONTEXT + "components/images/pending-16.png";
		}
	}
	elCell.innerHTML = '<span title="' + dg.msg( msgId ) + '"><img src="' + imgSrc + '"/></span>';
};
