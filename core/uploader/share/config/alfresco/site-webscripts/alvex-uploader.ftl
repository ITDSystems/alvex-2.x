<#include "/org/alfresco/components/component.head.inc">
<#include "org/alfresco/components/form/controls/common/picker.inc.ftl">
<#assign controlId = fieldHtmlId + "-cntrl">
<#assign regHtmlId = fieldHtmlId + "-reg">
<#assign regPickerId = regHtmlId + "-cntrl">

<#assign showLocalDrive = ! (withoutLocalDrive?? || field.control.params.withoutLocalDrive??)>
<#assign showRepo = ! (withoutRepo?? || field.control.params.withoutRepo?? )>
<#assign showRegistries = ! (withoutRegistries?? || field.control.params.withoutRegistries?? )>

<#assign fileUploadConfig = config.scoped["DocumentLibrary"]["file-upload"]!>
<#if fileUploadConfig.getChildValue??>
	<#assign adobeFlashEnabled = fileUploadConfig.getChildValue("adobe-flash-enabled")!"true">
</#if>

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
<#assign showRegistries = ! (showLocalDrive || showRepo) >

<div class="form-field">
	<label for="${controlId}" <#if form.mode == "view">class="viewmode-label"</#if>>${field.label?html}:
		<#if (field.mandatory || field.endpointMandatory)><span class="mandatory-indicator">${msg("form.required.fields.marker")}</span></#if>
	</label>
	<div id="${controlId}">
		<input type="hidden" id="${fieldHtmlId}" name="-" value="${field.value}" />
		<input type="hidden" id="${controlId}-added" name="${field.name}_added" value="" />
		<input type="hidden" id="${controlId}-removed" name="${field.name}_removed" value="" />
		<input type="hidden" id="${controlId}-current" name="-" value="" />
		<!-- This input is just an ugly hack to prevent system uploader from failing in view mode -->
		<input type="hidden" id="${controlId}-currentValueDisplay" name="-" value="" />
		<#if showRegistries>
		<input type="hidden" id="${regPickerId}-currentValueDisplay" name="-" value="" />
		<input type="hidden" id="${regHtmlId}" name="-" value="" />
		</#if>
		<input type="hidden" id="${controlId}-initial" name="-" value="" />
		<div <#if form.mode == "view" || field.disabled >style="display:none;"</#if>><table><tr>
			<#if showLocalDrive>
			<td>
				<#if "${packageActionGroup}" == "add_package_item_actions">
					<div id="${controlId}-addFilesButton-container" style="z-index:1">
						<span id="${controlId}-addFilesButton" class="yui-button yui-push-button">
							<span class="first-child">
								<button type="button" tabindex="0" id="${controlId}-addFilesButton-elem" value="Add">${msg("alvex.uploader.uploadfiles")}</button>
							</span>
						</span>
					</div>
				</#if>
			</td>
			</#if>
			<#if showRepo>
			<td>
				<#if "${packageActionGroup}" == "add_package_item_actions">
					<div id="${controlId}-itemGroupActions" class="show-picker"></div>
				</#if>
			</td>
			</#if>
			<#if showRegistries>
			<td>
				<#if "${packageActionGroup}" == "add_package_item_actions">
					<div id="${regPickerId}-itemGroupActions" class="show-picker"></div>
				</#if>
			</td>
			</#if>
		</tr></table></div>
		<div id="${controlId}-dataTableContainer"></div>
		<div id="${controlId}-default-picker" class="object-finder">
		<#if showRepo>
		<#if "${packageActionGroup}" == "add_package_item_actions">
			<@renderPickerHTML controlId />
		</#if>
		</#if>
		</div>
		<#if showRegistries>
		<div id="${controlId}-reg-picker" class="object-finder">
		<#if "${packageActionGroup}" == "add_package_item_actions">
			<@renderPickerHTML regPickerId />
		</#if>
		</div>
		</#if>
	</div>
