<#escape x as jsonUtils.encodeJSONString(x)>
{
	"dls":
	[
		<#list dls as dl>
		{
			"siteTitle": "${dl.siteTitle}",
			"siteName": "${dl.siteName}",
			"listTitle": "${dl.listTitle}",
			"itemType": "${dl.itemType}",
			"nodeRef": "${dl.nodeRef}"
		}<#if dl_has_next>,</#if>
		</#list>
	]
}
</#escape>
