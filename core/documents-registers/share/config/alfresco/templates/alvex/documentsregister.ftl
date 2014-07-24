<#include "/org/alfresco/include/alfresco-template.ftl" />

<@templateHeader>
   <script type="text/javascript">//<![CDATA[
   (function()
   {
      // If no location.hash exists, convert certain params in location.search to location.hash and replace the page
      var loc = window.location;
      if (loc.hash === "" && loc.search !== "")
      {
         var qs, q, url = loc.protocol + "//" + loc.host + loc.pathname, hash = "";

      <#if PORTLET>
         qs = {};
         <#if url.args.page??>qs.page = "${(url.args.page!"")?js_string}";</#if>
         <#if url.args.filter??>qs.filter = "${(url.args.filter!"")?js_string}";</#if>
      <#else>
         qs = Alfresco.util.getQueryStringParameters();
      </#if>

         var hashParams =
         {
            "page": true,
            "filter": true
         },
            filterDataParam = "filterData";

         for (q in qs)
         {
            if (qs.hasOwnProperty(q) && q in hashParams)
            {
               hash += "&" + escape(q) + "=" + escape(qs[q]);
               if (q === "filter")
               {
                  // Check for filterData in QueryString for the "filter" case
                  if (qs.hasOwnProperty(filterDataParam))
                  {
                     hash += escape("|" + qs[filterDataParam]);
                     delete qs[filterDataParam];
                  }
               }
               delete qs[q];
            }
         }
         
         if (hash.length > 0)
         {
         <#if PORTLET>
            top.location.hash = hash.substring(1);
         <#else>
            url += Alfresco.util.toQueryString(qs) + "#" + hash.substring(1);
            window.location.replace(url);
         </#if>
         }
      }
   })();
   //]]></script>
   <@script type="text/javascript" src="${url.context}/res/components/alvex/resizer.js"></@script>
   <script type="text/javascript">//<![CDATA[
      new Alvex.Resizer("Documents Register");
   //]]></script>
   <@script type="text/javascript" src="${url.context}/res/modules/data-lists/datalist-actions.js"></@script>
</@>

<@templateBody>
   <div id="alf-hd">
      <@region id="share-header" scope="global" chromeless="true"/>
   </div>
   <div id="bd">
      <@region id="actions-common" scope="template" />
        <div class="yui-t1" id="alfresco-data-lists">
           <div id="yui-main">
              <div class="yui-b" id="alf-content">
                <@region id="toolbar" scope="template" />
                <@region id="datagrid" scope="template" />
              </div>
           </div>
           <div class="yui-b" id="alf-filters">
               <@region id="register-list" scope="template" />
           </div>
        </div>
   </div>
</@>

<@templateFooter>
   <div id="alf-ft">
      <@region id="footer" scope="global" />
   </div>
</@>
