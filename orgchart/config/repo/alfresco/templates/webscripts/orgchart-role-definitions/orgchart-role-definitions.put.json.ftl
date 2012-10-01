 <#escape x as jsonUtils.encodeJSONString(x)>
 {
	<#if message?has_content>
	"message": "${message}",
	</#if>
 	"data":
 	{
 		"name": "${role.name}",
 		"displayName": "${role.displayName}",
 		"weight": "${role.weight}"
 	}
 }
 </#escape>