<#import "/org/alfresco/components/workflow/workflow.lib.ftl" as workflow/>
<#import "/org/alfresco/components/workflow/filter/filter.lib.ftl" as filter/>
<#assign el=args.htmlid?html>
<div id="${el}-body" class="workflow-list">
   <div class="yui-g workflow-list-bar flat-button hidden">
      <div class="yui-u first">
         <h2 id="${el}-filterTitle" class="thin" style="float: left;">
            &nbsp;
         </h2>
         <span class="align-left yui-button yui-menu-button" id="${el}-sorters">
            <span class="first-child">
               <button type="button" tabindex="0"></button>
            </span>
         </span>
         <select id="${el}-sorters-menu">
         <#list sorters as sorter>
            <option value="${sorter.type?html}">${msg("sorter." + sorter.type)}</option>
         </#list>
         </select>
      </div>
      <div class="yui-u">
         <div id="${el}-paginator" class="paginator">&nbsp;</div>
      </div>
   </div>
   <div id="${el}-workflows" class="workflows"></div>
</div>

<script type="text/javascript">//<![CDATA[
(function()
{
   new Alvex.WorkflowList("${el}").setOptions(
   {
      filterParameters: <@filter.jsonParameterFilter filterParameters />,
      hiddenWorkflowNames: <@workflow.jsonHiddenTaskTypes hiddenWorkflowNames/>,
      workflowDefinitions: <@workflow.jsonWorkflowDefinitions workflowDefinitions/>,
      maxItems: ${maxItems!"50"},
      sorters:
      {<#list sorters as sorter>
         "${sorter.type?js_string}": "${sorter.sortField?js_string}"<#if sorter_has_next>,</#if>
      </#list>}
   }).setMessages(
      ${messages}
   );
})();
//]]></script>
