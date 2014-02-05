<#escape x as jsonUtils.encodeJSONString(x)>
{
	<#if message?has_content>
	"status": "failed",
	"message": "${message}"
	<#else>
	"status": "ok"
	</#if>
}
</#escape>
