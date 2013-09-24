<@markup id="css" >
   <#-- CSS Dependencies -->
   <@link href="${url.context}/res/components/alvex/alvex-task-toolbar.css" group="workflow"/>
   <@link href="${page.url.context}/res/components/people-finder/people-finder.css" group="workflow"/>
</@>

<@markup id="js">
   <#-- JavaScript Dependencies -->
   <@script src="${url.context}/res/components/alvex/alvex-task-toolbar.js" group="workflow"/>
   <@script src="${page.url.context}/res/components/people-finder/people-finder.js" group="workflow"/>
</@>

<@markup id="widgets">
   <@createWidgets group="workflow"/>
</@>

<#assign el=args.htmlid?js_string>

<@markup id="html">
   <@uniqueIdDiv>
      <#include "/org/alfresco/include/alfresco-macros.lib.ftl" />
      <div class="share-toolbar theme-bg-2" style="border-bottom: 0px solid #ccc; border-top: 1px solid #ccc;">
         <div class="navigation-bar task-toolbar">
            <div>

               <span class="<#if (page.url.args.myTasksLinkBack! == "true")>backLink<#else>forwardLink</#if>">
                  <#if (page.url.args.referrer == "workflows")>
                     <a href="${siteURL("my-workflows")}">${msg("link.myWorkflows")}</a>
                  <#else>
                     <a href="${siteURL("my-tasks")}">${msg("link.myTasks")}</a>
                  </#if>
               </span>

               <span class="links hidden">
                  <span class="actions">
                     <span class="claim hidden">
                        <button id="${el}-claim">${msg("button.claim")}</button>
                     </span>
                     <span class="reassign hidden">
                        <button id="${el}-reassign">${msg("button.reassign")}</button>   
                     </span>
                     <span class="release hidden">      
                        <button id="${el}-release">${msg("button.release")}</button>
                     </span>
                  </span>
               </span>

            </div>

            <!-- People Finder Dialog -->
            <div style="display: none;">
               <div id="${el}-reassignPanel" class="task-header reassign-panel">
                  <div class="hd">${msg("panel.reassign.header")}</div>
                  <div class="bd">
                     <div style="margin: auto 10px;">
                        <div id="${el}-peopleFinder"></div>
                     </div>
                  </div>
               </div>
            </div>

         </div>
      </div>

   </@>
</@>