<script type="text/javascript">//<![CDATA[
(function()
{
   new Alfresco.widget.DashletResizer("${args.htmlid}", "${instance.object.id}");
   new Alfresco.widget.DashletTitleBarActions("${args.htmlid}").setOptions(
   {
      actions:
      [
         {
            cssClass: "help",
            bubbleOnClick:
            {
               message: "${msg("dashlet.help")?js_string}"
            },
            tooltip: "${msg("dashlet.help.tooltip")?js_string}"
         }
      ]
   });
})();
//]]></script>

<@markup id="html">
   <@uniqueIdDiv>
      <#assign site=page.url.templateArgs.site>
      <div class="dashlet site-registers">

      <@markup id="title">
         <div class="title">${msg("header.datalists")}</div>
      </@markup>

      <#-- TOOLBAR -->
      <@markup id="toolbar">
         <div class="toolbar flat-button">
            <div>
               <span class="align-right yui-button-align">

                  <span class="first-child">
                     <a href="documentsregister" class="theme-color-1">
                        <img src="${url.context}/res/components/images/list-16.png" style="vertical-align: text-bottom" width="16" />
                        ${msg("link.all-registers")}</a>
                  </span>

                  <#if (canCreate!false)?string == "true">
                     <span>|</span>
                     <span class="first-child">
                        <a href="documentsregister#new" class="theme-color-1">
                           <img src="${url.context}/res/components/images/new-list-16.png" style="vertical-align: text-bottom" width="16" />
                           ${msg("link.create-register")}</a>
                     </span>
                  </#if>

               </span>
               <div class="clear"></div>
            </div>
         </div>
      </@markup>

      <div class="body scrollableList" <#if args.height??>style="height: ${args.height}px;"</#if>>
         <#if lists?? && lists?size != 0>
            <#list lists as list>
               <div class="detail-list-item <#if list_index = 0>first-item<#elseif !list_has_next>last-item</#if>">
                  <div>
                     <div id="list">
                        <h3><a id="${args.htmlid}-details-span-${list_index}" href="${url.context}/page/site/${site}/documentsregister?active=${list.name?url}" class="theme-color-1" title="${(list.title!"")?html}">${(list.title!"")?html}</a></h3>
                        <div class="description">${(list.description!"")?html}</div>
                     </div>
                  </div>
               </div>
            </#list>
         <#else>
            <div class="dashlet-padding">
               <h3>${msg("label.noLists")}</h3>
            </div>
         </#if>
      </div>
   </div>
</@>
</@>
