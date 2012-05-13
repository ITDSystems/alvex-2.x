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
		selectActionLabel: '${msg("itd.uploader.associatefiles")}'
	});
	<#if form.mode == "view" || field.disabled >
	YAHOO.Bubbling.unsubscribe("renderCurrentValue", picker.onRenderCurrentValue, picker);
	</#if>
}

new ITD.Uploader( "${fieldHtmlId}" ).setOptions({
	<#if form.mode == "view" || field.disabled >
	disabled: true,
	</#if>
	picker: picker,
	packageItemActionGroup: "${packageItemActionGroup}",
	pickerRoot: '${(field.control.params.pickerRoot!"alfresco://user/home")?string}',
	uploadDirectory: '${(field.control.params.uploadDirectory!"/")?string}',
	createUploadDirectoryHierarchy: '${(field.control.params.createUploadDirectoryHierarchy!true)?string}',
	allowedExtensions: '${(field.control.params.allowedExtensions!"*.*")?string}',
	destination: '${(field.control.params.destination!"alfresco://user/home")?string}',
	createUploadDirectory: '${(field.control.params.createUploadDirectory!false)?string}',
	contentType: '${(field.control.params.contentType!"cm:content")?string}'
}).setMessages( ${messages} );

