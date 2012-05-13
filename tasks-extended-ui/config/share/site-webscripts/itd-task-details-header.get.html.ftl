<#assign el=args.htmlid?js_string>
<script type="text/javascript">//<![CDATA[
new ITD.TaskDetailsHeader("${el}").setOptions(
{
   referrer: <#if page.url.args.referrer??>"${page.url.args.referrer?js_string}"<#else>null</#if>,
   nodeRef: <#if page.url.args.nodeRef??>"${page.url.args.nodeRef?js_string}"<#else>null</#if>
}).setMessages(
   ${messages}
);
//]]></script>
<div id="${el}-body" class="form-manager task-details-header">
   <div class="links hidden">
      <span class="theme-color-2">${msg("label.taskDetails")}</span>
      <span class="separator">|</span>
      <a href="">${msg("label.workflowDetails")}</a>
   </div>
   <h1><span></span></h1>
   <h3><span></span></h3>
   <div class="clear"></div>
</div>
