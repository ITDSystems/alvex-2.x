<#escape x as jsonUtils.encodeJSONString(x)>
{
	"code": "${code}",
	<#if message?has_content>
	"message": "${message}"
	<#else>
	"workflows":
	[
	<#list workflows as workflow>
		{
			"id": "${workflow.id}",
			"status": "${workflow.status}",
			"description": "${workflow.description}",
			"start_date": "${workflow.start_date}",
			"end_date": "${workflow.end_date}",
			"assignees":
			[
				<#list workflow.assignees as person>
				{
					"firstName": "${person.firstName}",
					"lastName": "${person.lastName}",
					"userName": "${person.userName}"
				}<#if person_has_next>,</#if>
				</#list>
			]
		}<#if workflow_has_next>,</#if>
	</#list>
	]
	</#if>
}
</#escape>
