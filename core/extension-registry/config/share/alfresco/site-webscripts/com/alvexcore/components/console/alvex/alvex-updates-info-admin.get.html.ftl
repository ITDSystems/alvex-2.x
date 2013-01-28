<#include "/alvex-meta.lib.ftl" />

<!--[if IE]>
<iframe id="yui-history-iframe" src="${url.context}/res/yui/history/assets/blank.html"></iframe>
<![endif]-->
<input id="yui-history-field" type="hidden" />

<#assign el=args.htmlid?js_string>
<script type="text/javascript">//<![CDATA[
	new Alvex.AlvexUpdatesInfo("${el}").setOptions({
		updatesInfo:
		[
		<#list updates as update>
			{
				id: "${update.extensionId}",
				repoVersion: "${update.repoVersion}",
				shareVersion: "${update.shareVersion}",
				repoLatestVersion: "${update.repoLatestVersion}",
				shareLatestVersion: "${update.shareLatestVersion}",
				motd: "${update.motd}",
				repoFiles:
				[
				<#list update.repoFiles as fileEntry>
					{
						file: "${fileEntry.file}",
						status: "${fileEntry.status?string('ok', 'err')}"
					}<#if fileEntry_has_next>,</#if>
				</#list>
				],
				shareFiles:
				[
				<#list update.shareFiles as fileEntry>
					{
						file: "${fileEntry.file}",
						status: "${fileEntry.status?string('ok', 'err')}"
					}<#if fileEntry_has_next>,</#if>
				</#list>
				]
			}<#if update_has_next>,</#if>
		</#list>
		]
	}).setMessages(${messages});
//]]></script>

<div id="${el}-body" class="users">
	<div id="${el}-main" class="hidden">
		<div class="title"><label>${msg("aui.systemInfo")}</label></div>
		<div class="header">Alfresco: ${serverEdition?html} v${serverVersion?html} schema ${serverSchema?html}</div>
		<div class="header">Alvex: ${alvexEdition?html} v${alvexVersion?html} (${alvexCodename})</div>
		<br/>
		<div class="title"><label>${msg("aui.title")}</label></div>
		<div id="${el}-datatable"></div>
		<div id="${el}-help"></div>
	</div>
</div>
