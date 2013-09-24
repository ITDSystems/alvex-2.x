<#include "/org/alfresco/include/alfresco-macros.lib.ftl" />

<@markup id="css" >
   <#-- CSS Dependencies -->
   <@link href="${url.context}/res/components/alvex/alvex-task-header.css" group="workflow"/>
</@>

<@markup id="js">
   <#-- JavaScript Dependencies -->
   <@script src="${url.context}/res/components/alvex/alvex-task-header.js" group="workflow"/>
</@>

<@markup id="widgets">
   <@createWidgets group="workflow"/>
</@>

<#assign el=args.htmlid?js_string>

<@markup id="html">
   <@uniqueIdDiv>
      <div id="${el}-body" class="form-manager task-header">
         <div class="message-right">
            <div id="${el}-prio"><h3>
               <label>${msg("message.priority")}</label>
               <span></span>
            </h3></div>
            <div id="${el}-status"><h3>
               <label>${msg("message.status")}</label>
               <span></span>
            </h3></div>
         </div>
         <div id="${el}-title"><h1><span></span></h1></div>
         <div id="${el}-subtitle"><h3><span></span></h3></div>
         <div class="clear"></div>
         <span class="unassigned-message hidden theme-bg-color-2 theme-border-4"><span>${msg("message.unassigned")}</span></span>
      </div>
   </@>
</@>
