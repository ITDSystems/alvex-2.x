<#list set.children as item>
   <#if item.kind != "set">
      <#if (item_index % 2) == 0>
      <div class="yui-gc"><div class="yui-u first">
      <#else>
      <div class="yui-u last">
      </#if>
      <@formLib.renderField field=form.fields[item.id] />
      </div>
      <#if ((item_index % 2) != 0) || !item_has_next></div></#if>
   </#if>
</#list>
