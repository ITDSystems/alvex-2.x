<#escape x as jsonUtils.encodeJSONString(x)>
{
	"type": "${type.type}",
	"title": "${type.title}",
	"fields": [
		<#list type.fields as f>
		{
			"name": "${f.name}",
			<#if f.allowedValues??>
			"allowedValues": [
				<#list f.allowedValues as val>
				{
					"value": "${val.value}",
					"label": "${val.label!""}"
				}<#if val_has_next>,</#if>
				</#list>
			],
			</#if>
			"title": "${f.title!""}"
		}<#if f_has_next>,</#if>
		</#list>
	],
	"assocs": [
		<#list type.assocs as a>
		{
			"name": "${a.name}",
			"title": "${a.title!""}"
		}<#if a_has_next>,</#if>
		</#list>
	]
}
</#escape>
