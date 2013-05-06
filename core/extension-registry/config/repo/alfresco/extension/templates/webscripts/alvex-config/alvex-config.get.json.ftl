<#macro renderVariable v>
	<#compress>
		<#-- Add support for more variables here -->
		<#-- TODO: should it be moved to some library template? -->
		<#if v?is_string>
			"${v}"
		<#elseif v?is_number>
			${v}
		<#elseif v?is_boolean>
			<#if v>true<#else>false</#if>
		</#if>
	</#compress>
</#macro>

<#escape x as jsonUtils.encodeJSONString(x)>
{
	<#if error_message??>
	"message": "${error_message}"
	<#else>
	"nodeRef": "${nodeRef}",
	"props":
	{
		<#list props as prop>
		"${prop.key}": <@renderVariable prop.value /><#if prop_has_next>,</#if>
		</#list>
	}
	</#if>
}
</#escape>