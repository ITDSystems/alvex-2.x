<#assign htmlId=args.htmlid?js_string>

<style type="text/css" media="screen">
	#${htmlId}-top-group-selector { border-bottom: 1px solid #CBCBCB; padding: 4px 10px 4px 10px; }
	#${htmlId}-infovis { height: 300px; cursor: url(${page.url.context}/res/cursor/openhand.cur), default !important; }
</style>

<div>
	<div id="${htmlId}-top-group-selector">
		<strong>${msg("itd.orgchart.show_top_group")} </strong>
	</div>
	<div id="${htmlId}-infovis"></div>
</div>

<script type="text/javascript">//<![CDATA[
	new ITD.OrgchartViewer("${htmlId}").setOptions({
		rootGroup: "__orgstruct__",
		mode: "viewer"
	}).setMessages(
		${messages}
	);
//]]></script>
