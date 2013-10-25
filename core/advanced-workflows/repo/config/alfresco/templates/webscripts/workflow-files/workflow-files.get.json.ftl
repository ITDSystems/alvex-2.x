<#escape x as jsonUtils.encodeJSONString(x)>
{
	<#if message?has_content>
	"message": "${message}"
	<#else>
	"files":
	[
	<#list files as file>
		{
			"nodeRef": "${file.nodeRef}",
			"name": "${file.name}"
		}<#if file_has_next>,</#if>
	</#list>
	]
	</#if>
}
</#escape>
