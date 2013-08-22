<#escape x as jsonUtils.encodeJSONString(x)>
{
	"config":
	{
		"configNodeRef": "${data.configNodeRef}",
		"syncSource": "${data.syncSource}",
		"syncRootGroupName": "${data.syncRootGroupName}"
	}
}
</#escape>
