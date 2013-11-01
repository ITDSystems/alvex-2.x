<!--[if IE]>
<iframe id="yui-history-iframe" src="${url.context}/res/yui/history/assets/blank.html"></iframe>
<![endif]-->
<input id="yui-history-field" type="hidden" />

<#assign el=args.htmlid?js_string>
<script type="text/javascript">//<![CDATA[
	new Alvex.SitesAdmin("${el}").setOptions({
		siteType: "project-dashboard"
	}).setMessages(${messages});
//]]></script>

<div id="${el}-body" class="users">
	<div id="${el}-main" class="hidden">
		<div class="title"><label>${msg("drsa.title")}</label></div>
		<!-- Select group button -->
		<div>
			<span class="yui-button yui-push-button" id="${el}-add-site-button">
				<span class="first-child">
					<button>${msg("drsa.button.add_site")}</button>
				</span>
			</span>
		</div>
		<div id="${el}-datatable"></div>
	</div>
</div>
