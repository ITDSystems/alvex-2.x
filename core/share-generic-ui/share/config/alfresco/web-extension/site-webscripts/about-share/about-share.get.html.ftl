<#assign el=args.htmlid?html>
<#assign aboutConfig=config.scoped["Edition"]["about"]>
<div id="${el}-dialog" class="about-share">
   <div class="bd">
      <div id="${el}-logo" class="${aboutConfig.getChildValue("css-class")!logo-com} logo">
         <div class="about">
            <#assign split=serverVersion?index_of(" ")>
            <div class="header">Alfresco ${serverEdition?html} v${serverVersion?substring(0, split)?html}</div>
            <div>${serverVersion?substring(split+1)?html} schema ${serverSchema?html}</div>
            <#assign split=server.version?index_of(" ")>
            <div class="header">Spring Surf and ${server.edition?html} v${server.version?substring(0, split)?html}</div>
            <div>${server.version?substring(split+1)?html}</div>
            <div class="header">Alvex ${alvexEdition?html} v${alvexVersion?html} (${alvexCodename})</div>
            <div class="contributions-bg" style="height: 55px;"></div>
            <div class="contributions-wrapper" style="height: 55px;">
               <div id="${el}-contributions" class="contributions" style="margin-top: 55px; padding-bottom: 55px;">
Alfresco Contributors...
<br/><br/>
Will Abson<br/>
Igor Blanco<br/>
Sylvain Chambon<br/>
Philippe Dubois<br/>
Ray Gauss II<br/>
Dave Gillen<br/>
Romain Guinot<br/>
Antti Jokipii<br/>
Markus Konrad<br/>
Michael Kriske<br/>
Carina Lansing<br/>
Sebastian Lorenz<br/>
Marlin Manowski<br/>
Jesper Steen M&oslash;ller<br/>
Peter Monks<br/>
Paolo Nacci<br/>
Guillaume Nodet<br/>
Ian Norton<br/>
Jan Pfitzner<br/>
Noel Sharpe<br/>
Alfresco Engineering
<br/><br/>
Atol Conseils et D&eacute;veloppements<br/>
CEC<br/>
DMC.de<br/>
IP Tech<br/>
Optaros<br/>
Zia Consulting<br/>
Zaizi<br/>
               </div>
            </div>
            <div class="copy">&copy; 2005-2014 Alfresco Software Inc. All rights reserved.</div>
            <div class="copy">
               <a href="http://www.alfresco.com" target="new">www.alfresco.com</a>
               <a href="http://www.alfresco.com/legal/agreements/" target="new">Legal and License</a>
            </div>
         </div>
      </div>
   </div>
</div>
