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
		"version": <#if license.version??>"${license.version}"<#else>''</#if>,
		"cores": <#if license.cores??>${license.cores}<#else>''</#if>,
		"users": <#if license.users??>${license.users}<#else>''</#if>,
		"issued": <#if license.issued??>"${license.issued?datetime?iso("UTC")}"<#else>''</#if>,
		"validThru": <#if license.validThru??>"${license.validThru?datetime?iso("UTC")}"<#else>''</#if>,
		"trial": <#if license.trial??>${license.trial?string}<#else>''</#if>
	},
	"licenseStatus":
	{
		"valid": ${licenseStatus.valid?string},
		"reason": "${licenseStatus.reason}"
	},
	"serverStats": {
		"serverCores": "${serverCores}",
		"registeredUsers": "${registeredUsers}"
	}
}
</#escape>
