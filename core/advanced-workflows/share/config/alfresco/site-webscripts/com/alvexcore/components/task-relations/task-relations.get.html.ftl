<#include "/org/alfresco/include/alfresco-macros.lib.ftl" />

<@markup id="css" >
   <#-- CSS Dependencies -->
   <@link href="${url.context}/res/components/alvex/alvex-task-relations.css" group="workflow"/>
</@>

<@markup id="js">
   <#-- JavaScript Dependencies -->
   <@script src="${url.context}/res/components/alvex/alvex-task-relations.js" group="workflow"/>
   <@script type="text/javascript" src="${page.url.context}/res/modules/simple-dialog.js" />
</@>

<@markup id="widgets">
   <@createWidgets group="workflow"/>
</@>

<#assign el=args.htmlid?js_string>

<@markup id="html">
   <@uniqueIdDiv>
      <div id="${el}-body" class="form-manager task-relations">
         <div class="section-header message-left"><h2>${msg("header.relatedWorkflows")}</h2></div>
         <div class="section-action message-right">
            <span class="align-left yui-button yui-menu-button" id="${el}-attach-workflow">
               <span class="first-child push-button">
                  <button type="button" tabindex="0">${msg("action.attachWorkflow")}</button>
               </span>
            </span>
            <span class="align-left yui-button yui-menu-button" id="${el}-start-workflow">
               <span class="first-child">
                  <button type="button" tabindex="0">${msg("action.startWorkflow")}</button>
               </span>
            </span>
            <select id="${el}-start-workflow-menu"></select>
         </div>
         <div class="clear"></div>
         <div id="${el}-related-workflows" class="">
         </div>
      </div>
   </@>
</@>


<!-- Attach Workflow Dialog -->

<#assign attachWorkflowDialog = el + "-attach-workflow-dialog">

<div id="${attachWorkflowDialog}" class="picker yui-panel hidden">
	<div id="${attachWorkflowDialog}-head" class="hd">${msg("action.attachWorkflow")}</div>
	<div id="${attachWorkflowDialog}-body" class="bd">
		<div class="attach-workflow-dialog">
			<div class="attach-workflow-dialog-search">
				<label for="${attachWorkflowDialog}-search">${msg("message.attachWorkflow.searchForWorkflows")}</label>
				<div><input id="${attachWorkflowDialog}-search" type="text" tabindex="0"/></div>
				<input id="${attachWorkflowDialog}-search-ok" name="-" type="button" value="${msg("button.search")}" />
			</div>
			<div id="${attachWorkflowDialog}-options-table"></div>
			<div id="${attachWorkflowDialog}-selected"></div>
		</div>
	</div>
	<!--div class="ft">
		<input id="${attachWorkflowDialog}-ok" name="-" type="button" value="${msg("action.attachWorkflow")}" />
		<input id="${attachWorkflowDialog}-cancel" name="-" type="button" value="${msg("button.cancel")}" />
	</div-->
</div>
