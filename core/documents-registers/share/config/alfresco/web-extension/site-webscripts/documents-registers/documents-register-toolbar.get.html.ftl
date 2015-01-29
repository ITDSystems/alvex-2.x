<#assign id = args.htmlid>
<#assign showRegistryConfig = (args.registryConfig?? && args.registryConfig == "true")>

<script type="text/javascript">//<![CDATA[
   new Alvex.DataListsToolbar("${id}").setOptions(
   {
      siteId: "${page.url.templateArgs.site!""}"
   }).setMessages(${messages});
   new Alvex.DocumentsRegistersToolbar("${id}").setOptions(
   {
   }).setMessages(${messages});
//]]></script>
<div id="${args.htmlid}-body" class="datalist-toolbar toolbar">
   <div id="${args.htmlid}-headerBar" class="header-bar flat-button theme-bg-2">
      <div class="left">
         <div class="new-row">
            <span id="${id}-newRowButton" class="yui-button yui-push-button">
               <span class="first-child">
                  <button type="button">${msg('button.new-row')}</button>
               </span>
            </span>
         </div>
         <div class="excel-export">
            <span id="${id}-excelButton" class="yui-button yui-push-button">
               <span class="first-child">
                  <button type="button">${msg('button.excel-export')}</button>
               </span>
            </span>
         </div>
         <div class="counters-config <#if showRegistryConfig?? && !showRegistryConfig>hidden</#if>">
            <span id="${id}-countersConfig" class="yui-button yui-push-button">
               <span class="first-child">
                  <button type="button">${msg('label.register-edit.title')}</button>
               </span>
            </span>
         </div>
         <div class="manage-rules <#if showRegistryConfig?? && !showRegistryConfig>hidden</#if>">
            <span id="${id}-rulesButton" class="yui-button yui-push-button">
               <span class="first-child">
                  <button type="button">${msg('button.manage-rules')}</button>
               </span>
            </span>
         </div>
         <div class="selected-items">
            <button class="no-access-check" id="${args.htmlid}-selectedItems-button" name="doclist-selectedItems-button">${msg("menu.selected-items")}</button>
            <div id="${args.htmlid}-selectedItems-menu" class="yuimenu">
               <div class="bd">
                  <ul>
                  <#list actionSet as action>
                     <li><a type="${action.asset!""}" rel="${action.permission!""}" href="${action.href}"><span class="${action.id}">${msg(action.label)}</span></a></li>
                  </#list>
                     <li><a href="#"><hr /></a></li>
                     <li><a href="#"><span class="onActionDeselectAll">${msg("menu.selected-items.deselect-all")}</span></a></li>
                  </ul>
               </div>
            </div>
         </div>
      </div>

      <div class="right" style="display: none;">
         <span id="${id}-printButton" class="yui-button yui-push-button print">
             <span class="first-child">
                 <button type="button">${msg('button.print')}</button>
             </span>
         </span>
         <span id="${id}-rssFeedButton" class="yui-button yui-push-button rss-feed">
             <span class="first-child">
                 <button type="button">${msg('button.rss-feed')}</button>
             </span>
         </span>
      </div>
   </div>
</div>
