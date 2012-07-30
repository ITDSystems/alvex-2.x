<#include "org/alfresco/components/component.head.inc">
<#include "org/alfresco/components/form/controls/common/picker.inc.ftl">
<#assign controlId = fieldHtmlId + "-cntrl">

<#if form.data['prop_bpm_packageActionGroup']??>
	<#assign packageActionGroup = form.data['prop_bpm_packageActionGroup']>
<#else>
	<#assign packageActionGroup = "add_package_item_actions">
</#if>

<#if form.data['prop_bpm_packageItemActionGroup']??>
	<#assign packageItemActionGroup = form.data['prop_bpm_packageItemActionGroup']>
<#else>
	<#assign packageItemActionGroup = "edit_and_remove_package_item_actions">
</#if>


<div class="form-field">
	<label for="${controlId}">${field.label?html}:
		<#if field.mandatory><span class="mandatory-indicator">${msg("form.required.fields.marker")}</span></#if>
	</label>
	<div id="${controlId}">
		<input type="hidden" id="${fieldHtmlId}" name="-" value="${field.value}" />
		<input type="hidden" id="${controlId}-added" name="${field.name}_added" value="" />
		<input type="hidden" id="${controlId}-removed" name="${field.name}_removed" value="" />
		<input type="hidden" id="${controlId}-current" name="-" value="" />
		<!-- This input is just an ugly hack to prevent system uploader from failing in view mode -->
		<input type="hidden" id="${controlId}-currentValueDisplay" name="-" value="" />
		<input type="hidden" id="${controlId}-initial" name="-" value="" />
		<div <#if form.mode == "view" || field.disabled >style="display:none;"</#if>><table><tr>
			<td>
				<#if "${packageActionGroup}" == "add_package_item_actions">
					<div id="${controlId}-uploaderOverlay" style="position:absolute; z-index:2"></div>
					<div id="${controlId}-addFilesButton-container" style="z-index:1">
						<span id="${controlId}-addFilesButton" class="yui-button yui-push-button">
							<span class="first-child">
								<button type="button" tabindex="0" id="${controlId}-addFilesButton-elem" value="Add">${msg("itd.uploader.uploadfiles")}</button>
							</span>
						</span>
					</div>
				</#if>
			</td>
			<td>
				<#if "${packageActionGroup}" == "add_package_item_actions">
					<div id="${controlId}-itemGroupActions" class="show-picker"></div>
				</#if>
			</td>
		</tr></table></div>
		<div id="${controlId}-dataTableContainer"></div>
		<div id="${controlId}-default-picker" class="object-finder">
		<#if "${packageActionGroup}" == "add_package_item_actions">
			<@renderPickerHTML controlId />
		</#if>
		</div>
	</div>
</div>

<script type="text/javascript">
<#include "/itd-uploader.js.ftl">	
</script>
