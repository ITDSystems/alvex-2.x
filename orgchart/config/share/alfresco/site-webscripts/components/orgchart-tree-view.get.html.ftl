<#assign htmlId=args.htmlid?js_string>

<style type="text/css" media="screen">
	#${htmlId}-top-group-selector { border-bottom: 1px solid #CBCBCB; padding: 4px 10px 4px 10px; }
	#${htmlId}-infovis { height: 300px; cursor: url(${page.url.context}/res/cursor/openhand.cur), default !important; }
	#${htmlId}-page-tree-view { height: auto; }
</style>

<div>
	<div id="${htmlId}-top-group-selector" class="hidden">
		<strong>${msg("alvex.orgchart.show_top_group")} </strong>
	</div>
	<div id="${htmlId}-page-tree-view" class="hidden"></div>
	<div id="${htmlId}-infovis" class="hidden"></div>
</div>

<#assign controlId = htmlId + "-cntrl">
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
	</style>

	<div id="${pickerId}-head" class="hd"></div>
	<div id="${pickerId}-body" class="bd">
		<div id="${pickerId}-container">

			<div id="doc">

				<div class="yui-g orgchart-picker-menu">
					<div id="${pickerId}-view-selector" class="yui-u first yui-skin-sam">
						<strong>${msg("alvex.orgchart.show_by")} </strong>
						<a href="#" id="${pickerId}-view-roles">${msg("alvex.orgchart.show_by_role")}</a>
						<a href="#" id="${pickerId}-view-people">${msg("alvex.orgchart.show_by_name")}</a>
					</div>
					<div class="yui-u yui-skin-sam">
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

<script type="text/javascript">//<![CDATA[
	new Alvex.OrgchartViewer("${htmlId}").setOptions({
		rootGroup: "__orgstruct__",
		mode: "viewer",
		style: "${config.viewType}",
		defaultRoleName: "${config.defaultRoleName}",
		showUnitsRecursively: "${config.showUnitsRecursively}" == "true",
	}).setMessages(
		${messages}
	);
//]]></script>
