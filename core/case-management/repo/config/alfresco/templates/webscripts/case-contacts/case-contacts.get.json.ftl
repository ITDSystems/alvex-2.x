<#escape x as jsonUtils.encodeJSONString(x)>
{
	<#if message?has_content>
	"message": "${message}",
	</#if>
	"data": [
		<#if data??>
		<#list data as item>
		{
			"ref": "${item.ref}",
			"firstName": "${item.firstName}",
			"lastName": "${item.lastName}",
			"company": "${item.company}",
			"position": "${item.position}",
			"phone": "${item.phone}",
			"email": "${item.email}"
		}<#if item_has_next>,</#if>
		</#list>
		</#if>
	]
}
</#escape>