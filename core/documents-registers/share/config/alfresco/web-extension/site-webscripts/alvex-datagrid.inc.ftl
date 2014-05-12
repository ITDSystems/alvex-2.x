<#macro renderAlvexDatagridHTML id hideMeta=false hideConfig=false hidePanel=false hideSelect=false hidePaginator=false>

<!-- Data Grid -->
<@link rel="stylesheet" type="text/css" href="${url.context}/res/components/alvex/datalists/datagrid.css" />
<@script type="text/javascript" src="${url.context}/res/modules/data-lists/datalist-actions.js" />
<@script type="text/javascript" src="${url.context}/res/components/alvex.js" />
<@script type="text/javascript" src="${url.context}/res/components/alvex/datalists/datagrid-renderers.js" />
<@script type="text/javascript" src="${url.context}/res/components/alvex/datalists/datagrid-search.js" />
<@script type="text/javascript" src="${url.context}/res/components/alvex/datalists/datagrid-search-renderers.js" />
<@script type="text/javascript" src="${url.context}/res/components/alvex/datalists/datagrid.js" />
<@script type="text/javascript" src="${url.context}/res/components/alvex/datalists/datagrid-actions.js" />
<@script type="text/javascript" src="${url.context}/res/components/alvex/simple-dialog.js" />
<@script type="text/javascript" src="${url.context}/res/components/alvex/interval-calendar.js" />
<@script type="text/javascript" src="${url.context}/res/js/alfresco-dnd.js" />

<div id="${id}-body" class="datagrid">
   <div class="datagrid-meta" <#if hideMeta>style="display:none"</#if>>
      <h2 id="${id}-title"></h2>
      <div id="${id}-listType" class="datagrid-description"></div>
      <div id="${id}-description" class="datagrid-description"></div>
   </div>
   <div class="datagrid-actions" <#if hideConfig>style="display:none"</#if>>
      <span class="configure-page"><button id="${id}-configurePage-button" name="configurePage">${msg("button.configurePage")}</button></span>
   </div>
   <div id="${id}-datagridBar" class="yui-ge datagrid-bar flat-button" <#if hidePanel>style="display:none"</#if>>
      <div class="yui-u first align-center">
         <div class="item-select" <#if hideSelect>style="display:none"</#if>>
            <button id="${id}-itemSelect-button" name="datagrid-itemSelect-button">${msg("menu.select")}</button>
            <div id="${id}-itemSelect-menu" class="yuimenu">
               <div class="bd">
                  <ul>
                     <li><a href="#"><span class="selectAll">${msg("menu.select.all")}</span></a></li>
                     <li><a href="#"><span class="selectInvert">${msg("menu.select.invert")}</span></a></li>
                     <li><a href="#"><span class="selectNone">${msg("menu.select.none")}</span></a></li>
                  </ul>
               </div>
            </div>
         </div>
         <div id="${id}-paginator" class="paginator" <#if hidePaginator>style="display:none"</#if>></div>
      </div>
      <div class="yui-u align-right">
         <div class="items-per-page" style="visibility: hidden;">
            <button id="${id}-itemsPerPage-button">${msg("menu.items-per-page")}</button>
         </div>
      </div>
   </div>

   <div id="${id}-search-form" name="search">
      <div id="${id}-search-container" class="hidden">
         <div style="background-color: #C0C0C0;">
            <strong style="display: inline-block; margin-bottom: 4px; margin-left: 10px; margin-top: 4px;">${msg("page.search.title")}</strong>
         </div>
         <table class="grid" style="border: 1px solid #C0C0C0; margin-bottom: 8px;"><tr id="${id}-search" ></tr></table>
         <div style="display:none">
            <button id="${id}-search-button">${msg("button.search")}</button>
         </div>
      </div>
   </div>

   <div id="${id}-grid" class="grid"></div>

   <div id="${id}-selectListMessage" class="hidden select-list-message">${msg("message.select-list")}</div>

   <div id="${id}-datagridBarBottom" class="yui-ge datagrid-bar datagrid-bar-bottom flat-button">
      <div class="yui-u first align-center">
         <div class="item-select">&nbsp;</div>
         <div id="${id}-paginatorBottom" class="paginator"></div>
      </div>
   </div>

   <!-- Action Sets -->
   <div style="display:none">
      <!-- Action Set "More..." container -->
      <div id="${id}-moreActions">
         <div title="onActionShowMore" class="onActionShowMore"><a href="#" class="show-more" title="${msg("actions.more")}"><span></span></a></div>
         <div class="more-actions hidden"></div>
      </div>

      <!-- Action Set Templates -->
      <div id="${id}-actionSet" class="action-set simple">
      <#if actionSet??>
      <#list actionSet as action>
         <div title="${action.func}" class="${action.className}"><a rel="${action.permission!""}" href="${action.href}" class="${action.type}" title="${msg(action.label)}"><span>${msg(action.label)}</span></a></div>
      </#list>
      </#if>
      </div>
   </div>
</div>

<#assign pickerId = id + "-conf-dialog">

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

</#macro>