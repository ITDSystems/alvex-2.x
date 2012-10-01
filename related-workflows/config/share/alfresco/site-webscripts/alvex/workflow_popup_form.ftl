<#assign id=args.htmlid>
<#if formUI == "true">
   <@formLib.renderFormsRuntime formId=formId />
</#if>

<div id="${id}-dialog" class="share-form">
   <div id="${id}-dialogTitle" class="hd">${msg("title")}</div>
   <div class="bd">

      <div id="${formId}-container" class="form-container">
      
         <form id="${formId}" method="${form.method}" accept-charset="utf-8" enctype="${form.enctype}" action="${form.submissionUrl}">
   
            <div id="${formId}-fields" class="form-fields" style="width:auto;">

		         <#-->div class="yui-g">
		            <h2 id="${args.htmlid}-dialogHeader">${msg("header")}</h2>
   		         </div-->
               <#list form.structure as item>
                  <#if item.kind == "set">
                     <@formLib.renderSet set=item />
                  <#else>
                     <@formLib.renderField field=form.fields[item.id] />
                  </#if>
               </#list>

            </div>

            <div class="bdft">
               <input id="${formId}-submit" type="submit" value="${msg("form.button.submit.label")}" />
			   <div style="display:none;"><input id="${formId}-cancel" type="button" value="${msg("form.button.cancel.label")}"/></div>
            </div>
      
         </form>

      </div>
   </div>
</div>
