<#escape x as jsonUtils.encodeJSONString(x)>
{
	"version": "${version}",
	"edition": "${edition}",
	"codename": "${codename}",
 	"license":
	{
		"id": <#if license.id??>"${license.id}"<#else>''</#if>,
		"owner": <#if license.owner??>"${license.owner}"<#else>''</#if>,
		"product": <#if license.product??>"${license.product}"<#else>''</#if>,
		"edition": <#if license.edition??>"${license.edition}"<#else>''</#if>,
		"cores": <#if license.cores??>${license.cores}<#else>''</#if>,
		"issued": <#if license.issued??>"${license.issued?datetime?iso("UTC")}"<#else>''</#if>,
		"validThru": <#if license.validThru??>"${license.validThru?datetime?iso("UTC")}"<#else>''</#if>,
		"trial": <#if license.trial??>${license.trial?string}<#else>''</#if>
	},
	"licenseStatus":
	{
		"valid": ${licenseStatus.valid?string},
		"reason": "${licenseStatus.reason}"
	}
}
</#escape>