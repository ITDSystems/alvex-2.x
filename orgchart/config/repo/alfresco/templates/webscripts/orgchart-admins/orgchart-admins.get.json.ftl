 <#escape x as jsonUtils.encodeJSONString(x)>
 {
	<#if message?has_content>
	"message": "${message}",
	</#if>
 	"data":
 	[
		<#if admins??>
 		<#list admins as person>
 		{
			"userName": "${person.userName}",
			"firstName": "${person.firstName}",
			"lastName": "${person.lastName}",
			"nodeRef": "${person.node?string}", 	
 		}<#if person_has_next>,</#if>
 		</#list>
		</#if>
 	]
 }
 </#escape>