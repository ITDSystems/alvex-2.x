<#assign fieldHtmlId = args.htmlid>

<div id="${fieldHtmlId}-dialog" class="yui-panel">

	<style type="text/css" media="screen">
		#${fieldHtmlId}-dataTable { margin-left: 1% }
		#${fieldHtmlId}-userDetails { margin-left: 1% }
		#${fieldHtmlId}-treeSelector { height: 300px; overflow: scroll; overflow-x: hidden; border-right: 1px solid #CBCBCB; }
		#${fieldHtmlId}-view-selector { border-bottom: 1px solid #CBCBCB; padding: 4px 10px 4px 10px; }
		#${fieldHtmlId}-dataTable { height: 300px; overflow: scroll; overflow-x: hidden; border-right: 1px solid #CBCBCB; }
		#${fieldHtmlId}-group-members thead { display: none; }
		#${fieldHtmlId}-group-members table { border: none; width: 100% }
		#${fieldHtmlId}-group-members td { border-right: none; }
		#${fieldHtmlId}-selection { border-top: 1px solid #CBCBCB; }
		#${fieldHtmlId}-userDetails { height: 300px; overflow: scroll; overflow-x: hidden; }
		#${fieldHtmlId}-groups td { text-align: left; }
		.profile .namelabelcustom { margin-left: 96px; font-size: 123.1%; line-height: 1.7em; font-weight: bold; }
		.profile .labelcustom { clear: left; float: left; padding-right: 0.8em; width: 7em; 
					text-align: right; font-weight: bold; }
		.profile .valuecustom { display: block; margin-left: 7em; min-height: 1.2em; padding-left: 1.5em; }
		.profile .sectionlabelcustom { line-height: 1.7em; font-weight: bold; }
		.profile hr { color: #E4E4E4; background-color: #E4E4E4; }
		.person-hidden { display: none; }
	</style>

	<div id="${fieldHtmlId}-dialogTitle" class="hd">${msg("itd.orgchart.popup_dialog_title")}</div>
	<div id="${fieldHtmlId}-dialogBody" class="bd">
		<div id="${fieldHtmlId}-container" class="form-container">
			<form id="${fieldHtmlId}-form" method="post" accept-charset="utf-8" enctype="application/json" action="">
				<div id="${fieldHtmlId}-view-selector">
					<strong>${msg("itd.orgchart.show_by")} </strong>
					<a href="#" id="${fieldHtmlId}-view-roles">${msg("itd.orgchart.show_by_role")}</a>
					<a href="#" id="${fieldHtmlId}-view-people">${msg("itd.orgchart.show_by_name")}</a>
				</div>
				<div id="doc4">
					<div class="yui-gb">
						<div id="${fieldHtmlId}-treeSelector" class="yui-u first yui-skin-sam">
							<div id="${fieldHtmlId}-groups">Struct will be here</div>
						</div>
						<div id="${fieldHtmlId}-dataTable" class="yui-u yui-skin-sam">
							<div id="${fieldHtmlId}-group-members"></div>
						</div>
						<div id="${fieldHtmlId}-userDetails" class="yui-u">
							<div id="${fieldHtmlId}-person-info" class="profile">
								<div>
									<div class="photo">
										<img id="${fieldHtmlId}-person-img" class="photoimg"></img>
									</div>
									<div class="namelabelcustom" id="${fieldHtmlId}-person-name"></div>
									<div class="fieldlabel" id="${fieldHtmlId}-person-title"></div>
									<div class="fieldlabel" id="${fieldHtmlId}-person-company"></div>
								</div>
								<div class="row">
									<span class="labelcustom">${msg("itd.orgchart.phone")}</span>
									<span class="valuecustom" id="${fieldHtmlId}-person-phone"></span>
								</div>
								<div class="row">
									<span class="labelcustom">${msg("itd.orgchart.cell")}</span>
									<span class="valuecustom" id="${fieldHtmlId}-person-cell"></span>
								</div>
								<div class="row">
									<span class="labelcustom">${msg("itd.orgchart.email")}</span>
									<span class="valuecustom" id="${fieldHtmlId}-person-email"></span>
								</div>
								<div class="row">
									<span class="labelcustom">${msg("itd.orgchart.skype")}</span>
									<span class="valuecustom" id="${fieldHtmlId}-person-skype"></span>
								</div>
								<div class="row">
									<span class="labelcustom">${msg("itd.orgchart.im")}</span>
									<span class="valuecustom" id="${fieldHtmlId}-person-im"></span>
								</div>
								<div class="row">
									<span class="labelcustom">${msg("itd.orgchart.location")}</span>
									<span class="valuecustom" id="${fieldHtmlId}-person-loc"></span>
								</div>
								<div>
									<div id="${fieldHtmlId}-person-links"></div>
								</div>
								<hr/>
								<div class="sectionlabelcustom">${msg("itd.orgchart.person_bio")}</div>
								<div>
									<div id="${fieldHtmlId}-person-bio"></div>
								</div>
							</div>
						</div>
					</div>
					<div id="${fieldHtmlId}-selection">
						<div><strong>${msg("itd.orgchart.selected_users")}</strong></div>
						<div id="${fieldHtmlId}-selected-users"></div>
					</div>
					<div class="bdft">
						<input id="${fieldHtmlId}-ok" name="-" type="button" value="${msg("itd.orgchart.popup_submit_button")}" />
						<input id="${fieldHtmlId}-cancel" name="-" type="button" value="${msg("itd.orgchart.popup_cancel_button")}" />
					</div>      
				</div>
			</form>
		</div>
	</div>
</div>
