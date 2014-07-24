<#include "/org/alfresco/include/alfresco-template.ftl" />

<@templateHeader>
   <@markup id="resizer">
   <script type="text/javascript">//<![CDATA[
      new Alfresco.widget.Resizer("AlvexConversations");
   //]]></script>
   </@>
</@>

<@templateBody>
   <@markup id="alf-hd">
   <div id="alf-hd">
      <@region id="share-header" scope="global" chromeless="true"/>
   </div>
   </@>
   <@markup id="bd">
   <div id="bd">
      <div class="yui-t1" id="alfresco-myworkflows">
         <div id="yui-main">
            <div class="yui-b" id="alf-content">
               <@region id="conversations-title" scope="template" />
               <@region id="list" scope="template" />
            </div>
         </div>
         <div class="yui-b" id="alf-filters">
            <@region id="time-filter" scope="template" />
         </div>
      </div>
   </div>
   </@>
</@>

<@templateFooter>
   <@markup id="alf-ft">
   <div id="alf-ft">
      <@region id="footer" scope="global" />
   </div>
   </@>
</@>
