<#include "/org/alfresco/include/alfresco-template.ftl" />
<#include "/alvex-meta.lib.ftl" />

<@templateHeader />

<@templateBody>
	<div id="alf-hd">
		<#if useNewUI >
			<@region id="share-header" scope="global" chromeless="true"/>
		<#else>
			<@region id="header" scope="global" />
			<@region id="title" scope="template" />
			<@region id="navigation" scope="template" />
		</#if>
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
