<#escape x as jsonUtils.encodeJSONString(x)>
{
	"version": "${version}",
	"edition": "${edition}",
	"codename": "${codename}",
	"stats": {
		"serverCores": "${serverCores}",
		"registeredUsers": "${registeredUsers}"
	}
}
</#escape>
