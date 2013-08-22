<#escape x as jsonUtils.encodeJSONString(x)>
{
	"groups" :
	[
<#list groups as group>
		{
			shortName: "${group.shortName}",
			fullName: "${group.fullName}",
			displayName: <#if group.displayName != "default">"${group.displayName}"<#else>"${msg("wsa.all_users_group")}"</#if>
		}<#if group_has_next>,</#if>
</#list>
	]
}
</#escape>
