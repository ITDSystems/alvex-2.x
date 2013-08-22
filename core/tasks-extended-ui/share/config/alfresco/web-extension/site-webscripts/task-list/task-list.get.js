<import resource="classpath:alfresco/site-webscripts/org/alfresco/components/workflow/workflow.lib.js">
<import resource="classpath:alfresco/site-webscripts/org/alfresco/components/workflow/filter/filter.lib.js">

model.hiddenTaskTypes = getHiddenTaskTypes();
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
