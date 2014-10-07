<#include "/org/alfresco/components/component.head.inc">
<#assign controlId = fieldHtmlId + "-cntrl">

<div class="form-field">

	<label for="${controlId}">${field.label?html}:
		<#if field.mandatory><span class="mandatory-indicator">${msg("form.required.fields.marker")}</span></#if>
	</label>

	<input type="hidden" id="${fieldHtmlId}" name="${field.name}" value="${field.value}"/>
	<#if form.mode == "view" || field.disabled >
	<div id="${controlId}"></div>
	<#else>
	<select id="${controlId}" name="-"></select>
	</#if>
</div>

<script type="text/javascript">

new Alvex.DatalistFieldPicker( "${fieldHtmlId}" ).setOptions({
	<#if form.mode == "view" || field.disabled >
	disabled: true
	</#if>
}).setMessages( ${messages} );

</script>
