<#escape x as jsonUtils.encodeJSONString(x)>
{
	"dlRef": "${dlRef!""}",
	"createMode": "${createMode!"combined"}",
	"allowEdit": ${(allowEdit!false)?string}
}
</#escape>
