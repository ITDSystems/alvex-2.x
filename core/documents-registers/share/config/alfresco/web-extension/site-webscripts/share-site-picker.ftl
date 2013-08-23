<#include "/org/alfresco/components/component.head.inc">
<#assign controlId = fieldHtmlId + "-cntrl">

<div class="form-field">

	<input type="hidden" id="${fieldHtmlId}" name="${field.name}" value="${field.value}" />

	<label for="${controlId}-display">${field.label?html}:
		<#if field.mandatory><span class="mandatory-indicator">${msg("form.required.fields.marker")}</span></#if>
	</label>

	<div id="${controlId}-display">${msg("alvex.officeSite.notSet")}</div>

	<select id="${controlId}-select" name="-">
		<option value="" selected="selected">${msg("alvex.label.choose_entity")}</option>
	</select>
</div>

<script type="text/javascript">

new Alvex.ShareSitePicker( "${fieldHtmlId}" ).setOptions({
	<#if form.mode == "view" || field.disabled >
	disabled: true,
	</#if>
}).setMessages( ${messages} );

</script>
