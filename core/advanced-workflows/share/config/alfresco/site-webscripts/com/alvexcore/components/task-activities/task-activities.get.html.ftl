<#include "/org/alfresco/include/alfresco-macros.lib.ftl" />

<@markup id="css" >
   <#-- CSS Dependencies -->
   <@link href="${url.context}/res/components/alvex/alvex-task-activities.css" group="workflow"/>
</@>

<@markup id="js">
   <#-- JavaScript Dependencies -->
   <@script src="${url.context}/res/components/alvex/alvex-task-history.js" group="workflow"/>
   <@script src="${url.context}/res/components/alvex/alvex-task-discussion.js" group="workflow"/>
</@>

<@markup id="widgets">
   <@createWidgets group="workflow"/>
</@>

<#assign el=args.htmlid?js_string>

<@markup id="html">
   <@uniqueIdDiv>

<script type="text/javascript">
        function showActivitiesSection(name)
        {
                var historyBody = document.getElementById("${el}-history");
                var discussionBody = document.getElementById("${el}-discussion");
                if (name == "history")
                {
                        historyBody.style.display = "";
                        discussionBody.style.display = "none";
                }
                else
                {
                        historyBody.style.display = "none";
                        discussionBody.style.display = "";
                }
                YAHOO.Bubbling.fire("formVisibilityChanged");
        }
</script>

      <div id="${el}-body" class="form-manager task-activities">

         <div class="activities-header" id="${el}-activities-header">
            <div class="" id="${el}-discussion-header">
               <h2 onclick="showActivitiesSection('discussion');">${msg("header.workflowDiscussion")}</h2>
            </div>
            <div class="" id="${el}-history-header">
               <h2 onclick="showActivitiesSection('history');">${msg("header.workflowHistory")}</h2>
            </div>
         </div>

         <div class="clear line"></div>

         <div class="activities-body" id="${el}-activities-body">

            <div class="" id="${el}-history" style="display: none;">
               <h3>${msg("header.currentTasks")}</h3>
               <div class="clear"></div>
               <div id="${el}-workflow-currentTasks" class=""></div>
               <div class="clear"></div>
               <h3>${msg("header.completedTasks")}</h3>
               <div class="clear"></div>
               <div id="${el}-workflow-historyTasks" class=""></div>
            </div>

            <div class="" id="${el}-discussion">
               <div id="${el}-discussion-container" class="discussion"></div>
               <div id="${el}-discussion-inputContianer" style="width:100%">
                  <table style="width:100%">
                     <tr>
                        <td colspan="2">
                           <textarea id="${el}-discussion-textArea" name="-" tabindex="0" style="width:100%;"></textarea>
                        </td>
                     </tr>
                     <tr>
                        <td/>
                        <td align="right">
                           <img id="${el}-discussion-spinnerAnim" src="${url.context}/res/components/images/ajax_anim.gif" style="display:none;"/>
                           <input type="button" tabindex="0" id="${el}-discussion-addCommentButton" value="${msg("alvex.discussions.comment")}" />
                        </td>
                     </tr>
                  </table>
               </div>
            </div>

         </div>

      </div>
   </@>
</@>
