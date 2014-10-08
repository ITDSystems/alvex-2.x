<#escape x as jsonUtils.encodeJSONString(x)>
{
	<#if message?has_content>
	"message": "${message}"
	</#if>
	"dataSources":
	[
	<#list sources as item>
		{
			"name": "${item.properties["cm:name"]}",
			"type": "${item.properties["alvexmd:sourceType"]}",
			"nodeRef": "${item.nodeRef.toString()}"
		}<#if item_has_next>,</#if>
	</#list>
	]
}
</#escape>
