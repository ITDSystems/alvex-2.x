<#escape x as jsonUtils.encodeJSONString(x)>
{
	<#if nodeRef?has_content>
	"nodeRef": "${nodeRef}",
	</#if>
	<#if name?has_content>
	"name": "${name}"
	</#if>
	<#if message?has_content>
	"message": "${message}"
	</#if>
}
</#escape>
