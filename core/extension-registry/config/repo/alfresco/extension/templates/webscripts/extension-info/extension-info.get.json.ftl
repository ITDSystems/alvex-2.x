<#escape x as jsonUtils.encodeJSONString(x)>
{
	<#if message?has_content>
	"message": "${message}"
	<#else>
	"data":
	{
		"id": "${id}",
		"version": "${version}",
		"hashes":
		[
			<#list hashes as hashEntry>
			{
				"file": "${hashEntry.file}",
				"hash": "${hashEntry.hash}"
			}<#if hashEntry_has_next>,</#if>
			</#list>
		]
	}
	</#if>
}
</#escape>	
