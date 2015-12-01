<#assign el=args.htmlid?js_string>

<div id="${el}-body" class="task-list">
</div>

<script type="text/javascript">//<![CDATA[
	new Alvex.ManageesWorkflowsViewer("${el}").setOptions({
		hiddenTaskTypes: [<#list hiddenTaskTypes as type>"${type}"<#if type_has_next>, </#if></#list>],
		maxItems: ${maxItems!"50"}
	}).setMessages(
		${messages}
	);
//]]></script>
