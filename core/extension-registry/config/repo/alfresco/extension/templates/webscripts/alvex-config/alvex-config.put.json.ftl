<#escape x as jsonUtils.encodeJSONString(x)>
{
	"status": "${code}"<#if message??>,
	"message": "${message}"</#if>
}
</#escape>