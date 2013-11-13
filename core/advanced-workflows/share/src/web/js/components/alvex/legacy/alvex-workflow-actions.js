/**
 * Copyright (C) 2013 ITD Systems
 *
 * This file is part of Alvex
 *
 * Alvex is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Alvex is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Alvex. If not, see <http://www.gnu.org/licenses/>.
 */

if (typeof Alvex == "undefined" || !Alvex)
{
	var Alvex = {};
}

/**
 * Workflow WorkflowActions util
 *
 * @namespace Alvex
 * @class Alvex.WorkflowActions
 */
(function()
{
   /**
    * YUI Library aliases
    */
   var Dom = YAHOO.util.Dom,
      Event = YAHOO.util.Event;

   /**
    * Alfresco Slingshot aliases
    */
   var $html = Alfresco.util.encodeHTML,
         $combine = Alfresco.util.combinePaths,
         $siteURL = Alfresco.util.siteURL;

   /**
    * Alvex.WorkflowActions implementation
    */
   Alvex.WorkflowActions = {};
   Alvex.WorkflowActions.prototype =
   {
      
      /**
       * Prompts the user if the workflow really should be deleted
       *
       * @method _showDialog
       * @param workflowId {String} The workflow id
       * @param workflowTitle {String} THe workflow title
       * @private
       */
      deleteWorkflow: function WA_deleteWorkflow(workflowId, workflowTitle)
      {
         var me = this,
               wid = workflowId;
         Alfresco.util.PopupManager.displayPrompt(
         {
            title: this.msg("workflow.delete.title"),
            text: this.msg("workflow.delete.label", workflowTitle),
            noEscape: true,
            buttons: [
               {
                  text: Alfresco.util.message("button.yes", this.name),
                  handler: function WA_cancelWorkflow_yes()
                  {
                     this.destroy();
                     me._deleteWorkflow.call(me, wid);
                  }
               },
               {
                  text: Alfresco.util.message("button.no", this.name),
                  handler: function WA_cancelWorkflow_no()
                  {
                     this.destroy();
                  },
                  isDefault: true
               }]
         });
      },

      /**
       * Deletes the workflow
       *
       * @method _deleteWorkflow
       * @param workflowId {String} The workflow id
       * @private
       */
      _deleteWorkflow: function WA__deleteWorkflow(workflowId)
      {
         var me = this;
         var feedbackMessage = Alfresco.util.PopupManager.displayMessage(
         {
            text: this.msg("workflow.delete.feedback"),
            spanClass: "wait",
            displayTime: 0
         });

         // user has confirmed, perform the actual delete
         Alfresco.util.Ajax.jsonDelete(
         {
            url: Alfresco.constants.PROXY_URI + "api/workflow-instances/" + workflowId 
						+ "?forced=true",
            successCallback:
            {
               fn: function(response, workflowId)
               {
                  feedbackMessage.destroy();
                  if (response.json && response.json.success)
                  {
                     Alfresco.util.PopupManager.displayMessage(
                     {
                        text: this.msg("workflow.delete.success", this.name)
                     });

                     // Tell other components that workflow has been deleted
                     YAHOO.Bubbling.fire("workflowCancelled",
                     {
                        workflow:
                        {
                           id: workflowId
                        }
                     });
                  }
                  else
                  {
                     Alfresco.util.PopupManager.displayMessage(
                     {
                        text: Alfresco.util.message("workflow.delete.failure", this.name)
                     });
                  }
               },
               obj: workflowId,
               scope: this
            },
            failureCallback:
            {
               fn: function(response)
               {
                  feedbackMessage.destroy();
                  Alfresco.util.PopupManager.displayMessage(
                  {
                     text: Alfresco.util.message("workflow.delete.failure", this.name)
                  });
               },
               scope: this
            }
         });
      }
      
   }          
})();