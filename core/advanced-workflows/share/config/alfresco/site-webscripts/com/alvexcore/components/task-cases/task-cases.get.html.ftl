<#include "/org/alfresco/include/alfresco-macros.lib.ftl" />

<@markup id="css" >
   <#-- CSS Dependencies -->
   <@link href="${url.context}/res/components/alvex/alvex-task-cases.css" group="workflow"/>
</@>

<@markup id="js">
   <#-- JavaScript Dependencies -->
   <@script src="${url.context}/res/components/alvex/alvex-task-cases.js" group="workflow"/>
</@>

<@markup id="widgets">
   <@createWidgets group="workflow"/>
</@>

<#assign el=args.htmlid?js_string>

<@markup id="html">
   <@uniqueIdDiv>
      <div id="${el}-body" class="form-manager task-cases">
         <div class="section-header message-left"><h2>${msg("header.cases")}</h2></div>
         <div class="section-action message-left">
            <span class="align-left yui-button yui-menu-button" id="${el}-add-case">
               <span class="first-child">
                  <button type="button" tabindex="0">${msg("action.addCase")}</button>
               </span>
            </span>
         </div>
         <div class="clear"></div>
         <div id="${el}-cases-list" class="message-left"></div>
      </div>
   </@>
</@>


<!-- Attach Case Dialog -->

<#assign attachCaseDialog = el + "-attach-case-dialog">

<div id="${attachCaseDialog}" class="picker yui-panel hidden">
	<div id="${attachCaseDialog}-head" class="hd">${msg("action.addCase")}</div>
	<div id="${attachCaseDialog}-body" class="bd">
		<div class="attach-case-dialog">
			<div class="attach-case-dialog-search hidden">
				<label for="${attachCaseDialog}-search">${msg("message.attachCase.searchForCases")}</label>
				<div><input id="${attachCaseDialog}-search" type="text" tabindex="0"/></div>
				<input id="${attachCaseDialog}-search-ok" name="-" type="button" value="${msg("button.search")}" />
			</div>
			<div id="${attachCaseDialog}-options-table"></div>
			<div id="${attachCaseDialog}-selected"></div>
		</div>
	</div>
	<!--div class="ft">
		<input id="${attachCaseDialog}-ok" name="-" type="button" value="${msg("action.attachCase")}" />
		<input id="${attachCaseDialog}-cancel" name="-" type="button" value="${msg("button.cancel")}" />
	</div-->
</div>
