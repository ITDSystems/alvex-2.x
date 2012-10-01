<!--[if IE]>
<iframe id="yui-history-iframe" src="${url.context}/res/yui/history/assets/blank.html"></iframe>
<![endif]-->
<input id="yui-history-field" type="hidden" />

<#assign htmlId=args.htmlid?js_string>

<script type="text/javascript">
	function showSpoiler(id)
	{
		var inner = document.getElementById("${htmlId}-panel-" + id);
		var button = document.getElementById("${htmlId}-button-" + id);
		if (inner.style.display == "none")
		{
			inner.style.display = "";
			button.value=" - ";
		}
		else
		{
			inner.style.display = "none";
			button.value=" + ";
		}
		YAHOO.Bubbling.fire("formVisibilityChanged");
	}
</script>

<div id="${htmlId}-body" class="orgchart-admin">
	<div class="title set-bordered-panel-heading">
		<span><input id="${htmlId}-button-1" class="btn" type="button" onclick="showSpoiler(1);" value=" + " /></span>
		<label>${msg("alvex.orgchart.configureUI.header")}</label>
	</div>
	<div id="${htmlId}-panel-1" class="set-bordered-panel-body" style="display:none;">
		<div style="padding-bottom: 1em;">
			<div class="label" style="float: left; padding-right: 5em;">${msg("alvex.orgchart.majorParameters")}:</div>
			<div>
				<span>
					<!-- UI Config Button -->
					<div>
						<span class="yui-button yui-push-button" id="${htmlId}-ui-config">
							<span class="first-child">
								<button>${msg("alvex.orgchart.configureUI")}</button>
							</span>
						</span>
					</div>
				</span>
			</div>
		</div>
	</div>
	<hr style="margin-top: 15px; margin-bottom: 15px;"/>
	<div class="title set-bordered-panel-heading">
		<span><input id="${htmlId}-button-2" class="btn" type="button" onclick="showSpoiler(2);" value=" + " /></span>
		<label>${msg("alvex.orgchart.configureRoles.header")}</label>
	</div>
	<div id="${htmlId}-panel-2" class="set-bordered-panel-body" style="display:none;">
		<div id="${htmlId}-roles">
			<span>
					<!-- Add Role Button -->
					<div>
						<span class="yui-button yui-push-button" id="${htmlId}-add-role">
							<span class="first-child">
								<button>${msg("alvex.orgchart.addRole")}</button>
							</span>
						</span>
					</div>
			</span>
		</div>
		<div id="${htmlId}-roles-table"></div>
	</div>
	<hr style="margin-top: 15px; margin-bottom: 15px;"/>
	<div class="title set-bordered-panel-heading">
		<span><input id="${htmlId}-button-3" class="btn" type="button" onclick="showSpoiler(3);" value=" - " /></span>
		<label>${msg("alvex.orgchart.configureUnits.header")}</label>
	</div>
	<div id="${htmlId}-panel-3" class="set-bordered-panel-body">
		<div id="${htmlId}-page-tree-view"></div>
	</div>
</div>

<#assign controlId = htmlId + "-cntrl">

<!-- Unit Members View / Edit Dialog -->

<#assign pickerId = controlId + "-picker">

<div id="${pickerId}" class="picker yui-panel hidden">

	<style type="text/css" media="screen">
		#${pickerId}-view-selector { padding-left: 6px; text-align: left; }
		#${pickerId}-dataTable { padding-left: 6px; height: 300px; overflow: scroll; overflow-x: hidden; border-right: 1px solid #CBCBCB; }
		#${pickerId}-group-members { border-left: 1px solid #CBCBCB; }
		#${pickerId}-group-members thead { display: none; }
		#${pickerId}-group-members table { border: none; width: 100% }
		#${pickerId}-group-members td { border-right: none; }
		#${pickerId}-userDetails { height: 300px; overflow: scroll; overflow-x: hidden; }
		#${pickerId}-view-selector { padding-top: 0.5em; padding-bottom: 0.5em; }
		#${pickerId}-view-roles, #${pickerId}-view-people { padding-left: 1em; }
		#${controlId}-add-role-dialog .bd { padding: 1em; }
		#${controlId}-user-roles-dialog .hd { padding-left: 3em; padding-right: 3em; }
		#${controlId}-user-roles-dialog .bd { padding: 1em; }
		#${controlId}-unit-roles-dialog .hd { padding-left: 3em; padding-right: 3em; }
		#${controlId}-unit-roles-dialog .bd { padding: 1em; }
	</style>

	<div id="${pickerId}-head" class="hd"></div>
	<div id="${pickerId}-body" class="bd">
		<div id="${pickerId}-container">

			<div id="doc">

				<div class="yui-g orgchart-picker-menu">
					<div id="${pickerId}-view-selector" class="yui-u first yui-skin-sam">
						<strong>${msg("alvex.orgchart.show_by")} </strong>
						<a href="#" id="${pickerId}-view-roles">${msg("alvex.orgchart.admin_roles")}</a>
						<a href="#" id="${pickerId}-view-people">${msg("alvex.orgchart.admin_members")}</a>
					</div>
					<div class="yui-u yui-skin-sam">
						<a href="#" id="${pickerId}-add-users">${msg("alvex.orgchart.add_users")}</a>
					</div>
				</div>

				<div class="yui-g">
					<div id="${pickerId}-dataTable" class="yui-u first yui-skin-sam">
						<div id="${pickerId}-group-members"></div>
					</div>
					<div id="${pickerId}-userDetails" class="yui-u" yui-skin-sam>
						<div id="${pickerId}-person-info" class="profile">
							<div>
								<div class="photo">
									<img id="${pickerId}-person-img" class="photoimg"></img>
								</div>
								<div class="namelabelcustom" id="${pickerId}-person-name"></div>
								<div class="fieldlabel" id="${pickerId}-person-title"></div>
								<div class="fieldlabel" id="${pickerId}-person-company"></div>
							</div>
							<div class="row">
								<span class="labelcustom">${msg("alvex.orgchart.phone")}</span>
								<span class="valuecustom" id="${pickerId}-person-phone"></span>
							</div>
							<div class="row">
								<span class="labelcustom">${msg("alvex.orgchart.cell")}</span>
								<span class="valuecustom" id="${pickerId}-person-cell"></span>
							</div>
							<div class="row">
								<span class="labelcustom">${msg("alvex.orgchart.email")}</span>
								<span class="valuecustom" id="${pickerId}-person-email"></span>
							</div>
							<div class="row">
								<span class="labelcustom">${msg("alvex.orgchart.skype")}</span>
								<span class="valuecustom" id="${pickerId}-person-skype"></span>
							</div>
							<div class="row">
								<span class="labelcustom">${msg("alvex.orgchart.im")}</span>
								<span class="valuecustom" id="${pickerId}-person-im"></span>
							</div>
							<div class="row">
								<span class="labelcustom">${msg("alvex.orgchart.location")}</span>
								<span class="valuecustom" id="${pickerId}-person-loc"></span>
							</div>
							<div>
								<div id="${pickerId}-person-links"></div>
							</div>
							<hr/>
							<div class="sectionlabelcustom">${msg("alvex.orgchart.person_bio")}</div>
							<div>
								<div id="${pickerId}-person-bio"></div>
							</div>
						</div>
					</div>
				</div>
				
				<div class="bdft">
					&nbsp;
				</div>
				
			</div>
		</div>
	</div>
