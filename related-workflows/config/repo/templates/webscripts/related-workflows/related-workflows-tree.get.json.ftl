<#macro workflow_details wf>
		{
			"id": "${wf.id}",
			"active": "${wf.active}",
<#--			"description": "${wf.description}", -->
			"name": "${wf.description}",
			"start_date": "${wf.start_date}",
			"end_date": "${wf.end_date}",
<#--			"relatedWorkflows": -->
			"children":			
			[
				<#list wf.relatedWorkflows as x>
				<@workflow_details x />
				<#if x_has_next>,</#if>
				</#list>			
			]
		}
</#macro>

<#escape x as jsonUtils.encodeJSONString(x)>
{
	"code": "${code}",
	<#if message?has_content>
	"message": "${message}"
	<#else>
	"data":
	{
		"id": "${data.id}",
		"name": "${data.name}",
		"children":
		[
			<#list data.workflows as workflow>
			<@workflow_details workflow />
			<#if workflow_has_next>,</#if>
			</#list>
		]
	}
	</#if>
}
</#escape>
