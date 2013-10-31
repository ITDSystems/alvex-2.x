<@markup id="css" >
   <#-- CSS Dependencies -->
   <@link href="${url.context}/res/components/alvex/case-contacts.css" group="workflow"/>
</@>

<@markup id="js">
   <#-- JavaScript Dependencies -->
   <@script src="${page.url.context}/res/components/alvex/simple-dialog.js" />
   <@script src="${url.context}/res/components/alvex/case-contacts.js" group="workflow"/>
</@>

<@markup id="widgets">
   <@createWidgets group="workflow"/>
</@>

<#assign id = args.htmlid>
<#assign jsid = args.htmlid?js_string>

<div class="dashlet case-contacts">
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
		<div id="${id}-contacts"></div>
	</div>
</div>