</div>

<!-- People Finder Dialog -->
<div id="${htmlId}-peoplepicker" class="groups people-picker" style="visibility: hidden;">
	<div class="hd"><span id="${htmlId}-peoplepicker-title">${msg("alvex.orgchart.add_users")}</span></div>
	<div class="bd">
		<div style="margin: auto 10px;">
			<div id="${htmlId}-search-peoplefinder"></div>
		</div>
	</div>
</div>

<!-- Add / Edit Role Dialog -->

<#assign addRoleDialogId = controlId + "-add-role-dialog">

<div id="${addRoleDialogId}" class="picker yui-panel hidden">
	<div id="${addRoleDialogId}-head" class="hd">${msg("alvex.orgchart.addRole")}</div>
	<div id="${addRoleDialogId}-body" class="bd">
		<div><input id="${addRoleDialogId}-role-fixed-name" type="hidden"/></div>
		<div><input id="${addRoleDialogId}-role-old-name" type="hidden"/></div>
		<div>
			<label for="${addRoleDialogId}-role-name">${msg("alvex.orgchart.roleName")}</label>
			<div><input id="${addRoleDialogId}-role-name" type="text"/></div>
		</div>
		<div>
			<label for="${addRoleDialogId}-role-weight">${msg("alvex.orgchart.roleWeight")}</label>
			<div><input id="${addRoleDialogId}-role-weight" type="text"/></div>
		</div>
	</div>
	<div class="ft">
		<input id="${addRoleDialogId}-ok" name="-" type="button" value="${msg("alvex.orgchart.popup_submit_button")}" />
		<input id="${addRoleDialogId}-cancel" name="-" type="button" value="${msg("alvex.orgchart.popup_cancel_button")}" />
	</div>
</div>

<!-- Set User Roles Dialog -->

<#assign userRolesDialogId = controlId + "-user-roles-dialog">

<div id="${userRolesDialogId}" class="picker yui-panel hidden">
	<div id="${userRolesDialogId}-head" class="hd">${msg("alvex.orgchart.userRoles")}</div>
	<div id="${userRolesDialogId}-body" class="bd">
		<div class="hidden">
			<input type="checkbox" name="-" id="${userRolesDialogId}-checkbox" class="formsCheckBox"/>
			<label for="${userRolesDialogId}-checkbox" class="checkbox">Role</label>
		</div>
	</div>
	<div class="ft">
		<input id="${userRolesDialogId}-ok" name="-" type="button" value="${msg("alvex.orgchart.popup_submit_button")}" />
		<input id="${userRolesDialogId}-cancel" name="-" type="button" value="${msg("alvex.orgchart.popup_cancel_button")}" />
	</div>
</div>

<!-- Set Unit Roles Dialog -->

<#assign unitRolesDialogId = controlId + "-unit-roles-dialog">

<div id="${unitRolesDialogId}" class="picker yui-panel hidden">
	<div id="${unitRolesDialogId}-head" class="hd">${msg("alvex.orgchart.unitRoles")}</div>
	<div id="${unitRolesDialogId}-body" class="bd">
		<div class="hidden">
			<input type="checkbox" name="-" id="${unitRolesDialogId}-checkbox" class="formsCheckBox"/>
			<label for="${unitRolesDialogId}-checkbox" class="checkbox">Role</label>
		</div>
	</div>
	<div class="ft">
		<input id="${unitRolesDialogId}-ok" name="-" type="button" value="${msg("alvex.orgchart.popup_submit_button")}" />
		<input id="${unitRolesDialogId}-cancel" name="-" type="button" value="${msg("alvex.orgchart.popup_cancel_button")}" />
	</div>
</div>

<script type="text/javascript">//<![CDATA[
	new Alvex.OrgchartEditor("${htmlId}").setOptions({
		rootGroup: "__orgstruct__",
		defaultRoleName: "${config.defaultRoleName}",
		uiConfigNodeRef: "${config.configNodeRef}"
	}).setMessages(
		${messages}
	);
//]]></script>
