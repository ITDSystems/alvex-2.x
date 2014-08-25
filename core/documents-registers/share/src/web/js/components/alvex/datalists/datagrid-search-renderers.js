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
if (typeof Alvex === "undefined" || !Alvex)
{
	var Alvex = {};
}

Alvex.DatagridEmptySearchRenderer = function (searchFieldHtmlId, key, curValue, availableOptions)
{
	YAHOO.util.Dom.get(searchFieldHtmlId + "-c").innerHTML = "";
};

Alvex.DatagridTextSearchRenderer = function (searchFieldHtmlId, key, curValue, availableOptions)
{
	YAHOO.util.Dom.get(searchFieldHtmlId + "-c").innerHTML = 
			'<span><input type="text" name="' + key + '" id="' + searchFieldHtmlId + '" style="width:95%;" ' 
			+ 'value="' + Alfresco.util.encodeHTML(curValue.replace('\\"','"')) + '"/></span>';
};

Alvex.DatagridSelectSearchRenderer = function (searchFieldHtmlId, key, curValue, availableOptions)
{
	var html = '<select name="' + key + '" id="' + searchFieldHtmlId + '" style="width:95%;">';
	html += '<option></option>';
	for( var o in availableOptions )
	{
		var option = availableOptions[o];
		html += '<option ';
		if( option.value === curValue )
			html += "selected";
		html += ' value="' + option.value + '">' + option.label + '</option>';
	}
	html += '</select></span>';
	YAHOO.util.Dom.get(searchFieldHtmlId + "-c").innerHTML =  html;
};

Alvex.DatagridDateRangeSearchRenderer = function (searchFieldHtmlId, key, curValue, availableOptions)
{
	// Inject basic layout
	var html = '<div><input type="hidden" name="' + key + '" id="' + searchFieldHtmlId + '" value="' + curValue + '"/>' 
			+ '<div id="' + searchFieldHtmlId + '-btn" style="float:left;"></div>'
			+ '<div id="' + searchFieldHtmlId + '-value"></div>'
			+ '<div id="' + searchFieldHtmlId + '-overlay" style="visibility:hidden"></div>'
			+ '</div>';
	YAHOO.util.Dom.get(searchFieldHtmlId + "-c").innerHTML =  html;
	
	// Show current value in UI
	var minVal = '';
	var maxVal = '';
	var minDate = null;
	var maxDate = null;
	if( curValue && curValue !== '' )
	{
		var uiString = '';
		minVal = curValue.replace(/\[/, '').replace(/ TO.*/,'').replace(/T.*/,'').split('\\-');
		if( minVal[0] !== "MIN" ) {
			minDate = new Date(minVal);
			uiString += minDate.getDate() + '.' + (minDate.getMonth() + 1) 
						+ '.' + minDate.getFullYear() + ' - ';
		} else {
			minDate = "MIN";
			uiString += '... - ';
		}
		
		maxVal = curValue.replace(/.*TO /, '').replace(/T.*/,'').replace(/\]/, '').split('\\-');
		if( maxVal[0] !== "MAX" ) {
			maxDate = new Date(maxVal);
			uiString += maxDate.getDate() + '.' + (maxDate.getMonth() + 1) 
						+ '.' + maxDate.getFullYear();
		} else {
			maxDate = "MAX";
			uiString += '...';
		}
		
		var el = Dom.get( searchFieldHtmlId + '-value' );
		el.innerHTML = uiString;
	}
	
	// Create overlay
	
	var overlay = new YAHOO.widget.Overlay(searchFieldHtmlId + '-overlay', { visible: false });
	var calButton = new YAHOO.widget.Button({  
		type: "menu",  
		id: searchFieldHtmlId + '-btn-btn',  
		label: '<span class="search-cal-button"></span>',  
		menu: overlay,
		container: searchFieldHtmlId + '-btn' }); 
	
	Dom.addClass(searchFieldHtmlId + '-btn', 'search-cal-button');

	calButton.on("appendTo", function (ev, data)
			{ 
				var contId = searchFieldHtmlId + '-cal-container';
				data.overlay.setBody('  '); 
				data.overlay.body.id = contId;
			}, {overlay:overlay, key:key} );
	
	// Add click listener
	var onCalButtonClick = function(ev, data)
		{
			var button = this;

			var oCalendar = new YAHOO.thirdparty.IntervalCalendar("buttoncalendar", data.overlay.body.id, { 
				navigator: true,
				minText: data.minText,
				maxText: data.maxText,
				okText: data.okText,
				cancelText: data.cancelText
			} );
			Alfresco.util.calI18nParams(oCalendar);

			if( (data.minDate !== null) && (data.maxDate !== null) )
				oCalendar.setInterval( data.minDate, data.maxDate );

			oCalendar.render();

			oCalendar.selectEvent.subscribe(function (ev, args, data)
			{
				if( !data.cal.submit )
					return;
				var interval = data.cal.getInterval();
				data.overlay.hide();

				if( interval.length !== 2 )
				{
					Dom.get(data.id).value = '';
				}
				else
				{
					var minVal = (interval[0] === "MIN") ? "MIN" 
									: interval[0].getFullYear() + '\\-' + (interval[0].getMonth()+1) + '\\-' + interval[0].getDate() + 'T00:00:00';
					var maxVal = (interval[1] === "MAX") ? "MAX" 
									: interval[1].getFullYear() + '\\-' + (interval[1].getMonth()+1) + '\\-' + interval[1].getDate() + 'T23:59:59';
					Dom.get(data.id).value = '[' + minVal + ' TO ' + maxVal + ']';
					Dom.get(data.id).onchange.call();
				}

				//var form = document.forms[data.formId];
				//Alfresco.util.submitForm( form );

			}, {cal: oCalendar, overlay: data.overlay, button: button, id: data.id/*, formId: data.formId*/} );

			data.overlay.align();
			this.unsubscribe("click", data.scope.onCalButtonClick); 
		};
	
	var me = this;
	calButton.on("click", onCalButtonClick, 
			{
				scope: me,
				overlay: overlay, 
				id: searchFieldHtmlId, 
				//formId: this.id + "-search-form",
				minDate: minDate, 
				maxDate: maxDate, 
				minText: this.msg("button.min"),
				maxText: this.msg("button.max"),
				okText: this.msg("button.ok"),
				cancelText: this.msg("button.clear") 
			} );
};
