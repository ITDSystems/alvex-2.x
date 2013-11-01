<@markup id="css" >
   <#-- CSS Dependencies -->
   <@link href="${url.context}/res/components/alvex/project-checklists.css" group="workflow"/>
</@>

<@markup id="js">
   <#-- JavaScript Dependencies -->
   <@script src="${page.url.context}/res/modules/simple-dialog.js" />
   <@script src="${page.url.context}/res/components/alvex/simple-dialog.js" />
   <@script src="${url.context}/res/components/alvex/project-checklists.js" group="workflow"/>
</@>

<@markup id="widgets">
   <@createWidgets group="workflow"/>
</@>

<#assign id = args.htmlid>
<#assign jsid = args.htmlid?js_string>

<div class="project-checklists">
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
		<div id="${id}-checklists"></div>
	</div>
</div>
