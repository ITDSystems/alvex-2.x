 <#escape x as jsonUtils.encodeJSONString(x)>
 {
	<#if message?has_content>
	"message": "${message}",
	</#if>
 	"data":
 	{
 		"name": "${branch.name}",
 		"displayName": "${branch.displayName}",
 		"id": "${branch.id}"
 	}
 }
 </#escape>