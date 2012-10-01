<#escape x as jsonUtils.encodeJSONString(x)>
[
	<#list data as item>
	{
		<#list item?keys as key>
		"${key}": "${item[key]}"<#if key_has_next>,</#if>
		</#list>
	}<#if item_has_next>,</#if>
	</#list>
]
</#escape>