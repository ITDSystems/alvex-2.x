<#escape x as jsonUtils.encodeJSONString(x)>
{
   "container": "${datalists.container.nodeRef?string}",
   "permissions":
   {
      "create": ${datalists.container.hasPermission("CreateChildren")?string}
   },
   "datalists":
   [
   <#list datalists.lists as list>
      {
         "name": "${list.dl.name}",
         "title": "${list.dl.properties.title!list.dl.name}",
         "description": "${list.dl.properties.description!""}",
         "nodeRef": "${list.dl.nodeRef}",
         "itemType": "${list.dl.properties["dl:dataListItemType"]!""}",
         "itemTypeTitle": "${list.typeTitle!""}",
         "permissions":
         {
            "edit": ${list.dl.hasPermission("Write")?string},
            "delete": ${list.dl.hasPermission("Delete")?string}
         }
      }<#if list_has_next>,</#if>
   </#list>
   ]
}
</#escape>