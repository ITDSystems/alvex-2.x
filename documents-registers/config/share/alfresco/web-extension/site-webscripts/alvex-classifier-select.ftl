<#include "/org/alfresco/components/component.head.inc">
<#assign controlId = fieldHtmlId + "-cntrl">

<div class="form-field">
	<input type="hidden" id="${fieldHtmlId}" name="-" value="${field.value}" />
	<label for="${controlId}">${field.label?html}:
		<#if field.mandatory><span class="mandatory-indicator">${msg("form.required.fields.marker")}</span></#if>
	</label>
	<#if form.mode == "view" || field.disabled >
	<div id="${controlId}"></div>
	<#else>
	<select id="${controlId}" name="${field.name}">
	</select>
	</#if>
</div>

<script type="text/javascript">

new Alvex.ClassifierSelect( "${fieldHtmlId}" ).setOptions({
	<#if form.mode == "view" || field.disabled >
	disabled: true,
	</#if>
	url: '${(field.control.params.url!"")?string}',
	label: '${(field.control.params.label!"")?string}',
	value: '${(field.control.params.value!"")?string}'
}).setMessages( ${messages} );

</script>
