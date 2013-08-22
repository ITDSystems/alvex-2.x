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
			"active": "${workflow.active}",
			"description": "${workflow.description}",
			"start_date": "${workflow.start_date}",
			"end_date": "${workflow.end_date}"
		}<#if workflow_has_next>,</#if>
	</#list>
	]
	</#if>
}
</#escape>
