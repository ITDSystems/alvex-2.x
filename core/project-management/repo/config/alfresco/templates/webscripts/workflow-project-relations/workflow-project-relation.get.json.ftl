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
			"project":
			{
				"shortName": "${node.projectSite.shortName}",
				"title": "${node.projectSite.title}",
				"description": "${node.projectSite.description}"
			}
		}<#if node_has_next>,</#if>
		</#list>
		</#if>
	]
}
</#escape>