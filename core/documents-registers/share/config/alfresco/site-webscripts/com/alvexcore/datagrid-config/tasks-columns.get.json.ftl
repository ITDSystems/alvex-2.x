<#escape x as jsonUtils.encodeJSONString(x)>
{
<#if error??>
   "error": "${error}"
<#else>
   "columns":
   [
   <#list columns as col>
      {
         "renderer": "${col.renderer}",
      <#if col.showByDefault?? && col.showByDefault>
         "showByDefault": true,
      </#if>
      <#if col.isSortKey?? && col.isSortKey>
         "isSortKey": true,
      </#if>
      <#if col.sortOrder??>
         "sortOrder": "${col.sortOrder}",
      </#if>
      <#if col.isItemName?? && col.isItemName>
         "isItemName": true,
      </#if>
         "type": "${col.type}",
         "name": "${col.name}",
         "formsName": "<#if col.type == "association">assoc<#else>prop</#if>_${col.name?replace(":", "_")}",
      <#if col.width??>
         "width": ${col.width},
      </#if>
      <#if col.label??>
         "label": "${col.label!""}",
      </#if>
      <#if col.labelid??>
         "label-id": "${col.labelid!""}",
      </#if>
      <#if col.dataType??>
         "dataType": "${col.dataType}"
      <#else>
         "dataType": "${col.endpointType}"
      </#if>
      }<#if col_has_next>,</#if>
   </#list>
   ]
</#if>
}
</#escape>
