<#include "/org/alfresco/include/alfresco-macros.lib.ftl" />

<@markup id="css" >
   <#-- CSS Dependencies -->
   <@link href="${url.context}/res/components/alvex/alvex-task-dates.css" group="workflow"/>
</@>

<@markup id="js">
   <#-- JavaScript Dependencies -->
   <@script src="${url.context}/res/components/alvex/alvex-task-dates.js" group="workflow"/>
</@>

<@markup id="widgets">
   <@createWidgets group="workflow"/>
</@>

<#assign el=args.htmlid?js_string>

<@markup id="html">
   <@uniqueIdDiv>
      <div id="${el}-body" class="form-manager task-dates">
         <h2>${msg("header.dates")}</h2>
         <div class="clear"></div>
         <div>
            <div class="record" id="${el}-due">
               <label>${msg("label.dueDate")}</label>
               <span></span>
            </div>
            <div class="clear"></div>
            <div class="record" id="${el}-completed">
               <label>${msg("label.taskCompleted")}</label>
               <span></span>
            </div>
            <div class="clear"></div>
            <div class="record" id="${el}-workflow-started">
               <label>${msg("label.workflowStarted")}</label>
               <span></span>
            </div>
            <div class="clear"></div>
            <div class="record" id="${el}-task-started">
               <label>${msg("label.taskStarted")}</label>
               <span></span>
            </div>
         </div>
      </div>
   </@>
</@>
