<#escape x as jsonUtils.encodeJSONString(x)>
{
	"code": "${code}",
	<#if message?has_content>
	"message": "${message}"
	<#else>
	"data":
	[
		<#list data as item>
		{
			"group": "${item.group}",
			"managees":
			[
				<#list item.managees as managee>
				{
					"shortName": "${managee.shortName}",
					"name": "${managee.name}"<#if managee.nodeRef??>,
					"nodeRef": "${managee.nodeRef}"</#if>
				}<#if managee_has_next>,</#if>
				</#list>
			]
		}<#if item_has_next>,</#if>
		</#list>
	]
	</#if>
}
</#escape>
