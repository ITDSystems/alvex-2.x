<#include "/org/alfresco/include/alfresco-macros.lib.ftl" />

<@markup id="css" >
   <#-- CSS Dependencies -->
   <@link href="${url.context}/res/components/alvex/alvex-task-projects.css" group="workflow"/>
</@>

<@markup id="js">
   <#-- JavaScript Dependencies -->
   <@script src="${url.context}/res/components/alvex/alvex-task-projects.js" group="workflow"/>
</@>

<@markup id="widgets">
   <@createWidgets group="workflow"/>
</@>

<#assign el=args.htmlid?js_string>

<@markup id="html">
   <@uniqueIdDiv>
      <div id="${el}-body" class="form-manager task-projects">
         <div class="section-header"><h2>${msg("header.projects")}</h2></div>
         <div id="${el}-projects-list" class=""></div>
         <div class="clear"></div>
         <div class="section-action">
            <span class="align-left yui-button yui-menu-button" id="${el}-add-project">
               <span class="first-child">
                  <button type="button" tabindex="0">${msg("action.addProject")}</button>
               </span>
            </span>
         </div>
      </div>
   </@>
</@>


<!-- Attach Project Dialog -->

<#assign attachProjectDialog = el + "-attach-project-dialog">

<div id="${attachProjectDialog}" class="picker yui-panel hidden">
	<div id="${attachProjectDialog}-head" class="hd">${msg("action.addProject")}</div>
	<div id="${attachProjectDialog}-body" class="bd">
		<div class="attach-project-dialog">
			<div class="attach-project-dialog-search hidden">
				<label for="${attachProjectDialog}-search">${msg("message.attachProject.searchForProjects")}</label>
				<div><input id="${attachProjectDialog}-search" type="text" tabindex="0"/></div>
				<input id="${attachProjectDialog}-search-ok" name="-" type="button" value="${msg("button.search")}" />
			</div>
			<div id="${attachProjectDialog}-options-table"></div>
			<div id="${attachProjectDialog}-selected"></div>
		</div>
	</div>
	<!--div class="ft">
		<input id="${attachProjectDialog}-ok" name="-" type="button" value="${msg("action.attachProject")}" />
		<input id="${attachProjectDialog}-cancel" name="-" type="button" value="${msg("button.cancel")}" />
	</div-->
</div>
