 <#escape x as jsonUtils.encodeJSONString(x)>
 {
	<#if message?has_content>
	"message": "${message}",
	</#if>
 	"data":
 	{
		<#if unit??>
 		"name": "${unit.name}",
		"weight": "${unit.weight}",
		"displayName": "${unit.displayName}",
		"id": "${unit.id}"
		</#if>
	}
 }
 </#escape>