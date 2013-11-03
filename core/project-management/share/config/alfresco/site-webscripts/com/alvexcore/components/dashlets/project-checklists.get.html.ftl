<#assign id = args.htmlid>
<#assign jsid = args.htmlid?js_string>

<script type="text/javascript">//<![CDATA[
(function()
{
	new Alvex.ProjectChecklists("${jsid}").setOptions(
	{
	}).setMessages(${messages});

	new Alfresco.widget.DashletResizer("${id}", "${instance.object.id}");
})();
//]]></script>

<div class="dashlet project-checklists">
	<div class="title">${msg("header")}</div>
	<div class="toolbar flat-button">
		<div class="hidden">
			<span class="align-right yui-button-align">
				<span class="first-child align-left yui-button" id="${id}-addItem-button">
					<span class="first-child">
						<button type="button" tabindex="0">${msg("action.add")}</button>
					</span>
				</span>
			</span>
			<div class="clear"></div>
		</div>
	</div>
	<div class="body scrollableList" <#if args.height??>style="height: ${args.height}px;"</#if>>
		<div id="${id}-checklists"></div>
	</div>
</div>
