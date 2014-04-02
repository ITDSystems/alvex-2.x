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
	
	elCell.innerHTML = Alfresco.util.formatDate(
			Alfresco.util.fromISO8601(oData.value), "dd.mm.yyyy"
		);
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
				+ Alfresco.constants.URL_PAGECONTEXT
				+ 'view-metadata?nodeRef=' + data.value + '">';
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