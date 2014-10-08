<#-- Workflow Instance in details -->

<#import "/org/alfresco/repository/workflow/workflow.lib.ftl" as workflowLib />
{
   "data": 
   <@workflowLib.workflowInstanceJSON workflowInstance=workflowInstance detailed=true />
}