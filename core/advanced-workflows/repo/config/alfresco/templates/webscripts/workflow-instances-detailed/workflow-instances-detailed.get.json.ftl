<#escape x as jsonUtils.encodeJSONString(x)>

<#-- Workflow Instances collection -->
<#import "/org/alfresco/repository/generic-paged-results.lib.ftl" as genericPaging />

{
   "data": 
   [
      <#if workflowInstances??>
      <#list workflowInstances as workflowInstance>
      {
         "id": "${workflowInstance.id}",
         "url": "${workflowInstance.url}",
         "name": "${workflowInstance.name}",
         "title": "${workflowInstance.title!""}",
         "description": "${workflowInstance.description!""}",
         "isActive": ${workflowInstance.isActive?string},
         "startDate": "${workflowInstance.startDate}",
         "priority": <#if workflowInstance.priority??>${workflowInstance.priority?c}<#else>2</#if>,
         "message": <#if workflowInstance.message?? && workflowInstance.message?length &gt; 0>"${workflowInstance.message}"<#else>null</#if>,
         "endDate": <#if workflowInstance.endDate??>"${workflowInstance.endDate}"<#else>null</#if>,
         "dueDate": <#if workflowInstance.dueDate??>"${workflowInstance.dueDate}"<#else>null</#if>,
         "context": <#if workflowInstance.context??>"${workflowInstance.context}"<#else>null</#if>,
         "package": <#if workflowInstance.package??>"${workflowInstance.package}"<#else>null</#if>,
         "initiator": 
         <#if workflowInstance.initiator??>
         {
            "userName": "${workflowInstance.initiator.userName}"<#if workflowInstance.initiator.firstName??>,
            "firstName": "${workflowInstance.initiator.firstName}"</#if><#if workflowInstance.initiator.lastName??>,
            "lastName": "${workflowInstance.initiator.lastName}"</#if><#if workflowInstance.initiator.avatarUrl??>,
            "avatarUrl": "${workflowInstance.initiator.avatarUrl}"</#if>
         },
         <#else>
         null,
         </#if>
         "definitionUrl": "${workflowInstance.definitionUrl}"
         <#if workflowInstance.tasks??>,
         "tasks": 
         [
            <#list workflowInstance.tasks as task> 
            {
              "state": <#if task.state??>"${task.state}"<#else>""</#if>,
              "title": <#if task.title??>"${task.title}"<#else>""</#if>,
              "name": <#if task.name??>"${task.name}"<#else>""</#if>,
              "owner": 
              <#if task.owner??>
              {
                "userName": "${task.owner.shortName!''}",
                "firstName": "${task.owner.firstName!''}",
                "lastName": "${task.owner.lastName!''}"
              },
              <#else>
              null,
              </#if>
              "related": <#if task.relatedWorkflows??>"${task.relatedWorkflows}"<#else>""</#if>
            }<#if task_has_next>,</#if>
            </#list>
         ]
         </#if>
      }<#if workflowInstance_has_next>,</#if>
      </#list>
      </#if>
   ]

   <@genericPaging.pagingJSON pagingVar="paging" />
}

</#escape>
