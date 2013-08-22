 <#escape x as jsonUtils.encodeJSONString(x)>
 {
	<#if message?has_content>
	"message": "${message}",
	</#if>
 	"assignees":
 	[
		<#if assignees??>
 		<#list assignees as person>
 		{
 			"firstName": "${person.firstName}",
 			"lastName": "${person.lastName}",
 			"userName": "${person.userName}",
 			"nodeRef": "${person.nodeRef?string}"
 		}<#if branch_has_next>,</#if>
 		</#list>
		</#if>
 	]
 }
 </#escape>