<#include "/org/alfresco/include/alfresco-template.ftl" />

<@templateHeader />

<@templateBody>
	<div id="alf-hd">
		<@region id="share-header" scope="global" chromeless="true"/>
	</div>
	<div id="bd">
		<@region id="tasks-view" scope="template"/>
	</div>
</@>

<@templateFooter>
	<div id="alf-ft">
		<@region id="footer" scope="global"/>
	</div>
</@>
