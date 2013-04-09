<#escape x as jsonUtils.encodeJSONString(x)>
{
	<#if message?has_content>
	"message": "${message}"
	</#if>
	"masterData":
	[
	<#list masterData as item>
		{
			"type": "${item.type}",
			"dlRef": "${item.dlRef}",
			"dlField": "${item.dlField}",
			"clRef": "${item.clRef}",
			"clField": "${item.clField}"
		}<#if item_has_next>,</#if>
	</#list>
	]
}
</#escape>
