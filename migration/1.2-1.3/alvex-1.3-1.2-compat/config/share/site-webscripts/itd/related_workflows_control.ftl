<#include "/org/alfresco/components/component.head.inc">
<#assign controlId = fieldHtmlId + "-cntrl">
<input type="hidden" id="${fieldHtmlId}" name="${field.name}" value="${field.value}" />

<div class="form-field">
	<div <#if form.mode == "view" || field.disabled >style="display:none;"</#if>>
		<select id="${controlId}-workflow-selector" name="-" /><br/><br/>
		<input id="${controlId}-workflow-start" type="button" value='${msg("itd.related_workflows.select_process_to_start")}' name="-" />
	</div>
	<div id="${controlId}-dataTableContainer"></div>
</div>

<script type="text/javascript" src="${page.url.context}/res/components/itd/related-workflows.js"></script>

<script type="text/javascript">
<#include "related_workflows_control.js.ftl">
</script>
