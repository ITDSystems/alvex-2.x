<#assign id=args.htmlid>
<#if formUI == "true">
   <@formLib.renderFormsRuntime formId=formId />
</#if>

<#macro renderSet set>
   <div class="set">
   <#if set.appearance??>
      <#if set.appearance == "fieldset">
         <fieldset><legend>${set.label}</legend>
      <#elseif set.appearance == "bordered-panel">
         <div class="set-bordered-panel">
            <div class="set-bordered-panel-heading">${set.label}</div>
            <div class="set-bordered-panel-body">
      <#elseif set.appearance == "panel">
         <div class="set-panel">
            <div class="set-panel-heading">${set.label}</div>
            <div class="set-panel-body">
      <#elseif set.appearance == "title">
         <div class="set-title">${set.label}</div>
      <#elseif set.appearance == "whitespace">
         <div class="set-whitespace"></div>
      <#elseif set.appearance == "spoiler-opened" || set.appearance == "spoiler-collapsed">
         <script type="text/javascript">
         function showSpoiler_${set.id}()
         {
            var inner = document.getElementById("sp_div_${set.id}");
            var button = document.getElementById("sp_button_${set.id}");
            if (inner.style.display == "none")
            {
               inner.style.display = "";
               button.value=" - ";
            }
            else
            {
               inner.style.display = "none";
               button.value=" + ";
            }
            YAHOO.Bubbling.fire("formVisibilityChanged");
         }
         </script>

         <div class="set-bordered-panel">
            <div class="set-bordered-panel-heading">

            <#if set.appearance == "spoiler-opened">
               <span><input id="sp_button_${set.id}" class="btn" type="button" onclick="var inner = document.getElementById('sp_div_${set.id}'); var button = document.getElementById('sp_button_${set.id}'); if (inner.style.display == 'none') { inner.style.display = ''; button.value=' - '; } else { inner.style.display = 'none'; button.value=' + '; } YAHOO.Bubbling.fire('formVisibilityChanged');" value=" - " /></span>
            <#else>
               <span><input id="sp_button_${set.id}" class="btn" type="button" onclick="var inner = document.getElementById('sp_div_${set.id}'); var button = document.getElementById('sp_button_${set.id}'); if (inner.style.display == 'none') { inner.style.display = ''; button.value=' - '; } else { inner.style.display = 'none'; button.value=' + '; } YAHOO.Bubbling.fire('formVisibilityChanged');" value=" + " /></span>
            </#if>

               ${set.label}
            </div>

         <#if set.appearance == "spoiler-opened">
            <div id="sp_div_${set.id}" class="set-bordered-panel-body">
         <#else>
            <div id="sp_div_${set.id}" class="set-bordered-panel-body" style="display:none;">
         </#if>
      </#if>
   </#if>
   
   <#if set.template??>
      <#include "${set.template}" />
   <#else>
      <#list set.children as item>
         <#if item.kind == "set">
            <@renderSet set=item />
         <#else>
            <@formLib.renderField field=form.fields[item.id] />
         </#if>
      </#list>
   </#if>
   
   <#if set.appearance??>
      <#if set.appearance == "fieldset">
         </fieldset>
      <#elseif set.appearance == "panel" || set.appearance == "bordered-panel">
            </div>
         </div>
      <#elseif set.appearance == "spoiler-opened" || set.appearance == "spoiler-collapsed">
            </div>
         </div>
      </#if>
   </#if>
   </div>
</#macro>

<div id="${id}-dialog">
   <div id="${id}-dialogTitle" class="hd hidden">${msg("title")}</div>
   <div class="bd">

      <div id="${formId}-container" class="form-container">

         <#if form.showCaption?exists && form.showCaption>
            <div id="${formId}-caption" class="caption"><span class="mandatory-indicator">*</span>${msg("form.required.fields")}</div>
         </#if>
      
         <form id="${formId}" method="${form.method}" accept-charset="utf-8" enctype="${form.enctype}" action="${form.submissionUrl}">
   
         <#if form.destination??>
            <input id="${formId}-destination" name="alf_destination" type="hidden" value="${form.destination}" />
         </#if>
   
            <div id="${formId}-fields" class="form-fields">

               <#list form.structure as item>
                  <#if item.kind == "set">
                     <@renderSet set=item />
                  <#else>
                     <@formLib.renderField field=form.fields[item.id] />
                  </#if>
               </#list>

            </div>

            <#if form.mode != "view">
            <div class="bdft" style="margin-top: 0.5em; padding-left: 1em;">
               <input id="${formId}-submit" type="submit" value="${msg("form.button.submit.label")}" />
               &nbsp;<input id="${formId}-cancel" type="button" value="${msg("form.button.cancel.label")}" />
            </div>
            </#if>
      
         </form>

      </div>
   </div>
</div>
