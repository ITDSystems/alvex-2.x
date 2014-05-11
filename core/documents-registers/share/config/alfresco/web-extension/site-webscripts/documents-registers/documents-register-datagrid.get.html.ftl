<#include "/form.get.head.ftl">

<#assign id = args.htmlid>
<!--[if IE]>
   <iframe id="yui-history-iframe" src="${url.context}/res/yui/history/assets/blank.html"></iframe> 
<![endif]-->
<input id="yui-history-field" type="hidden" />

<#include "/alvex-datagrid.inc.ftl">
<@renderAlvexDatagridHTML id />

<script type="text/javascript">//<![CDATA[
   new Alvex.DataGrid('${id}').setOptions(
   {
      workflowsAvailable: "${(workflowsAvailable!false)?string}",
      usePagination: ${(args.pagination!false)?string}
   }).setMessages(${messages});
//]]></script>