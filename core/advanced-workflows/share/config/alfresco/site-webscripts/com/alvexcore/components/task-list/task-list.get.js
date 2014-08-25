<import resource="classpath:alfresco/site-webscripts/org/alfresco/components/workflow/workflow.lib.js">
<import resource="classpath:alfresco/site-webscripts/org/alfresco/components/workflow/filter/filter.lib.js">

model.hiddenTaskTypes = getHiddenTaskTypes();
model.hiddenWorkflowsNames = getHiddenWorkflowNames();
model.filterParameters = getFilterParameters();
model.maxItems = getMaxItems();

var myConfig = new XML(config.script),
   sorters = [];

for each(var xmlSorter in myConfig..sorter)
{
   sorters.push(
   {
      type: xmlSorter.@type.toString(),
      sortField: xmlSorter.@parameters.toString()
   });
}
model.sorters = sorters;


// Actions
var actionSet = [],
   xmlActionSet = myConfig.actionSet;

for each (var xmlAction in xmlActionSet.action)
{
   actionSet.push(
   {
      className: xmlAction.@className.toString(),
      type: xmlAction.@type.toString(),
      permission: xmlAction.@permission.toString(),
      href: xmlAction.@href.toString(),
      func: xmlAction.@func.toString(),
      label: xmlAction.@label.toString()
   });
}

model.actionSet = actionSet;

// Widget instantiation metadata...
var taskListHeader = {
   id : "TaskListHeader",
   name : "Alvex.TaskListHeader"
};
model.widgets = [taskListHeader];