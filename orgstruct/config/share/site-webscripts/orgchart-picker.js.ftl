new ITD.OrgchartViewer( "${fieldHtmlId}" ).setOptions({
	<#if form.mode == "view" || field.disabled >
	disabled: true,
	</#if>
	multipleSelectMode: ${field.endpointMany?string},
	mode: "picker"
}).setMessages( ${messages} );
