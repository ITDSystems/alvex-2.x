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
			"status": "${item.status}",
			"summary": "${item.summary}"
		}<#if item_has_next>,</#if>
		</#list>
		</#if>
	]
}
</#escape>