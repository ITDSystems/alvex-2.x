 <#escape x as jsonUtils.encodeJSONString(x)>
 {
 	"version": "${version}",
 	"edition": "${edition}",
 	"codename": "${codename}",
  	"license":
 	{
 		"id": "${license.id}",
 		"owner": "${license.owner}",
 		"cores": ${license.cores},
 		"edition": ${license.edition},
 		"product": "${license.product}",
 		"issued": <#if license.issued??>"${license.issued?datetime?iso("UTC")}"<#else>''</#if>,
 		"validThru": "${license.validThru?datetime?iso("UTC")}",
 		"valid": ${license.valid?string},
 		"trial": ${license.trial?string}
 	}
 }
 </#escape>
