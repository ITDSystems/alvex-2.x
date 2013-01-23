 <#escape x as jsonUtils.encodeJSONString(x)>
 {
  	"data":
 	{
 		"id": "${license.id}",
 		"owner": "${license.owner}",
 		"cores": ${license.cores},
 		"edition": ${license.edition},
 		"product": "${license.product}",
 		"issued": "${license.issued?datetime?iso("UTC")}",
 		"validThru": "${license.validThru?datetime?iso("UTC")}",
 		"valid": ${license.valid?string}, 
 		"trial": ${license.trial?string}
 	}
 }
 </#escape>