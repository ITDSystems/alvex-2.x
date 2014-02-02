<#include "/org/alfresco/components/component.head.inc">
<#assign controlId = fieldHtmlId + "-cntrl">

<div class="form-field">
	<input type="hidden" id="${fieldHtmlId}" name="-" value="${field.value?html}" />
	<label for="${controlId}" <#if form.mode == "view">class="viewmode-label"</#if>>${field.label?html}:
		<#if field.mandatory><span class="mandatory-indicator">${msg("form.required.fields.marker")}</span></#if>
	</label>
	<#if form.mode == "view" || field.disabled >
	<div id="${controlId}"></div>
	<#else>
	<select id="${controlId}" name="${field.name}" tabindex="0" 
			<#if field.control.params.styleClass??>class="${field.control.params.styleClass}" </#if>
			<#if field.control.params.style??>style="${field.control.params.style}" </#if> ></select>
	</#if>
</div>

<script type="text/javascript">

new Alvex.MasterDataSelect( "${fieldHtmlId}" ).setOptions({
	<#if form.mode == "view" || field.disabled >
	disabled: true,
	</#if>
	<#if field.control.params.style??>style: '${(field.control.params.style!"")?string}',</#if>
	<#if field.control.params.styleClass??>styleClass: '${(field.control.params.styleClass!"")?string}',</#if>
	field: '${field.name}',
	mode: '${form.mode}',
	url: '${(field.control.params.url!"")?string}',
	label: '${(field.control.params.label!"")?string}',
	value: '${(field.control.params.value!"")?string}'
}).setMessages( ${messages} );

</script>
