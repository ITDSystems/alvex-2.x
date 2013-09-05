<#escape x as jsonUtils.encodeJSONString(x)>
{
	<#if message?has_content>
	"message": "${message}"
	</#if>
	"data":
	[
		<#if nodes??>
		<#list nodes as node>
		{
			"workflow": 
			{
				"id": "${node.workflowInstance.id}",
				"description": "${node.workflowInstance.description}"
			},
			"case":
			{
				"shortName": "${node.caseSite.shortName}",
				"title": "${node.caseSite.title}",
				"description": "${node.caseSite.description}"
			}
		}<#if node_has_next>,</#if>
		</#list>
		</#if>
	]
}
</#escape>