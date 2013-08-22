 <#escape x as jsonUtils.encodeJSONString(x)>
 {
	<#if message?has_content>
	"message": "${message}",
	</#if>
 	"branches":
 	[
		<#if branches??>
 		<#list branches as branch>
 		{
 			"name": "${branch.name}",
 			"id": "${branch.id}"
 		}<#if branch_has_next>,</#if>
 		</#list>
		</#if>
 	]
 }
 </#escape>