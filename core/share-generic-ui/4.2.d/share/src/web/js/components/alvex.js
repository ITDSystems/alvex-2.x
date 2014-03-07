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

if (typeof Alvex == 'undefined' || !Alvex)
{
	var Alvex = {};
}

Alvex.util = Alvex.util || {};

Alvex.util.Ajax = Alvex.util.Ajax || {};

/*
 * Sequentially sends Ajax queries
 */
Alvex.util.processAjaxQueue = function (config)
{
	// check if there are more queries to process in queue
	if (config.queue.length == 0)
	{
		var clb = config.doneCallback;
		if (clb && clb.fn)
			(clb.fn).call(clb.scope, clb.obj);
		return;
	}
	var request = config.queue[0];
	var req =
	{
		url: request.url,
		method: request.method || Alfresco.util.Ajax.GET,
		dataObj: request.dataObj,
		config: config,
		successCallback:
		{
			fn: function (param)
			{
				// call user defined function
				var clb = param.config.config.queue[0].successCallback;
				if (clb && clb.fn)
					(clb.fn).call(clb.scope, param, clb.obj);
				// remove request from the queue
				param.config.config.queue.splice(0,1);
				// process next request in queue
				Alvex.util.processAjaxQueue(param.config.config);
			}
		},
		failureCallback:
		{
			fn: function (param)
			{
				// call user defined function
				var clb = param.config.config.queue[0].failureCallback;
				if (clb)
					(clb.fn).call(clb.scope, param.config.config, clb.obj);
			}
		}
	};
	if (request.requestContentType)
		req.requestContentType = request.requestContentType;
	Alfresco.util.Ajax.request(req);
};

// Just format UTCDateString from YYYY-MM-DD-HH-mm to the form we like (and to local TZ)
Alvex.util.niceDateTimeString = function RelWf_getNiceDateTimeString( UTCDateString )
{
	var tokens = UTCDateString.split('-');
	var cur_date = new Date(Date.UTC(tokens[0],tokens[1],tokens[2],tokens[3],tokens[4]));

	var year = cur_date.getFullYear();

	var month = cur_date.getMonth() + 1;
	if(month < 10) {
		month = "0" + month;
	}

	var day = cur_date.getDate();
	if(day < 10) {
		day = "0" + day;
	}

	/*var hours = cur_date.getHours();
	if(hours < 10) { hours = "0" + hours; }

	var mins = cur_date.getMinutes();
	if(mins < 10) { mins = "0" + mins; }*/

	//return day + '.' + month + '.' + year + ' ' + hours + ':' + mins;
	return day + '.' + month + '.' + year;
};

Alvex.util.getElementsByTagNameNS = function Alvex_getElementsByTagNameNS(xml, namespace, prefix, tag)
{
	return xml.getElementsByTagNameNS 
				? xml.getElementsByTagNameNS(namespace, tag) 
				: xml.getElementsByTagName(prefix + ':' + tag);
};

Alvex.util.getElementText = function Alvex_getElementText(node)
{
	if( !node ) { return ''; }
	return node.textContent || node.innerText || node.text;
};

Alvex.util.getFormElement = function Alvex_getFormElement(id)
{
	var el = YAHOO.util.Dom.get(id);
	while (el && el.tagName != 'FORM')
		el = el.parentNode;
	return el;
};

Alvex.util.isInRelatedWorkflowForm = function Alvex_isInRelatedWorkflowForm(id)
{
	// TODO Is this check enough?
	var form = Alvex.util.getFormElement(id);
	// It happens if we are on workflow details page - there is not form in this case
	if( !form )
		return false;
	var idMatches = (form.id.match('(prop_alvexrwf_relatedWorkflows|prop_itdrwf_relatedWorkflows)') != null);
	var urlMatches = (form.action.match('alfresco/api/workflow') != null);
	if(idMatches && urlMatches)
		return true;
	else
		return false;
};

Alvex.util.diffArrays = function Alvex_diffArrays(a1, a2)
{
	var res = [];
	for(var i = 0; i < a1.length; i++)
	{
		var uniq = true;
		for(var j = 0; j < a2.length; j++)
			if(a1[i] == a2[j])
				uniq = false
		if(uniq)
			res.push(a1[i])
	}
	return res;
};

Alvex.util.createClearNodeName = function Alvex_createClearNodeName(name)
{
	return name.replace(/([\"\*\\\>\<\?\/\:\|]+)/g, ' ');
}

Alvex.util.getSiteDisplayName = function Alvex_getSiteDisplayName()
{
	var el = YAHOO.util.Selector.query(".alf-menu-title-text")[0];
	return el.innerHTML;
};

Alvex.util.getFunctionByName = function Alvex_getFunctionByName(functionName)
{
	if( !functionName )
		return null;
	
	var context = window;
	var namespaces = functionName.split(".");
	var func = namespaces.pop();
	for(var i = 0; i < namespaces.length; i++) 
	{
		context = context[namespaces[i]];
		if( !context )
			return null;
	}
	return context[func];
};