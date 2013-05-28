 <#escape x as jsonUtils.encodeJSONString(x)> 
 {
	<#if message?has_content>
	"message": "${message}",
	</#if>
 	"data":
 	[
	<#list roleInsts as ri>
		{
			"role": "${ri.role}",
			"unit": "${ri.unit}",
			"unitId": "${ri.id}"
		}<#if ri_has_next>,</#if>
	</#list>
 	]
 }
 </#escape>
