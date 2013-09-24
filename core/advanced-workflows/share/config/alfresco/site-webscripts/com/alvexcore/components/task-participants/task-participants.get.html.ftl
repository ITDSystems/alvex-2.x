<#include "/org/alfresco/include/alfresco-macros.lib.ftl" />

<@markup id="css" >
   <#-- CSS Dependencies -->
   <@link href="${url.context}/res/components/alvex/alvex-task-participants.css" group="workflow"/>
</@>

<@markup id="js">
   <#-- JavaScript Dependencies -->
   <@script src="${url.context}/res/components/alvex/alvex-task-participants.js" group="workflow"/>
</@>

<@markup id="widgets">
   <@createWidgets group="workflow"/>
</@>

<#assign el=args.htmlid?js_string>

<@markup id="html">
   <@uniqueIdDiv>
      <div id="${el}-body" class="form-manager task-participants">
         <h2>${msg("header.participants")}</h2>
         <div id="${el}-people-list" class="message-left">
         </div>
      </div>
   </@>
</@>
