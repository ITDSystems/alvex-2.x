<#import "/org/alfresco/components/workflow/workflow.lib.ftl" as workflow/>
<#import "/org/alfresco/components/workflow/filter/filter.lib.ftl" as filter/>
<#assign el=args.htmlid?html>
<div id="${el}-body" class="task-list hidden">
   <div class="yui-g task-list-bar flat-button theme-bg-color-1">
      <div class="yui-u first hidden">
         <h2 id="${el}-filterTitle" class="thin" style="float:left">
            &nbsp;
         </h2>
         <span class="align-left yui-button yui-menu-button" id="${el}-sorters">
            <span class="first-child">
               <button type="button" tabindex="0"></button>
            </span>
         </span>
         <select id="${el}-sorters-menu">
         <#list sorters as sorter>
            <option value="${sorter.type?html}">${msg("sorter." + sorter.type)}</option>
         </#list>
         </select>
      </div>
      <div class="yui-u">
         <div id="${el}-paginator" class="paginator">&nbsp;</div>
      </div>
   </div>
   <div id="${el}-tasks" class="tasks"></div>
</div>

<script type="text/javascript">//<![CDATA[
(function()
{
   new Alvex.TaskList("${el}").setOptions(
   {
      filterParameters: <@filter.jsonParameterFilter filterParameters />,
      hiddenTaskTypes: <@workflow.jsonHiddenTaskTypes hiddenTaskTypes/>,
      hiddenWorkflowsNames: [<#list hiddenWorkflowsNames as workflow>"${workflow}"<#if workflow_has_next>, </#if></#list>],
      maxItems: ${maxItems!"50"},
      sorters:
      {<#list sorters as sorter>
         "${sorter.type?js_string}": "${sorter.sortField?js_string}"<#if sorter_has_next>,</#if>
      </#list>}
   }).setMessages(
      ${messages}
   );
})();
//]]></script>

<@markup id="css" >
   <#-- CSS Dependencies -->
   <@link href="${url.context}/res/components/alvex/task-list-header.css" group="workflow"/>
</@>

<@markup id="js">
   <#-- JavaScript Dependencies -->
   <@script src="${url.context}/res/components/alvex/task-list-header.js" group="workflow"/>
   <@script src="${url.context}/res/modules/simple-dialog.js" group="workflow"/>
</@>

<@markup id="widgets">
   <@createWidgets group="workflow"/>
</@>


<#include "/form.get.head.ftl">

<#assign id = args.htmlid>
<!--[if IE]>
   <iframe id="yui-history-iframe" src="${url.context}/res/yui/history/assets/blank.html"></iframe> 
<![endif]-->
<input id="yui-history-field" type="hidden" />

<span id="${id}-body" class="task-list-toolbar toolbar">
   <span class="header-actions hidden">
      <span class="hideable">
         <span class="start-workflow"><button id="${id}-startWorkflow-button" name="startWorkflow">${msg("button.startWorkflow")}</button></span>
         <select id="${id}-startWorkflow-button-menu"></select>
         </span>
      </span>
   </span>
</span>

<#include "/alvex-datagrid.inc.ftl">
<@renderAlvexDatagridHTML id true false false true false/>

<script type="text/javascript">//<![CDATA[
   var dg = new Alvex.DataGrid('${id}').setOptions(
   {
      waitListChangeEvent: false,
      workflowsAvailable: "${(workflowsAvailable!false)?string}",
      usePagination: ${(args.pagination!false)?string}
   }).setMessages(${messages});

   dg.DATASOURCE_METHOD = "GET";
   dg.ITEM_KEY = "id";
   dg.DEFAULT_ACTION = "onActionEdit";
   
   dg.getColumnsConfigUrl = function(meta)
   {
      return Alfresco.util.combinePaths(Alfresco.constants.URL_SERVICECONTEXT, "alvex/components/tasks/config/columns");
   };

   dg.getPrefsStoreId = function(meta)
   {
      return "com.alvexcore.datagrid.tasks.page";
   };
	  
   dg.getDataSource = function(meta)
   {
      return new YAHOO.util.DataSource(Alfresco.constants.PROXY_URI + "api/alvex/task-instances-simple",
         {
            responseType: YAHOO.util.DataSource.TYPE_JSON,
            responseSchema:
            {
               resultsList: "items",
               metaFields:
               {
                  paginationRecordOffset: "startIndex",
                  totalRecords: "totalRecords"
               }
            }
         });
   };
	  
   dg._buildDataGridParams = function(p_obj)
   {
      var req = [];
      // We skip 'special' fields without namespaces
      for( var i = 0; i < this.dataRequestFields.length; i++ )
         if( this.dataRequestFields[i].match("_") )
            req.push(this.dataRequestFields[i]);

      var reqFilter = [];
      if (p_obj && p_obj.filter && p_obj.filter.searchFields)
      {
         for (var field in p_obj.filter.searchFields.props)
            if( field != "eventGroup" && p_obj.filter.searchFields.props[field] != "" )
            {
               var val = p_obj.filter.searchFields.props[field];
               var re = /\[(\d{4})\\-(\d+)\\-(\d+)T00:00:00.*(\d{4})\\-(\d+)\\-(\d+)T23:59:59\]/;
               val = val.replace(re, "$1-$2-$3-$4-$5-$6");
               reqFilter.push(field + ":" + val);
            }
         for (var field in p_obj.filter.searchFields.assocs)
            if( field != "eventGroup" && p_obj.filter.searchFields.assocs[field] != "" )
               reqFilter.push(field + ":" + p_obj.filter.searchFields.assocs[field]);
      }

      return "?authority=" + Alfresco.constants.USERNAME
            + "&properties=" + req.join(",") 
            + "&filter=search&query=" + reqFilter.join(",") 
            + "&exclude=wcmwf:*&skipCount=0";
   };
	  
   dg.getSearchFormUrl = function(meta)
   {
      return Alfresco.util.combinePaths(Alfresco.constants.PROXY_URI, "api/alvex/dictionary/bpm");
   }; 

   dg.onChangeFilterInterceptor = function(layer, args)
   {
      if(layer != "changeFilter")
         return;
      var filter = args[1];

      var config = {};
      config.dataObj = {};
      config.dataObj.fields = this.dataRequestFields;
      config.dataObj.filter = {
         eventGroup: this, 
         filterId: filter.filterId, 
         filterData: filter.filterData, 
         searchFields: { props: {}, assocs: {} }
      };
      if( filter.filterId == "due" )
      {
         var start = new Date();
         var end = new Date();
         if( filter.filterData == "today" )
         {
         }
         if( filter.filterData == "tomorrow" )
         {
            start.setDate(start.getDate()+1);
            end.setDate(end.getDate()+1);
         }
         if( filter.filterData == "next7Days" )
         {
            start.setDate(start.getDate()+1);
            end.setDate(end.getDate()+7);
         }
         if( filter.filterData == "overdue" )
         {
            start.setDate(start.getDate()-365*10);
            end.setDate(end.getDate()-1);
         }
         if( filter.filterData == "noDate" )
         {
            start = end = null;
         }
         if( start != null && end != null )
         {
            var sY = start.getFullYear();
            var sM = start.getMonth() + 1;
            var sD = start.getDate();
            var eY = end.getFullYear();
            var eM = end.getMonth() + 1;
            var eD = end.getDate();
            config.dataObj.filter.searchFields.props.bpm_dueDate 
               = "[" + sY + "\\-" + sM + "\\-" + sD + "T00:00:00 TO " + eY + "\\-" + eM + "\\-" + eD + "T23:59:59]";
         }
         else
         {
            config.dataObj.filter.searchFields.props.bpm_dueDate = "NULL";
         }
      }
      if( filter.filterId == "priority" )
      {
         config.dataObj.filter.searchFields.props.bpm_priority = filter.filterData;
      }
      if( filter.filterId == "assignee" )
      {
         if( filter.filterData == "unassigned" )
            config.dataObj.filter.searchFields.props.pooledTasksOnly = "true";
         else
            config.dataObj.filter.searchFields.props.pooledTasksOnly = "false";
      }
      if( filter.filterId == "workflows" )
      {
         if( filter.filterData == "active" )
         {
            config.dataObj.filter.searchFields.props.workflowState = "IN_PROGRESS";
         }
         else if( filter.filterData == "completed" )
         {
            config.dataObj.filter.searchFields.props.workflowState = "COMPLETED";
            config.dataObj.filter.searchFields.props.pooledTasksOnly = "false";
         }
      }
      this._updateDataGrid(config.dataObj);
   };
//]]></script>