<#include "/org/alfresco/components/component.head.inc">
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
								<button type="button" tabindex="0" id="${controlId}-addFilesButton-elem" value="Add">${msg("alvex.uploader.uploadfiles")}</button>
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
		<div id="${controlId}-warnMessage"></div>
		<div id="${controlId}-dataTableContainer"></div>
		<div id="${controlId}-default-picker" class="object-finder">
		<#if "${packageActionGroup}" == "add_package_item_actions">
			<@renderPickerHTML controlId />
		</#if>
		</div>
	</div>
</div>

<script type="text/javascript">
if( "${packageActionGroup}" == "add_package_item_actions" ) {
	<@renderPickerJS field "picker" />
	picker.setOptions(
	{
		maintainAddedRemovedItems: false,
		itemFamily: "node",
		itemType: '${(field.control.params.pickerContentType!"cm:content")?string}',
		startLocation: '${(field.control.params.pickerRoot!"alfresco://user/home")?string}',
		parentNodeRef: '${(field.control.params.pickerRoot!"alfresco://user/home")?string}',
		multipleSelectMode: true,
		displayMode: "items",
		compactMode: '${(field.control.params.pickerCompactMode!false)?string}' == 'true',
		showLinkToTarget: false,
		allowRemoveAction: false,
		allowRemoveAllAction: false,
		allowSelectAction: true,
		selectActionLabel: '${msg("alvex.uploader.associatefiles")?js_string}'
	});
	<#if form.mode == "view" || field.disabled >
	YAHOO.Bubbling.unsubscribe("renderCurrentValue", picker.onRenderCurrentValue, picker);
	</#if>
}

new Alvex.Uploader( "${fieldHtmlId}" ).setOptions({
	<#if form.mode == "view">
	mode: 'view',
	</#if>
	<#if form.mode == "view" || field.disabled >
	disabled: true,
	</#if>
	<#if (field.control.params.parentUploaderId)??>
	parentUploaderId: '${field.control.params.parentUploaderId}',
	</#if>
	<#if (field.control.params.uploaderId)??>
	uploaderId: '${field.control.params.uploaderId}',
	</#if>
	picker: picker,
	packageItemActionGroup: "${packageItemActionGroup}",
	pickerRoot: '${(field.control.params.pickerRoot!"alfresco://user/home")?string}',
	uploadDirectory: '${(field.control.params.uploadDirectory!"/")?string}',
	createUploadDirectoryHierarchy: '${(field.control.params.createUploadDirectoryHierarchy!true)?string}',
	allowedExtensions: '${(field.control.params.allowedExtensions!"*.*")?string}',
	destination: '${(field.control.params.destination!"alfresco://user/home")?string}',
	createUploadDirectory: '${(field.control.params.createUploadDirectory!false)?string}',
	viewType: '${(field.control.params.viewType!"mini")?string}',
	contentType: '${(field.control.params.contentType!"cm:content")?string}'
}).setMessages( ${messages} );
</script>
