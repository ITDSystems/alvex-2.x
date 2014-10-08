/**
 * Copyright (C) 2005-2010 Alfresco Software Limited.
 * Copyright © 2012-2013 ITD Systems
 *
 * This file is part of Alvex
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

// Ensure root object exists
if (typeof Alvex == "undefined" || !Alvex)
{
	var Alvex = {};
}

/**
 * TaskParticipants component.
 *
 * @namespace Alvex
 * @class Alvex.TaskParticipants
 */
(function()
{
   /**
    * YUI Library aliases
    */
   var Dom = YAHOO.util.Dom,
      Event = YAHOO.util.Event,
      Selector = YAHOO.util.Selector;

  /**
    * Alfresco Slingshot aliases
    */
    var $html = Alfresco.util.encodeHTML,
       $hasEventInterest = Alfresco.util.hasEventInterest,
       $siteURL = Alfresco.util.siteURL,
       $combine = Alfresco.util.combinePaths;

   /**
    * TaskParticipants constructor.
    *
    * @param {String} htmlId The HTML id of the parent element
    * @return {Alvex.TaskParticipants} The new TaskParticipants instance
    * @constructor
    */
   Alvex.TaskParticipants = function TaskParticipants_constructor(htmlId)
   {
      Alvex.TaskParticipants.superclass.constructor.call(this, htmlId, ["button"]);

      // Re-register with our own name
      this.name = "Alvex.TaskParticipants";

      // Instance variables
      this.options = YAHOO.lang.merge(this.options, Alvex.TaskParticipants.superclass.options);
      Alfresco.util.ComponentManager.reregister(this);
      this.isRunning = false;
	  this.task = null;
      this.processingTask = false;

      /* Decoupled event listeners */
      YAHOO.Bubbling.on("taskDetailedData", this.onTaskDetailedData, this);
	  YAHOO.Bubbling.on("workflowDetailedData", this.onWorkflowDetailedData, this);

      return this;
   };

   /**
    * Extend from Alfresco.component.ShareFormManager
    */
   YAHOO.extend(Alvex.TaskParticipants, Alfresco.component.ShareFormManager, 
   {

      /**
       * Keeps track if this component is running an action or not
       *
       * @property isRunning
       * @type Boolean
       */
      isRunning: false,

      /**
       * The task instance id
       *
       * @property taskId
       * @type String
       */
      taskId: null,

      /**
       * Fired by YUI when parent element is available for scripting.
       * Template initialisation, including instantiation of YUI widgets and event listener binding.
       *
       * @method onReady
       */
      onReady: function TEH_onReady()
      {

      },      

      /**
       * Event handler called when the "taskDetailedData" event is received
       *
       * @method: onTaskDetailedData
       */
      onTaskDetailedData: function TEH_onTaskDetailedData(layer, args)
      {
         var task = args[1];
		 if( !task.id )
			 return;
		 this.task = task;
		 this.processingTask = true;

		var me = this;
         Alfresco.util.Ajax.jsonGet(
				 {
					url: Alfresco.constants.PROXY_URI + "api/alvex/workflow-instances/" 
							+ task.workflowInstance.id + "?includeTasks=true",
					successCallback:
					{
					   fn: function(resp)
					   {
						   YAHOO.Bubbling.fire("workflowDetailedData", resp.json.data);
						   me.processWorkflowData(resp.json.data);
					   },
					   scope: this
					},
					failureCallback:
					{
						fn: function (resp)
						{
							if (resp.serverResponse.statusText)
								Alfresco.util.PopupManager.displayMessage({ text: resp.serverResponse.statusText });
						},
						scope: this
					}
				 });
      },
	  
	  onWorkflowDetailedData: function(layer, args)
	  {
		  if( this.processingTask )
			  return;
		  var workflow = args[1];
		  if( !workflow.id )
			 return;
		  this.processWorkflowData(workflow);
	  },
	  
	  processWorkflowData: function(workflow)
	  {
		   var initiator = workflow.initiator;
		   var assignee = ( this.task ? this.task.owner : null );
		   var assignees = [];
		   for( var t in workflow.tasks )
		   {
			   var user = workflow.tasks[t].owner;
			   if( !user || user === null )
				   continue;
			   var notSeenBefore = true;
			   if(user.userName === initiator.userName || (assignee != null && user.userName === assignee.userName))
				   notSeenBefore = false;
			   for( var a in assignees )
				   if( user.userName === assignees[a].userName )
					   notSeenBefore = false;
			   if( notSeenBefore )
					assignees.push(user);
		   }
		   var container = Dom.get( this.id + "-people-list" );
		   container.appendChild( this.createUserElement(initiator, "initiator") );
		   if(assignee != null)
				container.appendChild( this.createUserElement(assignee, "assignee") );
		   for( var a in assignees )
			   container.appendChild( this.createUserElement(assignees[a], "otherTaskAssignee") );
	  },
	  
	  createUserElement: function(person, role)
	  {
		  var cover = document.createElement("div");
		  cover.className = "record";
		  var img = document.createElement("img");
		  img.src = Alfresco.constants.PROXY_URI + "slingshot/profile/avatar/" + person.userName;
		  var label = document.createElement("label");
		  var div = document.createElement("div");
		  div.innerHTML = this.msg("label." + role);
		  label.innerHTML = 
				  '<a href=' + Alfresco.constants.URL_PAGECONTEXT + 'user/' + person.userName + '/profile>' 
				  + person.firstName + ' ' + person.lastName + '</a>';
		  
		  cover.appendChild(img);
		  cover.appendChild(label);
		  cover.appendChild(div);
		  return cover;
	  }

   });
})();
