<import resource="classpath:alfresco/site-webscripts/org/alfresco/components/workflow/workflow.lib.js">

connector = remote.connect('alfresco');
var groups = eval('('+connector.get('/api/itd/workflow-shortcut/groups')+')');

model.groups = groups.groups;
model.workflowDefinitions = getWorkflowDefinitions();
