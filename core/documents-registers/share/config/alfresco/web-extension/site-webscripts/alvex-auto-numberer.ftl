<#include "/org/alfresco/components/component.head.inc">
<#assign controlId = fieldHtmlId + "-cntrl">

<div class="form-field">
	<label for="${fieldHtmlId}">${field.label?html}:
		<#if field.mandatory><span class="mandatory-indicator">${msg("form.required.fields.marker")}</span></#if>
	</label>
	<#if form.mode != "create" >
	<input type="hidden" id="${fieldHtmlId}" name="-" value="${field.value?html}" />
	<div>${field.value?html}</div>
	<#else>
	<input type="text" id="${fieldHtmlId}" name="${field.name}" tabindex="0" 
		<#if field.control.params.styleClass??>class="${field.control.params.styleClass}" </#if>
		<#if field.control.params.style??>style="${field.control.params.style}" </#if>
		<#if field.description??>title="${field.description}" </#if>
		<#if field.control.params.maxLength??>maxlength="${field.control.params.maxLength}" </#if>
		<#if field.control.params.size??>size="${field.control.params.size}" </#if>
	/>
	</#if>
</div>

<script type="text/javascript">

new Alvex.AutoNumberer( "${fieldHtmlId}" ).setOptions({
	<#if form.mode != "create" >
	disabled: true
	</#if>
}).setMessages( ${messages} );

</script>
