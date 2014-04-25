<#escape x as jsonUtils.encodeJSONString(x)>
{
	"parents": 	[
		<#list parentItems as item>
		{
			"itemRef": "${item.itemRef}",
			"siteName": "${item.siteName}"
		}<#if item_has_next>,</#if>
		</#list>
	]
}
</#escape>