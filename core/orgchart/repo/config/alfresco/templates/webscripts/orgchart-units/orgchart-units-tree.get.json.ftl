 <#escape x as jsonUtils.encodeJSONString(x)> 

<#macro renderUnit unit>
 {
 	"name": "${unit.name}",
 	"displayName": "${unit.displayName}",
 	"weight": "${unit.weight}",
 	"groupRef": "${unit.groupRef}",
 	"id": "${unit.id}",
 	"children":
 	[
 		<#list unit.children as child>
 			<@renderUnit child /><#if child_has_next>,</#if>
 		</#list>
 	]
 }
 </#macro>

 {
	<#if message?has_content>
	"message": "${message}",
	</#if>
 	"data":
 	[
		<#if tree??>
 		<@renderUnit tree />
		</#if>
 	]
 }
 </#escape>
