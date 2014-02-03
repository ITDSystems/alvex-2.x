<#include "../alvex-meta.lib.ftl" />
<#assign fc=config.scoped["Edition"]["footer"]>
<div class="footer ${fc.getChildValue("css-class")!"footer-com"}">
   <span class="copyright">
      <img src="${url.context}/components/images/${fc.getChildValue("logo")!"alfresco-share-logo.png"}" alt="${fc.getChildValue("alt-text")!"Alfresco Community"}" height="27" />
      <span>${fc.getChildValue("alt-text")!"Alfresco Community"} (Alfresco Software, Inc. &copy; 2005-2014); Alvex ${alvexEdition?html} (ITD Systems, LLC &copy; 2010-2014)</span>
   </span>
</div>
