<#include "org/alfresco/components/component.head.inc">
<#include "orgchart-picker-dialog.inc.ftl">

<#assign controlId = fieldHtmlId + "-cntrl">

<div class="form-field">

	<#if form.mode == "view">
		<div id="${controlId}" class="viewmode-field">
			<#if field.endpointMandatory && field.value == "">
				<span class="incomplete-warning">
					<img src="${url.context}/res/components/form/images/warning-16.png" title="${msg("form.field.incomplete")}" />
				<span>
			</#if>
			<span class="viewmode-label">${field.label?html}:</span>
			<span id="${controlId}-currentValueDisplay" class="viewmode-value current-values"></span>
			<input type="hidden" id="${fieldHtmlId}" name="-" value="${field.value}" />
		</div>
	<#else>
		<label for="${controlId}">${field.label?html}:
			<#if field.endpointMandatory>
				<span class="mandatory-indicator">${msg("form.required.fields.marker")}</span>
			</#if>
		</label>
		<div id="${controlId}" class="object-finder">
			<div id="${controlId}-currentValueDisplay" class="current-values object-finder-items"></div>
			<input type="hidden" id="${fieldHtmlId}" name="-" value="${field.value}" />
			<#if field.disabled == false>
				<input type="hidden" id="${controlId}-added" name="${field.name}_added" value="" />
				<input type="hidden" id="${controlId}-removed" name="${field.name}_removed" value="" />
				<@renderOrgchartPickerDialogHTML controlId />
				<div id="${controlId}-itemGroupActions" class="orgchart-picker">
					<input type="button" id="${controlId}-orgchart-picker-button" name="-" 
						value="${msg("alvex.orgchart.orgchart_picker_button")}"/>
				</div>
			</#if>
		</div>
	</#if>

</div>

<script type="text/javascript">
	new Alvex.OrgchartViewer( "${fieldHtmlId}" ).setOptions({
		<#if form.mode == "view" || (field.disabled && !(field.control.params.forceEditable?? && field.control.params.forceEditable == "true"))>
			disabled: true,
		</#if>
		<#if field.mandatory??>
			mandatory: ${field.mandatory?string},
		<#elseif field.endpointMandatory??>
			mandatory: ${field.endpointMandatory?string},
		</#if>
		multipleSelectMode: ${field.endpointMany?string},
		mode: "picker"
	}).setMessages( ${messages} );
</script>