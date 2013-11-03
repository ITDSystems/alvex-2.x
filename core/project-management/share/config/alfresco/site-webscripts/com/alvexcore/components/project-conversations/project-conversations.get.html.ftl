<#assign id = args.htmlid>
<#assign jsid = args.htmlid?js_string>

<script type="text/javascript">//<![CDATA[
(function()
{
	new Alvex.ProjectConversations("${jsid}").setOptions(
	{
	}).setMessages(${messages});

	new Alfresco.widget.DashletResizer("${id}", "${instance.object.id}");
})();
//]]></script>

<div class="project-conversations">
	<div class="toolbar flat-button">
		<div class="hidden">
			<div style="float: left; padding: 10px;"><h1>${msg("header")}</h1></div>
			<span class="align-right yui-button-align" style="float: right; padding: 15px;">
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
		<div id="${id}-conversations"></div>
	</div>
</div>
