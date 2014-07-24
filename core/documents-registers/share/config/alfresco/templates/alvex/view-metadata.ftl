<#include "/org/alfresco/include/alfresco-template.ftl" />

<@templateHeader>
   <@script type="text/javascript" src="${url.context}/res/modules/documentlibrary/doclib-actions.js" group="document-details"/>
   <@link rel="stylesheet" type="text/css" href="${url.context}/res/components/document-details/document-details-panel.css" group="document-details"/>
</@>

<@templateBody>
   <@markup id="alf-hd">
   <div id="alf-hd">
      <@region id="share-header" scope="global" chromeless="true"/>
   </div>
   </@>
   <@markup id="bd">
   <div id="bd">
      <@region id="actions-common" scope="template"/>
      <@region id="actions" scope="template"/>
      <@region id="node-header" scope="template"/>
      <div>
         <div style="width: 66%; float: left;">
            <div class="share-form">
               <@region id="view-metadata" scope="template" />
            </div>
            <@region id="comments" scope="template"/>
         </div>
         <div style="width: 32%; margin-left: 1.99%; float: right;">
            <@region id="document-actions" scope="template"/>
            <@region id="document-tags" scope="template"/>
            <@region id="document-links" scope="template"/>
            <@region id="document-permissions" scope="template"/>
            <@region id="document-workflows" scope="template"/>
            <@region id="document-versions" scope="template"/>
         </div>
      </div>
   </div>
   <@region id="doclib-custom" scope="template"/>
   </@>
</@>

<@templateFooter>
   <@markup id="alf-ft">
   <div id="alf-ft">
      <@region id="footer" scope="global" />
   </div>
   </@>
</@>