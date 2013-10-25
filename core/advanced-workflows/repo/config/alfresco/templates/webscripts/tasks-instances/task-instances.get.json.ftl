<#-- List Workflow Task Instances -->

<#import "/org/alfresco/repository/workflow/workflow.lib.ftl" as workflowLib/>
<#import "/org/alfresco/repository/generic-paged-results.lib.ftl" as genericPaging />

{
   "data": 
   [
      <#list taskInstances as task>
      <@workflowLib.taskJSON task=task />
      <#if task_has_next>,</#if>
      </#list>
   ]

   <@genericPaging.pagingJSON pagingVar="paging" />
}
