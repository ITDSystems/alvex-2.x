<#include "/org/alfresco/components/component.head.inc">
<#assign controlId = fieldHtmlId + "-cntrl">
<input type="hidden" id="${fieldHtmlId}" name="${field.name}" value="${field.value}" />

<div class="form-field">
	<div class="hidden" id="${fieldHtmlId}-container">
		<div <#if form.mode == "view" || field.disabled >style="display:none;"</#if>>
			<input id="${controlId}-workflow-start" type="button" value='${msg("alvex.related_workflows.select_process_to_start")}' name="-" />
		</div>
		<div id="${controlId}-dataTableContainer"></div>
	</div>
</div>

<script type="text/javascript">
// Get curent task id. There is no value ready, so we get it from submision url.
// It is a bit ugly, but this way there is no option to fail.
var cur_task_id = "${form.submissionUrl}";
cur_task_id = cur_task_id.replace(/\/formprocessor.*$/, "");
cur_task_id = cur_task_id.replace(/^.*\//, "");
new Alvex.RelatedWorkflows( "${fieldHtmlId}" ).setOptions({
	definitionsFilter: '${(field.control.params.definitionsFilter!"(jbpm$alvexwf:)")?string}',
	curTaskId: cur_task_id,
	<#if form.mode == "view" || field.disabled >
	disabled: true,
	</#if>
	propName: "${field.name}",
	urlAuto: ${(field.control.params.urlAuto!"true")?string},
	url: '${(field.control.params.url!"")?string}',
	mode: '${form.mode}',
	<#if (field.control.params.parentUploaderId)??>
	parentUploaderId: '${field.control.params.parentUploaderId}',
	</#if>
}).setMessages( ${messages} );
</script>
