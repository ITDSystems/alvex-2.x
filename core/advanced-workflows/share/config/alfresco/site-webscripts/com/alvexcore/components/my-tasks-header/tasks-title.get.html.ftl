<@markup id="css" >
   <#-- CSS Dependencies -->
   <@link href="${url.context}/res/components/alvex/task-list-header.css" group="workflow"/>
</@>

<@markup id="js">
   <#-- JavaScript Dependencies -->
   <@script src="${url.context}/res/components/alvex/task-list-header.js" group="workflow"/>
   <@script src="${url.context}/res/components/alvex.js" group="workflow"/>
   <@script src="${url.context}/res/modules/simple-dialog.js" group="workflow"/>
   <@script src="${url.context}/res/js/alfresco-dnd.js" group="workflow"/>
</@>

<@markup id="widgets">
   <@createWidgets group="workflow"/>
</@>

<#assign el=args.htmlid?html>

<@markup id="html">
   <@uniqueIdDiv>
      <div class="page-title theme-bg-color-1 theme-border-1" style="line-height: 32px;">
         <h2 class="theme-color-3" style="float: left; padding-right: 20px;">
            <span id="${el}-title">${msg(args.title)}:</span>
            <span id="${el}-subtitle"><#if args.subtitle?? && msg(args.subtitle) != args.subtitle>${msg(args.subtitle)}</#if></span>
         </h2>
         <span id="${el}-body" class="task-list-toolbar toolbar">
            <span id="${el}-headerBar" class="header-bar flat-button theme-bg-2">
               <span class="header-actions">
                  <span class="hideable hidden">
                     <span class="attach-workflow hidden"><button id="${el}-attachWorkflow-button" name="attachWorkflow">${msg("action.attachWorkflow")}</button></span>
                     <span class="start-workflow"><button id="${el}-startWorkflow-button" name="startWorkflow">${msg("button.startWorkflow")}</button></span>
                     <span class="configure-page"><button id="${el}-configurePage-button" name="configurePage">${msg("button.configurePage")}</button></span>
					<select id="${el}-startWorkflow-button-menu"></select>
                  </span>
               </span>
            </span>
         </span>
      </div>
   </@>
</@>

<#assign pickerId = el + "-conf-dialog">

<div id="${pickerId}" class="picker yui-panel hidden">
   <div id="${pickerId}-head" class="hd">${msg("title.configurePage")}</div>
   <div id="${pickerId}-body" class="bd column-config-dialog-body">

      <div class="used">
         <h3 class="padded">${msg("title.usedColumns")}</h3>
         <ul id="${pickerId}-column-ul-1" class="usedList">
         </ul>
      </div>

      <div class="available">
         <h3 class="padded">${msg("title.availableColumns")}</h3>
         <ul id="${pickerId}-column-ul-0" class="availableList">
         </ul>
      </div>

      <div style="display: none;">
         <ul>
            <!-- The shadow dashlet that is used during drag n drop to "make space" for the dragged dashlet -->
            <li class="usedDashlet dnd-shadow" id="${pickerId}-dashlet-li-shadow"></li>
         </ul>
      </div>

   </div>
   <div class="ft">
      <input id="${pickerId}-ok" name="-" type="button" value="${msg("button.ok")}" />
      <input id="${pickerId}-cancel" name="-" type="button" value="${msg("button.cancel")}" />
   </div>
</div>


<!-- Attach Workflow Dialog -->

<#assign attachWorkflowDialog = el + "-attach-workflow-dialog">

<div id="${attachWorkflowDialog}" class="picker yui-panel hidden">
	<div id="${attachWorkflowDialog}-head" class="hd">${msg("action.attachWorkflow")}</div>
	<div id="${attachWorkflowDialog}-body" class="bd">
		<div class="attach-workflow-dialog">
			<div class="attach-workflow-dialog-search">
				<label for="${attachWorkflowDialog}-search">${msg("message.attachWorkflow.searchForWorkflows")}</label>
				<div><input id="${attachWorkflowDialog}-search" type="text" tabindex="0"/></div>
				<input id="${attachWorkflowDialog}-search-ok" name="-" type="button" value="${msg("button.search")}" />
			</div>
			<div id="${attachWorkflowDialog}-options-table"></div>
			<div id="${attachWorkflowDialog}-selected"></div>
		</div>
	</div>
	<!--div class="ft">
		<input id="${attachWorkflowDialog}-ok" name="-" type="button" value="${msg("action.attachWorkflow")}" />
		<input id="${attachWorkflowDialog}-cancel" name="-" type="button" value="${msg("button.cancel")}" />
	</div-->
</div>