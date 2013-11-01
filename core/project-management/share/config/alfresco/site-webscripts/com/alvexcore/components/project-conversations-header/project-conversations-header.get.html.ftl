<@markup id="css" >
   <#-- CSS Dependencies -->
   <@link href="${url.context}/res/components/alvex/project-conversations-header.css" group="workflow"/>
</@>

<@markup id="js">
   <#-- JavaScript Dependencies -->
   <@script src="${url.context}/res/components/alvex/project-conversations-header.js" group="workflow"/>
   <@script src="${url.context}/res/components/alvex.js" group="workflow"/>
   <@script src="${url.context}/res/js/alfresco-dnd.js" group="workflow"/>
   <@script src="${url.context}/res/modules/simple-dialog.js" />
</@>

<@markup id="widgets">
   <@createWidgets group="workflow"/>
</@>

<#assign el=args.htmlid?html>

<@markup id="html">
   <@uniqueIdDiv>
      <div class="page-title theme-bg-color-1 theme-border-1" style="line-height: 32px;">
         <h2 class="theme-color-3" style="float: left; padding-right: 20px;">
            <span id="${el}-title">${msg(args.title)}</span>
            <span id="${el}-subtitle"><#if args.subtitle?? && msg(args.subtitle) != args.subtitle>${msg(args.subtitle)}</#if></span>
         </h2>
         <span id="${el}-body" class="project-conversations-toolbar toolbar">
            <span id="${el}-headerBar" class="header-bar flat-button theme-bg-2">
               <span class="header-actions">
                  <span class="hideable hidden">
                     <span class="add-item"><button id="${el}-addItem-button" name="addItem">${msg("button.addItem")}</button></span>
                  </span>
               </span>
            </span>
         </span>
      </div>
   </@>
</@>