<#include "/org/alfresco/components/component.head.inc">
<#assign controlId = fieldHtmlId + "-cntrl">

<#assign startDisabled = field.disabled && !(field.control.params.forceEditable?? && field.control.params.forceEditable == "true") />

<div class="form-field">
	<label for="${fieldHtmlId}" <#if form.mode == "view">class="viewmode-label"</#if>>${field.label?html}:
		<#if field.mandatory><span class="mandatory-indicator">${msg("form.required.fields.marker")}</span></#if>
	</label>
	<input type="hidden" id="${fieldHtmlId}" name="${field.name}" value="${field.value?html}" />
	<div class="hidden" id="${fieldHtmlId}-display">${field.value?html}</div>
	<input type="text" class="hidden" id="${fieldHtmlId}-edit" name="-" tabindex="0" 
		<#if field.control.params.styleClass??>class="${field.control.params.styleClass}" </#if>
		<#if field.control.params.style??>style="${field.control.params.style}" </#if>
		<#if field.description??>title="${field.description}" </#if>
		<#if field.control.params.maxLength??>maxlength="${field.control.params.maxLength}" </#if>
		<#if field.control.params.size??>size="${field.control.params.size}" </#if>
		value="${field.value?html}"
	/>
</div>

<script type="text/javascript">

new Alvex.AutoNumberer( "${fieldHtmlId}" ).setOptions({
	<#if startDisabled>
	autoIdOnly: true,
	</#if>
	mode: "${form.mode}"
}).setMessages( ${messages} );

</script>
