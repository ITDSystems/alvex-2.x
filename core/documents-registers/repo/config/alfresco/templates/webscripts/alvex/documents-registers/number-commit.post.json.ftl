<#escape x as jsonUtils.encodeJSONString(x)>
{
	"success": ${success?string},
	"reason": "${reason}",
	"id": "${id}",
	"ref": "${ref}"
}
</#escape>