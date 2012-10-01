<#escape x as jsonUtils.encodeJSONString(x)>
{
	"workflows" : 
	[
		<#list workflows as workflow>
		{
			"name": "${workflow.name}"
		}<#if workflow_has_next>,</#if>
		</#list>
	]
}
</#escape>