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
			"id": "${role.id}",
 			"name": "${role.name}",
 			"displayName": "${role.displayName}",
 			"groupName": "${role.groupName}",
 			"weight": "${role.weight}"
 		}<#if role_has_next>,</#if>
 		</#list>
		</#if>
 	]
 }
 </#escape>