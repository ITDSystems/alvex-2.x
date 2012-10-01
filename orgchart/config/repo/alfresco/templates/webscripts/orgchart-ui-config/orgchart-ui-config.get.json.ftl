<#escape x as jsonUtils.encodeJSONString(x)>
{
	"config":
	{
		"configNodeRef": "${data.configNodeRef}",
		"showUnitsRecursively": "${data.showUnitsRecursively}",
		"viewType": "${data.viewType}",
		"defaultRoleName": "${data.defaultRoleName}"
	}
}
</#escape>