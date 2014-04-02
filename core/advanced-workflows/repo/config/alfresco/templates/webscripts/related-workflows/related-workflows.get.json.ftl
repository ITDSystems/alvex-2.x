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
				"description": "${node.workflowInstance.description}",
				"status": "${node.workflowInstance.status}",
				"startDate": "${node.workflowInstance.startDate}",
				"endDate": "${node.workflowInstance.endDate}",
				"dueDate": "${node.workflowInstance.dueDate}",
				"assignees":
				[
					<#list node.workflowInstance.assignees as person>
					{
						"firstName": "${person.properties.firstName}",
						"lastName": "${person.properties.lastName}",
						"userName": "${person.properties.userName}"
					}<#if person_has_next>,</#if>
					</#list>
				]
			},
			"relatedWorkflow": 
			{
				"id": "${node.relatedWorkflow.id}",
				"description": "${node.relatedWorkflow.description}",
				"status": "${node.relatedWorkflow.status}",
				"startDate": "${node.relatedWorkflow.startDate}",
				"endDate": "${node.relatedWorkflow.endDate}",
				"dueDate": "${node.relatedWorkflow.dueDate}",
				"assignees":
				[
					<#list node.relatedWorkflow.assignees as person>
					{
						"firstName": "${person.properties.firstName}",
						"lastName": "${person.properties.lastName}",
						"userName": "${person.properties.userName}"
					}<#if person_has_next>,</#if>
					</#list>
				]
			}
		}<#if node_has_next>,</#if>
		</#list>
		</#if>
	]
}
</#escape>