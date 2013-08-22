<#escape x as jsonUtils.encodeJSONString(x)>
{
	"data":
	[
		<#list defs as def>
		{
			"name": "${def.name}",
			"title": "${def.title}"
		}<#if def_has_next>,</#if>
		</#list>
	]
}
</#escape>