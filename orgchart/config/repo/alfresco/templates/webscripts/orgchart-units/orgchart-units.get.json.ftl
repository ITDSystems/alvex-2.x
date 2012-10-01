<#escape x as jsonUtils.encodeJSONString(x)>
{
	<#if message?has_content>
	"message": "${message}",
	</#if>
 	"data":
 	{
 		"name": "${unit.name}",
		"weight": "${unit.weight}",
		"displayName": "${unit.displayName}",
		"id": "${unit.id}",
		"people":
		[
		<#if unit.people??>
 		<#list unit.people as person>
 		{
			"userName": "${person.userName}",
			"firstName": "${person.firstName}",
			"lastName": "${person.lastName}",
			"name": "${person.lastName}, ${person.firstName}",
			"nodeRef": "${person.nodeRef}",
			"roleName": "${person.roleName}",
			"roleDisplayName": "${person.roleDisplayName}"
		}<#if person_has_next>,</#if>  
		</#list>
		</#if>
		]

 	}
}
 </#escape>