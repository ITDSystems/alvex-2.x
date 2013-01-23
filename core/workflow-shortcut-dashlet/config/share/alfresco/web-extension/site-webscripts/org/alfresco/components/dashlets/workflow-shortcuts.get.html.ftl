<#assign el=args.htmlid?js_string>
<script type="text/javascript">//<![CDATA[
	new Alfresco.widget.DashletResizer("${el}", "${instance.object.id}");
//]]></script>

<div class="dashlet workflow-shortcuts">
	<div class="title">${msg("workflow-shortcuts.header")}</div>
	<div id="${el}-workflow-shortcuts" class="body scrollableList" <#if args.height??>style="height: ${args.height}px;"</#if>>
		<#list workflows as workflow>
		<div id="${el}-shortcut" class="detail-list-item">
			<a href="${url.context}/page/start-workflow?workflow=${workflow.name}">${workflow.title}</a>
		</div>
		</#list>
	</div>
</div>
