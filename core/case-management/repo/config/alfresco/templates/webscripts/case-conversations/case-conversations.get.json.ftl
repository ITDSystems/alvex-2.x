<#escape x as jsonUtils.encodeJSONString(x)>
{
	<#if message?has_content>
	"message": "${message}",
	</#if>
	"data": [
		<#list data as item>
		{
			"ref": "${item.ref}",
			"type": "${item.type}",
			"date": "${item.date}",
			"summary": "${item.summary}",
			"details": "${item.details}",
			"people": [
			<#list item.people as person>
				{
					"name": "${person.name}",
					"userName": "${person.userName}",
					"ref": "${person.ref}"
				}<#if person_has_next>,</#if>
			</#list>
			],
			"files": [
			<#list item.files as file>
				{
					"name": "${file.name}",
					"ref": "${file.ref}"
				}<#if file_has_next>,</#if>
			</#list>
			]
		}<#if item_has_next>,</#if>
		</#list>
	]
}
</#escape>