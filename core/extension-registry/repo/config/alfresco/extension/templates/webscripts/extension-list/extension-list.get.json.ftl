<#escape x as jsonUtils.encodeJSONString(x)>
{
	<#if message?has_content>
	"message": "${message}"
	<#else>
	"data":
	{
		"systemId": "${systemId}",
		"edition": "${edition}",
		"version": "${version}",
		"extensions":
		[
			<#list extensions as extension>
			{
				"id": "${extension.id}",
				"repoVersion": "${extension.version}",
				"repoEdition": "${extension.edition}",
				"repoHashes":
				[
					<#list extension.hashes as hashEntry>
					{
						"file": "${hashEntry.file}",
						"hash": "${hashEntry.hash}"
					}<#if hashEntry_has_next>,</#if>
					</#list>
				]
			}<#if extension_has_next>,</#if>
			</#list>
		]
	}
	</#if>
}
</#escape>
