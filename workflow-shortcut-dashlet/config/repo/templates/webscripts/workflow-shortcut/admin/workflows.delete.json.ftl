<#escape x as jsonUtils.encodeJSONString(x)>
{
	"code": "${code}",
	<#if message?has_content>
		"message": "${message}"
	</#if>
}
</#escape>
