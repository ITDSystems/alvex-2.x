<#escape x as jsonUtils.encodeJSONString(x)>
{
	"code": "${code}",
	<#if message?has_content>
	"message": "${message}"
	<#else>
	"data":
	[
		<#list data as view>
		{
		"id": "${view.shortName}",
		"description": "${view.displayName}"<#if view.nodeRef??>,
		"nodeRef": "${view.nodeRef}"</#if>
		}<#if view_has_next>,</#if>
		</#list>
	]
	</#if>
}
</#escape>
