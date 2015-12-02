<#assign id = args.htmlid>
<#assign jsid = args.htmlid?js_string>

<script type="text/javascript">//<![CDATA[
(function()
{
	new Alvex.ManageesWorkflowsViewer("${jsid}").setOptions({
		hiddenTaskTypes: [<#list hiddenTaskTypes as type>"${type}"<#if type_has_next>, </#if></#list>],
		maxItems: ${maxItems!"50"},
		compactMode: true
	}).setMessages(
		${messages}
	);

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
		<div>
			<span class="align-left yui-button yui-menu-button">
				<span class="first-child">
				</span>
			</span>
			<span class="align-right yui-button-align">
				<span class="first-child">
					<a href="${page.url.context}/page/alvex-managees-workflows" class="theme-color-1">
						${msg("link.allManageesWorkflows")}
					</a>
				</span>
			</span>
			<div class="clear"></div>
		</div>
	</div>

	<div class="body scrollableList" <#if args.height??>style="height: ${args.height}px;"</#if>>
		<div id="${id}-body" class="task-list"></div>
	</div>
</div>
