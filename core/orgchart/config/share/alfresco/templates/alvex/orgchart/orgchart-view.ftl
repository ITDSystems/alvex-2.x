<#include "/org/alfresco/include/alfresco-template.ftl" />

<@templateHeader />

<@templateBody>
	<div id="alf-hd">
		<@region id="header" scope="global" />
		<@region id="title" scope="template" />
		<@region id="navigation" scope="template" />
	</div>
	<div id="bd">
		<@region id="orgchart-tree" scope="template"/>
	</div>
</@>

<@templateFooter>
	<div id="alf-ft">
		<@region id="footer" scope="global"/>
	</div>
</@>
