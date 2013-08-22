<#escape x as jsonUtils.encodeJSONString(x)>
{
 	"data":
 	{
		"people":
		[
		<#if results??>
 		<#list results as person>
 		{
			"userName": "${person.userName}",
			"firstName": "${person.firstName}",
			"lastName": "${person.lastName}",
			"name": "${person.fullName}",
			"nodeRef": "${person.nodeRef}"
		}<#if person_has_next>,</#if>  
		</#list>
		</#if>
		]
 	}
}
</#escape>
