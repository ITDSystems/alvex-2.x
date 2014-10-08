<#include "/org/alfresco/components/component.head.inc">
<#assign controlId = fieldHtmlId + "-cntrl">

<div class="form-field">
	<input type="hidden" id="${fieldHtmlId}" name="-" value="${field.value}" />
	<input type="hidden" id="${fieldHtmlId}-added" name="${field.name}_added" value="" />
	<input type="hidden" id="${fieldHtmlId}-removed" name="${field.name}_removed" value="" />
	<div id="${fieldHtmlId}-view"></div>
</div>

<script type="text/javascript">

new Alvex.MasterDataConfig( "${fieldHtmlId}" ).setOptions({
	<#if form.mode == "view" || field.disabled >
	disabled: true,
	</#if>
}).setMessages( ${messages} );

</script>
