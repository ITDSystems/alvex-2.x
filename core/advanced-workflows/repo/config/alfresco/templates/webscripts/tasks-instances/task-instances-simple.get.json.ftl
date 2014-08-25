<#-- List Workflow Task Instances -->

<#import "/org/alfresco/repository/generic-paged-results.lib.ftl" as genericPaging />

<#-- Renders a task instance. -->
<#macro taskSimpleJSON task detailed=false>
<#escape x as jsonUtils.encodeJSONString(x)>
      {
         "id": "${task.id}",
         "taskState": "${task.state}",
         "outcome": <#if task.outcome??>"${task.outcome}"<#else>null</#if>,
         "isWorkflowActive": ${task.workflowInstance.isActive?string},
         "isPooled": ${task.isPooled?string},
         "isEditable": ${task.isEditable?string},
         "isReassignable": ${task.isReassignable?string},
         "isClaimable": ${task.isClaimable?string},
         "isReleasable": ${task.isReleasable?string},
         "permissions":
         {
            "userAccess":
            {
            }
         },
         "itemData":
         {
            "assoc_owner":
            <#if task.owner??>
            {
               "metadata": "${task.owner.userName}",
               "displayValue": "<#if task.owner.firstName??>${task.owner.firstName} </#if><#if task.owner.lastName??>${task.owner.lastName}</#if>"
            },
            <#else>
            null,
            </#if>
            "assoc_initiator": 
            <#if task.workflowInstance.initiator??>
            {
               "metadata": "${task.workflowInstance.initiator.userName}",
               "displayValue": "<#if task.workflowInstance.initiator.firstName??>${task.workflowInstance.initiator.firstName} </#if><#if task.workflowInstance.initiator.lastName??>${task.workflowInstance.initiator.lastName}</#if>"
            },
            <#else>
            null,
            </#if>
<@propertiesJSON task=task properties=task.properties propertyLabels=task.propertyLabels/>
         }
      }
</#escape>
</#macro>

<#-- Renders a map of properties -->
<#macro propertiesJSON task properties propertyLabels>
<#escape x as jsonUtils.encodeJSONString(x)>
   "prop_taskTitle": {
      "value": "${task.title!""}",
      "displayValue": "${task.title!""}"
    },
   "prop_workflowTitle":  {
      "value": "${task.workflowInstance.title!""}",
      "displayValue": "${task.workflowInstance.title!""}"
    },
<#list properties?keys as key>
   <#if properties[key]??>
   "prop_${key}": {
      <#assign val=properties[key]>
      <#if val?is_boolean == true>
         <#assign val=val?string>
      <#elseif val?is_number == true>
         <#assign val=val?c>
      <#elseif val?is_sequence>
         <#assign val="@array">
      <#else>
         <#assign val=shortQName(val?string)>
      </#if>
      <#if propertyLabels[key]??>
         <#assign dispVal=propertyLabels[key]>
      <#else>
         <#assign dispVal=val>
      </#if>
      "value": "${val}",
      "displayValue": "${dispVal}"
   }<#if (key_has_next)>,</#if>
   </#if>
</#list>
</#escape>
</#macro>

{
   "items": 
   [
      <#list taskInstances as task>
      <@taskSimpleJSON task=task />
      <#if task_has_next>,</#if>
      </#list>
   ]

   <@genericPaging.pagingJSON pagingVar="paging" />
}
