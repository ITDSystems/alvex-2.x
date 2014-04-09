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

<#assign site=page.url.templateArgs.site>

<div class="dashlet site-data-lists">
   <div class="title">${msg("header.datalists")}</div>
   <div class="body scrollableList" <#if args.height??>style="height: ${args.height}px;"</#if>>
<#if lists?? && lists?size != 0>
   <#list lists as list>
      <div class="detail-list-item <#if list_index = 0>first-item<#elseif !list_has_next>last-item</#if>">
         <div>
            <div id="list">
               <a id="${args.htmlid}-details-span-${list_index}" href="${url.context}/page/site/${site}/documentsregister?active=${list.name?url}" class="theme-color-1" title="${(list.title!"")?html}">${(list.title!"")?html}</a>
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
