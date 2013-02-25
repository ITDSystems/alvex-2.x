<#escape x as jsonUtils.encodeJSONString(x)>
{
	"mode": "${form.mode}",
	"fields":
	[
	<#list form.structure as item>
		<#if item.kind == "set">
			<#list item.children as field>
			{
				"name": "${form.fields[field.id].configName}",
				"label": "${form.fields[field.id].label}",
				"control": "${form.fields[field.id].control.template}"
			}<#if field_has_next>,</#if>
			</#list>
		<#else>
		{
			"name": "${form.fields[item.id].configName}",
			"label": "${form.fields[item.id].label}",
			"control": "${form.fields[item.id].control.template}"
		}</#if><#if item_has_next>,</#if>
	</#list>
	]
}
</#escape>