</div>

      <#assign el=args.htmlid?html>
      <div id="${el}-dnd-dialog" class="dnd-upload hidden">
         <div class="hd">
            <span id="${el}-dnd-title-span"></span>
         </div>
         <div class="bd">
            <div id="${el}-dnd-file-selection-controls" class="browse-wrapper">
               <div class="center dnd-file-selection-control">
                  <input id="${el}-dnd-file-selection-button-overlay" type="button" value="${msg("button.selectFiles")}" tabindex="0"/>
               </div>
            </div>
         
            <div id="${el}-dnd-filelist-table" class="fileUpload-filelist-table"></div>
      
            <div class="status-wrapper">
               <span id="${el}-dnd-status-span" class="status"></span>
            </div>
            <div id="${el}-dnd-aggregate-data-wrapper">
              <div class="status-wrapper">
                 <span id="${el}-dnd-aggregate-status-span" class="status"></span>
              </div>
              <div id="${el}-dnd-aggregate-progress-div" class="aggregate-progress-div">
                 <span id="${el}-dnd-aggregate-progress-span" class="aggregate-progressSuccess-span">&nbsp;</span>
              </div>
            </div>
      
            <div id="${el}-dnd-versionSection-div">
               <div class="yui-g">
                  <h2>${msg("section.version")}</h2>
               </div>
               <div class="yui-gd">
                  <div class="yui-u first">
                     <span>${msg("label.version")}</span>
                  </div>
                  <div class="yui-u">
                     <input id="${el}-dnd-minorVersion-radioButton" type="radio" name="majorVersion" checked="checked" tabindex="0"/>
                     <label for="${el}-dnd-minorVersion-radioButton" id="${el}-dnd-minorVersion">${msg("label.minorVersion")}</label>
                  </div>
               </div>
               <div class="yui-gd">
                  <div class="yui-u first">&nbsp;
                  </div>
                  <div class="yui-u">
                     <input id="${el}-dnd-majorVersion-radioButton" type="radio" name="majorVersion" tabindex="0"/>
                     <label for="${el}-dnd-majorVersion-radioButton" id="${el}-dnd-majorVersion">${msg("label.majorVersion")}</label>
                  </div>
               </div>
               <div class="yui-gd">
                  <div class="yui-u first">
                     <label for="${el}-dnd-description-textarea">${msg("label.comments")}</label>
                  </div>
                  <div class="yui-u">
                     <textarea id="${el}-dnd-description-textarea" name="description" cols="80" rows="4" tabindex="0"></textarea>
                  </div>
               </div>
            </div>
      
            <!-- Templates for a file row -->
            <div style="display:none">
               <div id="${el}-dnd-left-div" class="fileupload-left-div">
                  <span class="fileupload-percentage-span">0%</span>
                  <input class="fileupload-contentType-input" type="hidden" value="cm:content"/>
               </div>
               <div id="${el}-dnd-center-div" class="fileupload-center-div">
                  <span class="fileupload-progressSuccess-span">&nbsp;</span>
                  <img src="${url.context}/res/components/images/generic-file-32.png" class="fileupload-docImage-img" alt="file" />
                  <span class="fileupload-progressInfo-span"></span>
                  <span class="fileupload-filesize-span"></span>
               </div>
               <div id="${el}-dnd-right-div" class="fileupload-right-div">
                  <img src="${url.context}/res/components/images/delete-16.png" class="fileupload-status-img" alt="status" />
                  <img src="${url.context}/res/components/images/complete-16.png" class="fileupload-status-img hidden" alt="status" />
               </div>
            </div>
               <div class="bdft">
                  <input id="${el}-dnd-upload-button" type="button" value="${msg("button.upload")}" tabindex="0"/>
                  <input id="${el}-dnd-cancelOk-button" type="button" value="${msg("button.cancel")}" tabindex="0"/>
               </div>
         </div>
      </div>

      <div id="${el}-flash-dialog" class="flash-upload hidden">
         <div class="hd">
            <span id="${el}-flash-title-span"></span>
         </div>
         <div class="bd">
            <div class="browse-wrapper">
               <div class="center">
                  <div id="${el}-flash-flashuploader-div"></div>
                  <div class="label">${msg("label.browse")}</div>
               </div>
            </div>
            <div class="tip-wrapper">
               <span id="${el}-flash-multiUploadTip-span">${msg("label.multiUploadTip")}</span>
               <span id="${el}-flash-singleUpdateTip-span">${msg("label.singleUpdateTip")}</span>
            </div>
            <div id="${el}-flash-filelist-table" class="fileUpload-filelist-table"></div>
            <div class="status-wrapper">
               <span id="${el}-flash-status-span" class="status"></span>
            </div>
            <div id="${el}-flash-versionSection-div"> 
               <div class="yui-g">
                  <h2>${msg("section.version")}</h2>
               </div>
               <div class="yui-gd">
                  <div class="yui-u first">
                     <span>${msg("label.version")}</span>
                  </div>
                  <div class="yui-u">
                     <input id="${el}-flash-minorVersion-radioButton" type="radio" name="majorVersion" checked="checked" tabindex="0"/>
                     <label for="${el}-flash-minorVersion-radioButton" id="${el}-flash-minorVersion">${msg("label.minorVersion")}</label>
                  </div>
               </div>
               <div class="yui-gd">
                  <div class="yui-u first">&nbsp;
                  </div>
                  <div class="yui-u">
                     <input id="${el}-flash-majorVersion-radioButton" type="radio" name="majorVersion" tabindex="0"/>
                     <label for="${el}-flash-majorVersion-radioButton" id="${el}-flash-majorVersion">${msg("label.majorVersion")}</label>
                  </div>
               </div>
               <div class="yui-gd">
                  <div class="yui-u first">
                     <label for="${el}-flash-description-textarea">${msg("label.comments")}</label>
                  </div>
                  <div class="yui-u">
                     <textarea id="${el}-flash-description-textarea" name="description" cols="80" rows="4" tabindex="0"></textarea>
                  </div>
               </div>
            </div>
            <!-- Templates for a file row -->
            <div style="display:none">
               <div id="${el}-flash-left-div" class="fileupload-left-div">
                  <span class="fileupload-percentage-span hidden">&nbsp;</span>
                  <input class="fileupload-contentType-input" type="hidden" value=""/>
               </div>
               <div id="${el}-flash-center-div" class="fileupload-center-div">
                  <span class="fileupload-progressSuccess-span">&nbsp;</span>
                  <img src="${url.context}/res/components/images/generic-file-32.png" class="fileupload-docImage-img" alt="file" />
                  <span class="fileupload-progressInfo-span"></span>
               </div>
               <div id="${el}-flash-right-div" class="fileupload-right-div">
                  <span class="fileupload-fileButton-span">
                     <button class="fileupload-file-button" value="Remove" disabled="true" tabindex="0">${msg("button.remove")}</button>
                  </span>
               </div>
            </div>
               <div class="bdft">
                  <input id="${el}-flash-upload-button" type="button" value="${msg("button.upload")}" tabindex="0"/>
                  <input id="${el}-flash-cancelOk-button" type="button" value="${msg("button.cancel")}" tabindex="0"/>
               </div>
         </div>
      </div>

