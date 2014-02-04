<#escape x as jsonUtils.encodeJSONString(x)>
{
	"items":
	[
	<#list regs as item>
		{
			"name": "${item.name}",
			"nodeRef": "${item.ref}"
		}<#if item_has_next>,</#if>
	</#list>
	]
}
</#escape>