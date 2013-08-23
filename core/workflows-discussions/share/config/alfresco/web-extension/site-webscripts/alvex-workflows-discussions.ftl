<#include "/org/alfresco/components/component.head.inc">
<#assign controlId = fieldHtmlId + "-cntrl">

<div class="form-field">
	<input type="hidden" id="${fieldHtmlId}" name="-" value="${field.value}" />
	<input type="hidden" id="${controlId}-added" name="${field.name}_added" value="" />
	<input type="hidden" id="${controlId}-removed" name="${field.name}_removed" value="" />
	<div id="${controlId}-spoiler" class="spoiler-${(field.control.params.spoilerView!"expanded")?string}">
		<img src="${url.context}/res/components/images/collapsed.png" class="collapsed"/>
		<img src="${url.context}/res/components/images/expanded.png" class="expanded"/>
		<h3>${field.label}</h3>
		<div class="expanded">
			<div id="${controlId}-discussionsContainer" class="discussion">
			</div>
			<div id="${controlId}-inputContianer" style="width:100%<#if form.mode == "view" || field.disabled>display:none;</#if>">
				<table style="width:100%">
					<tr>
						<td colspan="2">
							<textarea id="${controlId}-textArea" name="${field.name}" tabindex="0" style="width:100%;"></textarea>
						</td>
					</tr>
					<tr>
						<td/>
						<td align="right">
							<img id="${controlId}-spinnerAnim" src="${url.context}/res/components/images/ajax_anim.gif" style="display:none;"/>
							<input type="button" tabindex="0" id="${controlId}-addCommentButton" value="${msg("alvex.discussions.comment")}" />
						</td>
					</tr>
				</table>
			</div>
		</div>
	</div>
</div>

<script type="text/javascript">//<![CDATA[
	new Alvex.WorkflowsDiscussions("${fieldHtmlId}").setOptions({
		createOnReady: ${(field.control.params.createOnReady!"false")?string},
		persistOnCreate: ${(field.control.params.persistOnCreate!"false")?string},
		urlAuto: ${(field.control.params.urlAuto!"true")?string},
		url: '${(field.control.params.url!"")?string}',
		propName: '${field.name}'
	}).setMessages(${messages});
//	]]>
</script>
