<!--[if IE]>
<iframe id="yui-history-iframe" src="${url.context}/res/yui/history/assets/blank.html"></iframe>
<![endif]-->
<input id="yui-history-field" type="hidden" />

<#assign el=args.htmlid?js_string>
<script type="text/javascript">//<![CDATA[
	new Alvex.WorkflowShortcutsAdmin("${el}").setOptions({
		workflowDefinitions:
		[<#list workflowDefinitions as workflowDefinition>
		{
			name: "${workflowDefinition.name?js_string}",
			title: "${workflowDefinition.title?js_string}",
			description: "${workflowDefinition.description?js_string}"
		}<#if workflowDefinition_has_next>,</#if>
		</#list>],
		groups:
		[<#list groups as group>
		{
			shortName: "${group.shortName?js_string}",
			fullName: "${group.fullName?js_string}",
			displayName: "${group.displayName?js_string}"
		}<#if group_has_next>,</#if>
		</#list>]
	}).setMessages(${messages});
//]]></script>

<div id="${el}-body" class="users">
	<div id="${el}-main" class="hidden">
		<div class="title"><label>${msg("wsa.title")}</label></div>
		<br/>
		<div class="yui-g">
			<div class="yui-u first">
				<!-- Select group button -->
				<div id="AutoComplete-groups">
					<label for="${el}-group-input">${msg("wsa.button.select_group")}</label>
    				<input id="${el}-group-input" type="text">
    				<div id="${el}-group-container"></div>
				</div>
				<br/><br/>
			</div>
			<div class="yui-u">
				<!-- Add workflow button -->
				<div id="AutoComplete-workflows">
					<label for="${el}-workflow-input">${msg("wsa.button.add_workflow")}</label>
    				<input id="${el}-workflow-input" type="text">
    				<div id="${el}-workflow-container"></div>
				</div>
			</div>
		</div>
		<div id="${el}-list"></div>

		<div>
			<div id="${el}-datatable"></div>
		</div>

	</div>
</div>
