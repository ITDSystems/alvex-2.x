<#escape x as jsonUtils.encodeJSONString(x)>

<#-- Workflow Instances collection -->

<#import "/org/alfresco/repository/workflow/workflow.lib.ftl" as workflowLib/>
<#import "/org/alfresco/repository/generic-paged-results.lib.ftl" as genericPaging />

{
   "data": 
   [
      <#list workflowInstances as workflowInstance>
      <@workflowLib.workflowInstanceJSON workflowInstance=workflowInstance detailed=true />
      <#if workflowInstance_has_next>,</#if>
      </#list>
   ]

   <@genericPaging.pagingJSON pagingVar="paging" />
}

</#escape>