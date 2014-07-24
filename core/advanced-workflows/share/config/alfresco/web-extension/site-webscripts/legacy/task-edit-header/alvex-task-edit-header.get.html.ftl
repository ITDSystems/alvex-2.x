<#include "/org/alfresco/include/alfresco-macros.lib.ftl" />

<!--[if IE]>
	<script type="text/javascript" src="${url.context}/res/excanvas/excanvas.compiled.js"></script>
<![endif]-->

<#assign el=args.htmlid?js_string>
<script type="text/javascript">//<![CDATA[
new Alvex.TaskEditHeader("${el}").setOptions(
{
   referrer: <#if page.url.args.referrer??>"${page.url.args.referrer?js_string}"<#else>null</#if>,
   submitButtonMessageKey: "button.saveandclose",
   defaultUrl: "${siteURL("my-tasks")}"
}).setMessages(
   ${messages}
);
//]]></script>

<div id="${el}-body" class="form-manager task-edit-header">
   <div class="links hidden">
      <!--div id="${el}-task"><span class="theme-color-2">${msg("label.taskEdit")}</span></div-->
      <div id="${el}-workflow"><a href="">${msg("label.workflowDetails")}</a></div>
      <div id="${el}-parent" class="hidden"><a href="">${msg("label.parentTask")}</a></div>
      <div class="actions">
         <span class="claim hidden">
            <button id="${el}-claim">${msg("button.claim")}</button>
         </span>
         <span class="reassign hidden">
            <button id="${el}-reassign">${msg("button.reassign")}</button>   
         </span>
         <span class="release hidden">      
            <button id="${el}-release">${msg("button.release")}</button>
         </span>
	<#if alvexEdition == 'Enterprise' >
         <span class="tree-view hidden">
            <button id="${el}-tree-view"></button>
         </span>
	</#if>
      </div>
   </div>
   <div><h1><span></span></h1></div>
   <div><h3><span></span></h3></div>
   <div class="clear"></div>
   <div class="unassigned-message hidden theme-bg-color-2 theme-border-4"><span>${msg("message.unassigned")}</span></div>

   <!-- People Finder Dialog -->
   <div style="display: none;">
      <div id="${el}-reassignPanel" class="task-edit-header reassign-panel">
         <div class="hd">${msg("panel.reassign.header")}</div>
         <div class="bd">
            <div style="margin: auto 10px;">
               <div id="${el}-peopleFinder"></div>
            </div>
         </div>
      </div>
   </div>

   <!-- Workflow Tree Dialog -->
   <div style="display: none;">
      <div id="${el}-treePanel" class="task-edit-header tree-panel">
         <div class="hd">${msg("button.relatedWorkflowsTree")}</div>
         <div class="bd">
            <div style="margin: auto 10px;">
               <div id="${el}-treePanel-canvas" style="width: 800px; height: 400px;"></div>
            </div>
         </div>
      </div>
   </div>

</div>
