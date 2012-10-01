<#include "/org/alfresco/components/component.head.inc">
<#assign controlId = fieldHtmlId + "-cntrl">

<div class="form-field">
	<div class="viewmode-label">${field.label?html}:</div>
	<div id="${controlId}"></div>
</div>

<script type="text/javascript">
	YAHOO.lang.later( 1500, null, function() {
		var today = new Date();
		document.getElementById("${controlId}").innerHTML = today.getDate() + '.' + (today.getMonth()+1) + '.' + today.getFullYear();
	} );
</script>
