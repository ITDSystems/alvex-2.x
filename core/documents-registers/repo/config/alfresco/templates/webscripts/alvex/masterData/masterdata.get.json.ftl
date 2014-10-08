<#escape x as jsonUtils.encodeJSONString(x)>
{
	<#if message?has_content>
	"message": "${message}"
	</#if>
	"dataSource": "${srcName}",
	"masterData":
	[
	<#list data as item>
		{
			"ref": "${item.ref}",
			"value": "${item.value}",
			"label": "${item.label}"
		}<#if item_has_next>,</#if>
	</#list>
	]
}
</#escape>
