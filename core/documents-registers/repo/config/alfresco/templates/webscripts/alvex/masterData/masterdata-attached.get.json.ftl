<#escape x as jsonUtils.encodeJSONString(x)>
{
	<#if message?has_content>
	"message": "${message}"
	</#if>
	"config":
	[
	<#list data as item>
		{
			"field": "${item.field}",
			"datasource": "${item.datasource}"
		}<#if item_has_next>,</#if>
	</#list>
	]
}
</#escape>
