<#include "/org/alfresco/include/alfresco-macros.lib.ftl" />
<#assign el=args.htmlid?js_string>
<script type="text/javascript">//<![CDATA[
new Alvex.WorkflowDetailsActions("${el}").setOptions(
{
   submitUrl: "${siteURL("my-workflows")}"
}).setMessages(
   ${messages}
);
//]]></script>
<div id="${el}-body" class="form-manager workflow-details-actions">
   <div class="actions hidden">
      <div id="${el}-cancel-action" class="workflow-cancel-action hidden">
         <button id="${el}-cancel">${msg("button.cancelWorkflow")}</button>
      </div>
      <div id="${el}-delete-action" class="workflow-delete-action hidden">
         <button id="${el}-delete">${msg("button.deleteWorkflow")}</button>
      </div>
   </div>
</div>
