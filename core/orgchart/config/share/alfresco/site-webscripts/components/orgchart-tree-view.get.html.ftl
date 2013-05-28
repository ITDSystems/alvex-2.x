<!--[if IE]>
	<script type="text/javascript" src="${url.context}/res/excanvas/excanvas.compiled.js"></script>
<![endif]-->
<script type="text/javascript" src="${page.url.context}/res/jit/jit-yc.js"></script>

<#assign htmlId=args.htmlid?js_string>

<style type="text/css" media="screen">
	#${htmlId}-top-group-selector { border-bottom: 1px solid #CBCBCB; padding: 4px 10px 4px 10px; }
	#${htmlId}-infovis { height: 300px; cursor: url(${page.url.context}/res/cursor/openhand.cur), default !important; }
	#${htmlId}-page-tree-view { height: auto; }
</style>

<div>
	<div id="${htmlId}-roles-table" class="hidden"></div>
	<div id="${htmlId}-top-group-selector" class="hidden">
		<strong>${msg("alvex.orgchart.show_top_group")} </strong>
	</div>
	<div id="${htmlId}-page-tree-view" class="hidden ygtv-highlight"></div>
	<div id="${htmlId}-infovis" class="hidden" style="margin:10px"></div>
</div>

<#assign controlId = htmlId + "-cntrl">
<#assign pickerId = controlId + "-picker">

<div id="${pickerId}" class="picker yui-panel hidden">

	<div id="${pickerId}-head" class="hd"></div>
	<div id="${pickerId}-body" class="bd">
		<div id="${pickerId}-container">

			<div id="doc">

				<div class="yui-g orgchart-picker-menu">
					<div id="${pickerId}-view-selector" class="yui-u first yui-skin-sam picker-view-selector">
						<strong>${msg("alvex.orgchart.show_by")} </strong>
						<span id="${pickerId}-view-roles">${msg("alvex.orgchart.show_by_role")}</span>
						<span id="${pickerId}-view-people">${msg("alvex.orgchart.show_by_name")}</span>
					</div>
					<#if config.syncSource == 'none' >
					<div class="yui-u yui-skin-sam" style="padding-top: 0.7em; cursor: pointer;">
						<span id="${pickerId}-add-users">${msg("alvex.orgchart.add_users")}</span>
					</div>
					</#if>
				</div>

				<div class="yui-g">
					<div id="${pickerId}-dataTable" class="yui-u first yui-skin-sam picker-part">
						<div class="people-table">
							<div id="${pickerId}-group-members"></div>
						</div>
					</div>
					<div id="${pickerId}-userDetails" class="yui-u" yui-skin-sam picker-part>
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
								<span class="labelcustom">${msg("alvex.orgchart.telephone")}</span>
								<span class="valuecustom" id="${pickerId}-person-telephone"></span>
							</div>
							<div class="row">
								<span class="labelcustom">${msg("alvex.orgchart.mobile")}</span>
								<span class="valuecustom" id="${pickerId}-person-mobile"></span>
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
							<!--div class="row">
								<span class="labelcustom">${msg("alvex.orgchart.location")}</span>
								<span class="valuecustom" id="${pickerId}-person-loc"></span>
							</div-->
							<div>
								<br/>
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

<!-- Set User Roles Dialog -->

<#assign userRolesDialogId = controlId + "-user-roles-dialog">

<div id="${userRolesDialogId}" class="picker yui-panel user-roles-dialog hidden">
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

<div id="${unitRolesDialogId}" class="picker yui-panel unit-roles-dialog hidden">
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
	new Alvex.OrgchartViewer("${htmlId}").setOptions({
		mode: "viewer",
		style: "${config.viewType}",
		defaultRoleName: "${config.defaultRoleName}",
		showUnitsRecursively: <#if config.showUnitsRecursively>true<#else>false</#if>,
		syncSource: "${config.syncSource}"
	}).setMessages(
		${messages}
	);
//]]></script>
