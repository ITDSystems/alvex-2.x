<#escape x as jsonUtils.encodeJSONString(x)>
{
	<#if message?has_content>
	"message": "${message}"
	</#if>
	"dataSource":
	{
		"name": "${source.properties["cm:name"]}",
		"type": "${source.properties["alvexmd:sourceType"]}",
		"nodeRef": "${source.nodeRef.toString()}"
	}
}
</#escape>
