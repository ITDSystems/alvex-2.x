 <#escape x as jsonUtils.encodeJSONString(x)>
 {
	<#if message?has_content>
	"message": "${message}",
	</#if>
 	"managees":
 	[
		<#if managees??>
 		<#list managees as person>
 		{
			"userName": "${person.userName}",
			"firstName": "${person.firstName}",
			"lastName": "${person.lastName}",
			"nodeRef": "${person.node?string}", 
			"name": "${person.lastName}, ${person.firstName}"
 		}<#if person_has_next>,</#if>
 		</#list>
		</#if>
 	]
 }
 </#escape>