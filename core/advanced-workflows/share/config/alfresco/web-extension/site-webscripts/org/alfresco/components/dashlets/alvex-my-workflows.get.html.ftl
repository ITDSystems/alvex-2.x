<#assign id = args.htmlid>
<#assign jsid = args.htmlid?js_string>

<script type="text/javascript">//<![CDATA[
(function()
{
	new Alvex.MyWorkflows("${jsid}").setOptions(
	{
		hiddenWorkflowsNames: [<#list hiddenWorkflowsNames as workflow>"${workflow}"<#if workflow_has_next>, </#if></#list>],
		hiddenTasksTypes: [<#list hiddenTasksTypes as type>"${type}"<#if type_has_next>, </#if></#list>],
		maxItems: ${maxItems!"50"},
		sorters:
			{<#list sorters as sorter>
				"${sorter.type?js_string}": "${sorter.sortField?js_string}"<#if sorter_has_next>,</#if>
			</#list>},
		filters:
			{<#list filters as filter>
				"${filter.type?js_string}": "${filter.parameters?js_string}"<#if filter_has_next>,</#if>
			</#list>}
	}).setMessages(${messages});

	new Alfresco.widget.DashletResizer("${id}", "${instance.object.id}");
	new Alfresco.widget.DashletTitleBarActions("${args.htmlid}").setOptions(
	{
		actions:
		[
			{
				cssClass: "help",
				bubbleOnClick:
				{
					message: "${msg("dashlet.help")?js_string}"
				},
				tooltip: "${msg("dashlet.help.tooltip")?js_string}"
			}
		]
	});
})();
//]]></script>

<div class="dashlet my-workflows">
	<div class="title">${msg("header")}</div>
	<div class="toolbar flat-button">
		<div class="hidden">
			<span class="align-left yui-button yui-menu-button" id="${id}-filters">
				<span class="first-child">
					<button type="button" tabindex="0"></button>
				</span>
			</span>
			<span class="align-left yui-button yui-menu-button" id="${id}-sorters">
				<span class="first-child">
					<button type="button" tabindex="0"></button>
				</span>
			</span>
			<select id="${id}-filters-menu">
				<#list filters as filter>
					<option value="${filter.type?html}">${msg("filter." + filter.type)}</option>
				</#list>
			</select>
			<select id="${id}-sorters-menu">
				<#list sorters as sorter>
					<option value="${sorter.type?html}">${msg("sorter." + sorter.type)}</option>
				</#list>
			</select>
			<span class="align-right yui-button-align">
				<span class="first-child">
					<a href="${page.url.context}/page/my-workflows" class="theme-color-1">${msg("link.allWorkflows")}</a>
				</span>
			</span>
			<div class="clear"></div>
		</div>
	</div>
	<div class="toolbar flat-button">
		<div class="align-left" id="${id}-paginator">&nbsp;</div>
		<span class="align-right yui-button-align">
			<span class="first-child">
			</span>
		</span>
		<div class="clear"></div>
	</div>
	<div class="body scrollableList" <#if args.height??>style="height: ${args.height}px;"</#if>>
		<div id="${id}-workflows"></div>
	</div>
</div>
