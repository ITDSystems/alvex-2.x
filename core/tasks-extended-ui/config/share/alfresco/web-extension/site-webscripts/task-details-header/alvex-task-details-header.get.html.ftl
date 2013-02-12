<#assign el=args.htmlid?js_string>
<script type="text/javascript">//<![CDATA[
new Alvex.TaskDetailsHeader("${el}").setOptions(
{
   referrer: <#if page.url.args.referrer??>"${page.url.args.referrer?js_string}"<#else>null</#if>,
   nodeRef: <#if page.url.args.nodeRef??>"${page.url.args.nodeRef?js_string}"<#else>null</#if>
}).setMessages(
   ${messages}
);
//]]></script>
<div id="${el}-body" class="form-manager task-details-header">
   <div class="links hidden">
      <!--div id="${el}-task"><span class="theme-color-2">${msg("label.taskDetails")}</span></div-->
      <div id="${el}-workflow"><a href="">${msg("label.workflowDetails")}</a></div>
      <div id="${el}-parent" class="hidden"><a href="">${msg("label.parentTask")}</a></div>
      <div class="actions">
         <span class="edit hidden">
            <button id="${el}-edit">${msg("button.edit")}</button>
         </span>
      </div>
   </div>
   <h1><span></span></h1>
   <h3><span></span></h3>
   <div class="clear"></div>
</div>
