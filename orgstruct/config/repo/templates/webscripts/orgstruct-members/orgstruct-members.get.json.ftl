<#escape x as jsonUtils.encodeJSONString(x)>
{
	"code": "${code}",
	<#if message?has_content>
	"message": "${message}"
	<#else>
	"data":
	[
		<#list data as item>
		{
			"shortName": "${item.shortName}",
			"name": "${item.name}"<#if item.nodeRef??>,
			"nodeRef": "${item.nodeRef}"</#if>
		}<#if item_has_next>,</#if>
		</#list>
	]
	</#if>
}
</#escape>