<script type="text/javascript">
if( "${packageActionGroup}" == "add_package_item_actions" ) {
	<#if showRepo>
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
	<#else>
	var picker = null;
	</#if>

	var regPicker = null;
	<#if showRegistries>
	regPicker = new Alvex.DocRegObjectFinder("${regPickerId}", "${regHtmlId}").setOptions(
	{
		<#if form.mode == "view" || (field.disabled && !(field.control.params.forceEditable?? && field.control.params.forceEditable == "true"))>disabled: true,</#if>
		field: "${field.name}",
		compactMode: ${compactMode?string},
	<#if field.mandatory??>
		mandatory: ${field.mandatory?string},
	<#elseif field.endpointMandatory??>
		mandatory: ${field.endpointMandatory?string},
	</#if>
	<#if field.control.params.startLocation??>
		startLocation: "${field.control.params.startLocation}",
		<#if form.mode == "edit" && args.itemId??>currentItem: "${args.itemId?js_string}",</#if>
		<#if form.mode == "create" && form.destination?? && form.destination?length &gt; 0>currentItem: "${form.destination?js_string}",</#if>
	</#if>
	<#if field.control.params.startLocationParams??>
		startLocationParams: "${field.control.params.startLocationParams?js_string}",
	</#if>
		currentValue: "${field.value}",
		<#if field.control.params.valueType??>valueType: "${field.control.params.valueType}",</#if>
		<#if renderPickerJSSelectedValue??>selectedValue: "${renderPickerJSSelectedValue}",</#if>
		<#if field.control.params.selectActionLabelId??>selectActionLabelId: "${field.control.params.selectActionLabelId}",</#if>
		selectActionLabel: "${field.control.params.selectActionLabel!msg("button.select")}",
		minSearchTermLength: ${field.control.params.minSearchTermLength!'1'},
		maxSearchResults: ${field.control.params.maxSearchResults!'1000'}
	}).setMessages(
		${messages}
	);
	
	regPicker.setOptions(
	{
		maintainAddedRemovedItems: false,
		itemFamily: "node",
		itemType: '${(field.control.params.pickerContentType!"alvexdt:object")?string}',
		multipleSelectMode: true,
                startLocation: '${(field.control.params.pickerRoot!"alfresco://sites/home")?string}',
		displayMode: "items",
		compactMode: '${(field.control.params.pickerCompactMode!false)?string}' == 'true',
		showLinkToTarget: false,
		allowRemoveAction: false,
		allowRemoveAllAction: false,
		allowSelectAction: true,
		selectActionLabel: '${msg("alvex.uploader.associateRegItems")?js_string}'
	});

	<#if form.mode == "view" || field.disabled >
	YAHOO.Bubbling.unsubscribe("renderCurrentValue", regPicker.onRenderCurrentValue, regPicker);
	</#if>

	</#if>
}

new Alvex.Uploader( "${fieldHtmlId}" ).setOptions({
	<#if form.mode == "view">
	mode: 'view',
	</#if>
	<#if form.mode == "view" || field.disabled >
	disabled: true,
	</#if>
	adobeFlashEnabled: ${((adobeFlashEnabled!"true") == "true")?string},
	multipleSelectMode: ${field.endpointMany?string},
	<#if (field.control.params.parentUploaderId)??>
	parentUploaderId: '${field.control.params.parentUploaderId}',
	</#if>
	<#if (field.control.params.uploaderId)??>
	uploaderId: '${field.control.params.uploaderId}',
	</#if>
	picker: picker,
	regPicker: regPicker,
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

new Alfresco.DNDUpload( "${el}-dnd" ).setOptions( {} ).setMessages( ${messages} );
new Alfresco.FlashUpload( "${el}-flash" ).setOptions( {} ).setMessages( ${messages} );

</script>
