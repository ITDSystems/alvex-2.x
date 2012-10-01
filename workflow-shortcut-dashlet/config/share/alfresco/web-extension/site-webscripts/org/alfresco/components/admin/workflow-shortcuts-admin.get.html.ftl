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
		<div class="yui-g">
			<div class="yui-u first">
				<!-- Select group button -->
				<div>
					<span class="yui-button yui-push-button" id="${el}-select-group-button">
						<span class="first-child">
							<button></button>
						</span>
					</span>
				</div>
			</div>
			<div class="yui-u">
				<!-- Add workflow button -->
				<div>
					<span class="yui-button yui-push-button" id="${el}-add-wfl-button">
						<span class="first-child">
							<button>${msg("wsa.button.add_workflow")}</button>
						</span>
					</span>
				</div>
			</div>
		</div>
		<div id="${el}-list"></div>
		<div>
			<div id="${el}-datatable"></div>
		</div>
		<#-- Group menu -->
		<div id="${el}-group-menu" class="yuimenu">
			<div class="bd">
				<ul>
					<#list groups as group>
					<li style="text-align: left; margin-top: 3px; margin-bottom: 3px;">
						<span class="yuimenuitemlabel">${group.displayName?js_string}</span>
						<span style="padding-left: 20px; padding-right: 20px;">${group.displayName?js_string}</span>
					</li>
					</#list>
				</ul>
			</div>
		</div>
		<#-- Workflow type menu -->
		<div id="${el}-workflow-definition-menu" class="yuimenu">
			<div class="bd">
				<ul>
					<#list workflowDefinitions as wfl>
					<li style="text-align: left; margin-top: 3px; margin-bottom: 3px;">
						<span class="yuimenuitemlabel">${wfl.title?js_string}</span>
						<span style="padding-left: 20px; padding-right: 20px;">${wfl.description?js_string}</span>
					</li>
					</#list>
				</ul>
			</div>
		</div>
	</div>
</div>
