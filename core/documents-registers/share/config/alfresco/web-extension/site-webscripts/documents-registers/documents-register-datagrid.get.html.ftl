<#include "/form.get.head.ftl">

<#assign id = args.htmlid>
<!--[if IE]>
   <iframe id="yui-history-iframe" src="${url.context}/res/yui/history/assets/blank.html"></iframe> 
<![endif]-->
<input id="yui-history-field" type="hidden" />

<#include "/alvex-datagrid.inc.ftl">
<@renderAlvexDatagridHTML id />

<script type="text/javascript">//<![CDATA[
   var dg = new Alvex.DataGrid('${id}').setOptions(
   {
      workflowsAvailable: "${(workflowsAvailable!false)?string}",
      usePagination: ${(args.pagination!false)?string}
   }).setMessages(${messages});

   dg.DATASOURCE_METHOD = "POST";
   dg.ITEM_KEY = "nodeRef";
   
   dg.getColumnsConfigUrl = function(meta)
   {
      return Alfresco.util.combinePaths(Alfresco.constants.URL_SERVICECONTEXT, "alvex/components/data-lists/config/columns?itemType=" + encodeURIComponent(meta.itemType));
   };

   dg.getPrefsStoreId = function(meta)
   {
      return "com.alvexcore.datagrid.docreg." + meta.nodeRef;
   };
	  
   dg.getDataSource = function(meta)
   {
      var listNodeRef = new Alfresco.util.NodeRef(meta.nodeRef);
      return new YAHOO.util.DataSource(Alfresco.constants.PROXY_URI + "api/alvex/datalists/search/node/" + listNodeRef.uri,
         {
            connMethodPost: true,
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
      var request =
      {
         fields: this.dataRequestFields
      };
      
      if (p_obj && p_obj.filter)
      {
         request.filter = {}
         for (var field in p_obj.filter)
            if( field != "eventGroup" )
               request.filter[field] = p_obj.filter[field];
      }

      return request;
   };
	  
   dg.getSearchFormUrl = function(meta)
   {
      return Alfresco.util.combinePaths(Alfresco.constants.PROXY_URI, "api/alvex/dictionary?type=" + encodeURIComponent(meta.itemType));
   }; 

//]]></script>