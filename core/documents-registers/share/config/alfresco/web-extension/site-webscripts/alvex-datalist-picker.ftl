<#include "/org/alfresco/components/component.head.inc">
<#assign controlId = fieldHtmlId + "-cntrl">

<div class="form-field">

	<label for="${controlId}">${field.label?html}:
		<#if field.mandatory><span class="mandatory-indicator">${msg("form.required.fields.marker")}</span></#if>
	</label>

	<input type="hidden" id="${fieldHtmlId}" name="${field.name}" value="${field.value}"/>
	<#if form.mode == "view" || field.disabled || field.value?has_content >
	<div id="${controlId}"></div>
	<#else>
	<select id="${controlId}" name="-">
		<option value="" selected="selected">${msg("alvex.label.choose_entity")}</option>
	</select>
	</#if>
</div>

<script type="text/javascript">

new Alvex.DatalistPicker( "${fieldHtmlId}" ).setOptions({
	<#if form.mode == "view" || field.disabled || field.value?has_content >
	disabled: true
	</#if>
}).setMessages( ${messages} );

</script>
