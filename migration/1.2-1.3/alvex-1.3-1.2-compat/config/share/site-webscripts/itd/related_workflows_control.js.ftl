	// Get curent task id. There is no value ready, so we get it from submision url.
	// It is a bit ugly, but this way there is no option to fail.
	var cur_task_id = "${form.submissionUrl}";
	cur_task_id = cur_task_id.replace(/\/formprocessor.*$/, "");
	cur_task_id = cur_task_id.replace(/^.*\//, "");
	new ITD.RelatedWorkflows( "${fieldHtmlId}" ).setOptions({
		definitionsFilter: '${(field.control.params.definitionsFilter!"(jbpm$itdwf:)")?string}',
		curTaskId: cur_task_id,
		<#if form.mode == "view" || field.disabled >
		disabled: true,
		</#if>
		relWflPropName: "${field.name}"
	}).setMessages( ${messages} );
