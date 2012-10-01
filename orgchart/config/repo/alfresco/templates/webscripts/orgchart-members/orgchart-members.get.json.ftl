 <#escape x as jsonUtils.encodeJSONString(x)>
 {
	<#if message?has_content>
	"message": "${message}",
	</#if>
 	"members":
 	[
		<#if members??>
 		<#list members as person>
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