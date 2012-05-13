<#macro build_tree node>{
	"id": "${node.id}",
	"name": "${node.name}",
	<#if node.managers??>
	"managers":
	[
		<#list node.managers as manager>
		{
			"shortName": "${manager.shortName}",
			"name": "${manager.name}"<#if manager.nodeRef??>,
			"nodeRef": "${manager.nodeRef}"</#if>
		}<#if manager_has_next>,</#if>
		</#list>
	],
	</#if>
	<#if node.members??>
	"members":
	[
		<#list node.members as member>
		{
			"shortName": "${member.shortName}",
			"name": "${member.name}"<#if member.nodeRef??>,
			"nodeRef": "${member.nodeRef}"</#if>
		}<#if member_has_next>,</#if>
		</#list>
	],
	</#if>	
	"children": 
	[		
	<#list node.children as child>
	<@build_tree child/><#if child_has_next>,</#if>
	</#list>
	]
}
</#macro>
<#escape x as jsonUtils.encodeJSONString(x)>
{
	<#if data?has_content>
	"data":<@build_tree data/>
	</#if>
}
</#escape>
