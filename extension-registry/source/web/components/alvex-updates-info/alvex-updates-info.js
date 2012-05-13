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
if (typeof ITD == "undefined" || !ITD)
{
	var ITD = {};
}

(function()
{
	var Dom = YAHOO.util.Dom,
		Event = YAHOO.util.Event,
		Element = YAHOO.util.Element;

	var $html = Alfresco.util.encodeHTML,
		$hasEventInterest = Alfresco.util.hasEventInterest; 

	ITD.AlvexUpdatesInfo = function(htmlId)
	{
		this.name = "ITD.AlvexUpdatesInfo";
		ITD.AlvexUpdatesInfo.superclass.constructor.call(this, htmlId);

		Alfresco.util.ComponentManager.register(this);

		Alfresco.util.YUILoaderHelper.require(["button", "container", "datasource", "datatable", "json", "history"], 
												this.onComponentsLoaded, this);

		var parent = this;

		this.cur_group = '';

		PanelHandler = function PanelHandler_constructor()
		{
			PanelHandler.superclass.constructor.call(this, "main");
		};
		YAHOO.extend(PanelHandler, Alfresco.ConsolePanelHandler,
		{
			onLoad: function onLoad()
			{
				// DataSource setup
				var dataSource = new YAHOO.util.DataSource();

				var columnDefinitions =
				[
					{ key: "component", label: parent.msg("aui.label.component"), sortable: true, width: 200 },
					{ key: "curVer", label: parent.msg("aui.label.curVer"), sortable: true, width: 100 },
					{ key: "latestVer", label: parent.msg("aui.label.latestVer"), sortable: true, width: 100 },
					{ key: "isOk", label: parent.msg("aui.label.isOk"), sortable: true, width: 100 },
					{ key: "comment", label: parent.msg("aui.label.comment"), sortable: true, width: 200 }
				];

				// DataTable definition
				parent.widgets.dataTable = new YAHOO.widget.DataTable(
							parent.id + "-datatable", columnDefinitions, dataSource,
				{
					sortedBy:
					{
						key: "component",
						dir: "asc"
					},
					MSG_EMPTY: parent.msg("aui.message.no_updates_info")
				});

				var show_help = true;

				// Fill with data
				for(var u in parent.options.updatesInfo)
				{
					parent.options.updatesInfo[u].id 
						= unescape(parent.options.updatesInfo[u].id).replace(/[\n\r\t\s]/gm,'');
					parent.options.updatesInfo[u].repoVersion 
						= unescape(parent.options.updatesInfo[u].repoVersion).replace(/[\n\r\t\s]/gm,'');
					parent.options.updatesInfo[u].shareVersion 
						= unescape(parent.options.updatesInfo[u].shareVersion).replace(/[\n\r\t\s]/gm,'');
					parent.options.updatesInfo[u].repoLatestVersion 
						= unescape(parent.options.updatesInfo[u].repoLatestVersion).replace(/[\n\r\t\s]/gm,'');
					parent.options.updatesInfo[u].shareLatestVersion 
						= unescape(parent.options.updatesInfo[u].shareLatestVersion).replace(/[\n\r\t\s]/gm,'');

					var modified = false;

					for(var r in parent.options.updatesInfo[u].repoFiles)
						if(parent.options.updatesInfo[u].repoFiles[r].status == 'err')
							modified = true;

					for(var s in parent.options.updatesInfo[u].shareFiles)
						if(parent.options.updatesInfo[u].shareFiles[s].status == 'err')
							modified = true;

					var curVer;
					if ( (parent.options.updatesInfo[u].repoVersion === "")
							&& (parent.options.updatesInfo[u].shareVersion === "") )
						curVer = parent.msg("aui.message.cur_ver_missed");
					else if (parent.options.updatesInfo[u].repoVersion === "")
						curVer = parent.options.updatesInfo[u].shareVersion;
					else if (parent.options.updatesInfo[u].shareVersion === "")
						curVer = parent.options.updatesInfo[u].repoVersion;
					else if (parent.options.updatesInfo[u].repoVersion === parent.options.updatesInfo[u].shareVersion)
						curVer = parent.options.updatesInfo[u].repoVersion;
					else
						curVer = parent.msg("aui.message.cur_ver_inconsistent");

					var latestVer;
					if(parent.options.updatesInfo[u].repoLatestVersion 
								=== parent.options.updatesInfo[u].shareLatestVersion) {
						latestVer = parent.options.updatesInfo[u].repoLatestVersion;
						if(latestVer == curVer)
							latestVer = '';
					} else {
						latestVer = parent.msg("aui.message.latest_ver_inconsistent");
					}

					var isOk;
					if(!modified) {
						isOk = '';
					} else {
						show_help = true;
						isOk = parent.msg("aui.message.component_modified");
					}

					parent.widgets.dataTable.addRow({
						component: parent.options.updatesInfo[u].id,
						curVer: curVer,
						latestVer: latestVer,
						isOk: isOk,
						comment:  unescape(parent.options.updatesInfo[u].motd)
					});
				}

				if(show_help)
				{
					document.getElementById(parent.id + "-help").innerHTML = parent.msg("aui.help.issues");
				}
			}
		});
		new PanelHandler;

		return this;
	};

	YAHOO.extend(ITD.AlvexUpdatesInfo, Alfresco.ConsoleTool,
	{
		options:
		{
			updatesInfo: []
		},

		onReady: function WSA_onReady()
		{
			ITD.AlvexUpdatesInfo.superclass.onReady.call(this);
		}

	});

})();
