<#include "/org/alfresco/include/alfresco-template.ftl" />
<#include "/alvex-meta.lib.ftl" />

<@templateHeader />

<@templateBody>
   <@markup id="alf-hd">
   <div id="alf-hd">
      <#if useNewUI >
         <@region id="share-header" scope="global" chromeless="true"/>
      <#else>
         <@region id="header" scope="global"/>
         <@region id="title" scope="template"/>
      </#if>
   </div>
   </@>
   <@markup id="bd">
   <div id="bd">
      <@region id="task-toolbar" style="width: 850px; float: left;" scope="page" />
      <div class="share-form" style="width: 850px; float: left;">
         <@region id="task-header" scope="page" />
         <@region id="task-form" scope="page" />
         <@region id="task-relations" scope="page" />
         <@region id="task-activities" scope="page" />
      </div>
      <div class="share-form-column" style="float: left;">
         <@region id="task-dates" scope="page" />
         <@region id="task-projects" scope="page" />
         <@region id="task-participants" scope="page" />
         <@region id="task-share" scope="page" />
      </div>
   </div>
   </@>
</@>

<@templateFooter>
   <@markup id="alf-ft">
   <div id="alf-ft">
      <@region id="footer" scope="global"/>
      <@region id="task-data-loader" scope="page" />
      <@region id="workflow-data-loader" scope="page" />
   </div>
   </@>
</@>
