<#-- Workflow Task Instance in details -->

<#import "/org/alfresco/repository/workflow/workflow.lib.ftl" as workflowLib />
{
   "data": 
   <@workflowLib.taskJSON task=workflowTask detailed=true/>
}