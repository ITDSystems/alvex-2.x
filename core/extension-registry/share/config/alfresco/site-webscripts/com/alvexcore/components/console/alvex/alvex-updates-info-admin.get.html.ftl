<!--[if IE]>
<iframe id="yui-history-iframe" src="${url.context}/res/yui/history/assets/blank.html"></iframe>
<![endif]-->
<input id="yui-history-field" type="hidden" />

<#assign el=args.htmlid?js_string>
<script type="text/javascript">//<![CDATA[
	new Alvex.AlvexUpdatesInfo("${el}").setMessages(${messages});
//]]></script>

<div id="${el}-body" class="users">
	<div id="${el}-main" class="hidden">
		<div class="title"><label>${msg("aui.systemInfo")}</label></div>
		<div class="header">Alfresco: ${serverEdition?html} v${serverVersion?html} schema ${serverSchema?html}</div>
		<div class="header">Alvex: ${alvexEdition?html} v${alvexVersion?html} (${alvexCodename})</div>
		<!--div class="title"><label>${msg("aui.title")}</label></div-->
		<!--div id="${el}-updates-table"></div-->
	</div>
</div>
