<#include "org/alfresco/components/component.head.inc">
<#assign controlId = fieldHtmlId + "-cntrl">

<div class="form-field">
	<label for="${controlId}">${field.label?html}:
		<#if field.mandatory><span class="mandatory-indicator">${msg("form.required.fields.marker")}</span></#if>
	</label>
	<div id="${controlId}" class="object-finder">
		<div id="${controlId}-currentValueDisplay" class="current-values object-finder-items"></div>
		<input type="hidden" id="${fieldHtmlId}" name="-" value="${field.value}" />
		<input type="hidden" id="${controlId}-current" name="-" value="" />
		<input type="hidden" id="${controlId}-current-names" name="-" value="" />
		<input type="hidden" id="${controlId}-added" name="${field.name}_added" value="" />
		<input type="hidden" id="${controlId}-added-names" name="-" value="" />
		<input type="hidden" id="${controlId}-removed" name="${field.name}_removed" value="" />
		<input type="hidden" id="${controlId}-removed-names" name="-" value="" />
		<div id="${controlId}-itemGroupActions" class="show-picker" 
					<#if form.mode == "view" || field.disabled >style="display:none;"</#if> >
			<input type="button" id="${controlId}-orgchart-picker-button" name="-" 
				value="${msg("itd.orgchart.orgchart_picker_button")}" onclick="showTreePicker();"/>
		</div>
	</div>
</div>

<script type="text/javascript">
<#include "/orgchart-picker.js.ftl">
</script>
