<#escape x as jsonUtils.encodeJSONString(x)>
{
	<#if message?has_content>
	"message": "${message}"
	<#else>
	"data":
	{
		"systemId": "${systemId}",
		"extensions":
		[
		<#list extensions as extension>
		"${extension}"<#if extension_has_next>,</#if>
		</#list>
		]
	}
	</#if>
}
</#escape>
