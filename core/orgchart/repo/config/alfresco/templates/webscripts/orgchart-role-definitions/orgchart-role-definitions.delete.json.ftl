 <#escape x as jsonUtils.encodeJSONString(x)>
 {
	<#if message?has_content>
	"message": "${message}"<#if details?has_content>,</#if>
	</#if>
	<#if details?has_content>
	"details": "${details}"
	</#if>
 }
 </#escape>