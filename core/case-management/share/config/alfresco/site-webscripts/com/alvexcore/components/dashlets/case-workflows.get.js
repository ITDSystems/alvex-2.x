<import resource="classpath:alfresco/site-webscripts/org/alfresco/components/workflow/workflow.lib.js">

model.hiddenWorkflowsNames = getHiddenWorkflowNames();
model.hiddenTasksTypes = getHiddenTaskTypes();

var myConfig = new XML(config.script),
   sorters = [],
   filters = [];

for each(var xmlFilter in myConfig..filter)
{
   filters.push(
   {
      type: xmlFilter.@type.toString(),
      parameters: xmlFilter.@parameters.toString()
   });
}
model.filters = filters;

for each(var xmlSorter in myConfig..sorter)
{
   sorters.push(
   {
      type: xmlSorter.@type.toString(),
      sortField: xmlSorter.@parameters.toString()
   });
}
model.sorters = sorters;
model.maxItems = getMaxItems();