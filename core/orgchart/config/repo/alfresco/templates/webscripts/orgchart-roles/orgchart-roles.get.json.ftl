 <#escape x as jsonUtils.encodeJSONString(x)>
 {
	<#if message?has_content>
	"message": "${message}",
	</#if>
 	"roles":
 	[
		<#if roles??>
 		<#list roles as role>
 		{
 			"name": "${role.definition.name}",
 			"displayName": "${role.definition.displayName}",
 			"weight": "${role.definition.weight}"
 		}<#if role_has_next>,</#if>
 		</#list>
		</#if>
 	]
 }
 </#escape>