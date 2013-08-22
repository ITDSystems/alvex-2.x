/**
 * Copyright (C) 2005-2010 Alfresco Software Limited.
 * Copyright © 2012 ITD Systems
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

// TODO FIXME - looks like they should be global to interact with jit-yc.js
var labelType, useGradients, nativeTextSupport, animate;

// Ensure root object exists
if (typeof Alvex == "undefined" || !Alvex)
{
	var Alvex = {};
}

/**
 * TaskEditHeader component.
 *
 * @namespace Alvex
 * @class Alvex.TaskEditHeader
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
    * TaskEditHeader constructor.
    *
    * @param {String} htmlId The HTML id of the parent element
    * @return {Alvex.TaskEditHeader} The new TaskEditHeader instance
    * @constructor
    */
   Alvex.TaskEditHeader = function TaskEditHeader_constructor(htmlId)
   {
      Alvex.TaskEditHeader.superclass.constructor.call(this, htmlId, ["button"]);

      // Re-register with our own name
      this.name = "Alvex.TaskEditHeader";

      // Instance variables
      this.options = YAHOO.lang.merge(this.options, Alvex.TaskEditHeader.superclass.options);
      Alfresco.util.ComponentManager.reregister(this);
      this.isRunning = false;
      this.taskId = null;

      /* Decoupled event listeners */
      YAHOO.Bubbling.on("taskDetailedData", this.onTaskDetailedData, this);

      return this;
   };

   YAHOO.extend(Alvex.TaskEditHeader, Alfresco.component.ShareFormManager,
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
         // Load in the People Finder component from the server
         Alfresco.util.Ajax.request(
         {
            url: Alfresco.constants.URL_SERVICECONTEXT + "components/people-finder/people-finder",
            dataObj:
            {
               htmlid: this.id + "-peopleFinder"
            },
            successCallback:
            {
               fn: this.onPeopleFinderLoaded,
               scope: this
            },
            failureMessage: "Could not load People Finder component",
            execScripts: true
         });

      },      

      /**
       * Called when the people finder template has been loaded.
       * Creates a dialog and inserts the people finder for choosing assignees.
       *
       * @method onPeopleFinderLoaded
       * @param response The server response
       */
      onPeopleFinderLoaded: function TEH_onPeopleFinderLoaded(response)
      {
         // Inject the component from the XHR request into it's placeholder DIV element
         var finderDiv = Dom.get(this.id + "-peopleFinder");
         finderDiv.innerHTML = response.serverResponse.responseText;

         // Create the Assignee dialog
         this.widgets.reassignPanel = Alfresco.util.createYUIPanel(this.id + "-reassignPanel");

         // Find the People Finder by container ID
         this.widgets.peopleFinder = Alfresco.util.ComponentManager.get(this.id + "-peopleFinder");

         // Set the correct options for our use
         this.widgets.peopleFinder.setOptions(
         {
            singleSelectMode: true,
            addButtonLabel: this.msg("button.select")
         });

         // Make sure we listen for events when the user selects a person
         YAHOO.Bubbling.on("personSelected", this.onPersonSelected, this);
      },

      /**
       * Called when the user has selected an assigne from the people finder.
       *
       * @method onPersonSelected
       * @param e DomEvent
       * @param args Event parameters (depends on event type)
       */
      onPersonSelected: function TEH_onPersonSelected(e, args)
      {
         // This is a "global" event so we ensure the event is for the current panel by checking panel visibility.
         if ($hasEventInterest(this.widgets.peopleFinder, args))
         {
            this.widgets.reassignPanel.hide();
            this._updateTaskProperties(
            {
               "cm_owner": args[1].userName
            }, "reassign");
         }
      },

      /**
       * Event handler called when the "taskDetailedData" event is received
       *
       * @method: onTaskDetailedData
       */
      onTaskDetailedData: function TEH_onTaskDetailedData(layer, args)
      {
         // Hide button on the bottom of the form
         // Dom.addClass(Selector.query(".form-buttons", this.id.replace('data-header','data-form').replace(/task-edit.*/, 'task-edit'), true), "hidden");

         var task = args[1];

         // Hide actions buttons if necessary
         if( ! task.isEditable )
         {
            Dom.addClass( 
               Selector.query(".suggested-actions", this.id.replace('data-header','data-form').replace(/task-edit.*/, 'task-edit'), true), 
               "hidden"
            );
         }

         // Save task id so we can use it when invoking actions later
         this.taskId = task.id;

         // Display actions and create yui buttons
         Selector.query("h1 span", this.id, true).innerHTML = $html(task.workflowInstance.message);
         Selector.query("h3 span", this.id, true).innerHTML = $html(task.title);

         var workflowId = task.workflowInstance.id,
            workflowDetailsUrl = "workflow-details?workflowId=" + workflowId + "&taskId=" + this.taskId;
         if (this.options.referrer)
         {
            workflowDetailsUrl += "&referrer=" + encodeURIComponent(this.options.referrer);
         }
         else if (this.options.nodeRef)
         {
            workflowDetailsUrl += "&nodeRef=" + encodeURIComponent(this.options.nodeRef);
         }
         Selector.query("a", this.id + '-workflow', true).setAttribute("href", Alfresco.util.siteURL(workflowDetailsUrl));
         Dom.removeClass(Selector.query(".links", this.id, true), "hidden");

         Alfresco.util.Ajax.jsonGet(
         {
            url: $combine(Alfresco.constants.PROXY_URI, "api/alvex/related-workflows/", workflowId, "/parent-task"),
            successCallback:
            {
               fn: function(resp)
               {
                  if( resp.json.data.parentTask == '' )
                     return;
                  var parentTaskUrl = "task-details?taskId=" + resp.json.data.parentTask;
                  if (this.options.referrer)
                  {
                     parentTaskUrl += "&referrer=" + encodeURIComponent(this.options.referrer);
                  }
                  Selector.query("a", this.id + '-parent', true).setAttribute("href", Alfresco.util.siteURL(parentTaskUrl));
                  Dom.removeClass(Dom.get(this.id + '-parent'), "hidden");
               },
               scope: this
            }
         });

         // ALF-13115 fix, inform user that this task has been completed
         if (!task.isEditable)
         {
            Alfresco.util.PopupManager.displayMessage(
            {
               text: this.msg("message.task.completed"),
               displayTime: 2
            });

            YAHOO.lang.later(100, this, function()
            {
            	var referrerValue = Alfresco.util.getQueryStringParameter('referrer');
            	
            	// Check referrer and fall back to user dashboard if unavailable.
            	if(referrerValue) {
            		if(referrerValue == 'tasks') {
            			document.location.href = $siteURL("my-tasks");
            		} else if(referrerValue='workflows') {
            			document.location.href = $siteURL("my-workflows");
            		}
            	} else {
            		document.location.href = this.getSiteDefaultUrl() || Alfresco.constants.URL_CONTEXT;
            	}
            }, []);
            return;
         }
         
         if (task.isReassignable)
         {
            // Task is reassignable
            this.widgets.reassignButton = Alfresco.util.createYUIButton(this, "reassign", this.onReassignButtonClick);
            Dom.removeClass(Selector.query(".actions .reassign", this.id), "hidden");
         }
         
         if (task.isClaimable)
         {
            // Task is claimable
            this.widgets.claimButton = Alfresco.util.createYUIButton(this, "claim", this.onClaimButtonClick);
            Dom.removeClass(Selector.query(".actions .claim", this.id), "hidden");
            Dom.removeClass(Selector.query(".unassigned-message", this.id), "hidden");
         }
         
         if (task.isReleasable)
         {
            // Task is releasable
            this.widgets.releaseButton = Alfresco.util.createYUIButton(this, "release", this.onReleaseButtonClick);
            Dom.removeClass(Selector.query(".actions .release", this.id), "hidden");
         }

         // Tree of related workflows
         if ( Dom.get( this.id + '-tree-view' ) )
         {
            this.widgets.treeView = Alfresco.util.createYUIButton(this, "tree-view", this.onTreeViewClick);
            Dom.removeClass(Selector.query(".actions .tree-view", this.id), "hidden");
         }

         // Mark task as started
         var dataObj = {};
         dataObj["prop_bpm_status"] = "In Progress";

         var actionUrl = Alvex.util.getFormElement(this.id.replace('header','form') + '-form').action; 

         Alvex.util.processAjaxQueue({
            queue: [
               {
                  url: actionUrl,
                  method: Alfresco.util.Ajax.POST,
                  dataObj: dataObj,
                  requestContentType: Alfresco.util.Ajax.JSON
               }
            ]
         });

      },

      /**
       * Event handler called when the "release" button is clicked
       *
       * @method: onReleaseButtonClick
       */
      onReleaseButtonClick: function TEH_onReleaseButtonClick(layer, args)
      {
         this._updateTaskProperties(
         {
            "cm_owner": null
         }, "release");
      },

      /**
       * Event handler called when the "claim" button is clicked
       *
       * @method: onClaimButtonClick
       */
      onClaimButtonClick: function TEH_onClaimButtonClick(layer, args)
      {
         this._updateTaskProperties(
         {
            "cm_owner": Alfresco.constants.USERNAME
         }, "claim");
      },

      /**
       * Event handler called when the "reassign" button is clicked
       *
       * @method: onReassignButtonClick
       */
      onReassignButtonClick: function TEH_onReassignButtonClick(layer, args)
      {
         this.widgets.peopleFinder.clearResults();
         this.widgets.reassignPanel.show();
      },

      onTreeViewClick: function (layer, args)
      {
         if( this.widgets.treePanel )
         {
            this.widgets.treePanel.show()
            return;
         }

         Alfresco.util.Ajax.jsonGet(
         {
            url: $combine(Alfresco.constants.PROXY_URI, "api/alvex/related-workflows/task/", this.taskId, "/tree"),
            successCallback:
            {
               fn: function(resp)
               {
                  if( resp.json.data == '' )
                     return;
                  this.widgets.treePanel = Alfresco.util.createYUIPanel(this.id + "-treePanel");
                  this.createJIT(resp.json.data);
                  this.widgets.treePanel.show();
               },
               scope: this
            }
         });
      },

		// Create JIT canvas and fill it with data
		createJIT: function(tree)
		{
			/* Get client parameters and set rendering options - it was just copy-pasted.
			* I guess it is something great, but I have no idea how it works.
			*/
			var ua = navigator.userAgent;
			var iStuff = ua.match(/iPhone/i) || ua.match(/iPad/i);
			var typeOfCanvas = typeof HTMLCanvasElement;
			var nativeCanvasSupport = (typeOfCanvas == 'object' || typeOfCanvas == 'function');
			var textSupport = nativeCanvasSupport 
					&& (typeof document.createElement('canvas').getContext('2d').fillText == 'function');
			// It is set based on the fact that ExCanvas provides text support for IE 
			// and that as of today iPhone/iPad current text support is lame
			labelType = (!nativeCanvasSupport || (textSupport && !iStuff)) ? 'Native' : 'HTML';
			nativeTextSupport = labelType == 'Native';
			useGradients = nativeCanvasSupport;
			animate = !(iStuff || !nativeCanvasSupport);

			me = this;

			this.options.st = new $jit.ST({

				// tree orientation
				orientation: 'top',

				// levels of subtree to show, relative to the selected node
				levelsToShow: 10,

				// show the whole tree whether it fits into canvas or not
				constrained: false,

				// id of viz container element
				injectInto : this.id + '-treePanel-canvas',

				// set duration for the animation
				duration : 250,

				// set animation transition type
				transition : $jit.Trans.Quart.easeInOut,

				// set distance between node and its children
				levelDistance : 60,

				// distance from the selected node to the center of the canvas
				offsetX: 0,
				offsetY: 150,

				// enable panning
				Navigation : {
					enable : true,
					panning : true
				},

				// set node and edge styles
				// set overridable=true for styling individual
				// nodes or edges
				Node : {
					height : 40,
					width : 150,
					autoWidth : false,	// set it to auto-adapt to the label width
					autoHeight : true,	// set it to auto-adapt to the label height
					type : 'rectangle',
					align : 'center',
					color : '#ddd',
					overridable : true
				},

				Edge : {
					type : 'bezier',
					color : '#aaa',
					overridable : true
				},

				onBeforeCompute : function(node) {
					// Do smth clever here
				},

				onAfterCompute : function() {
					// Do smth clever here
				},

				// This method is called on DOM label creation.
				// We use it to assign necessary events for them
				onCreateLabel : function(label, node)
				{
					label.id = node.id;
					label.innerHTML = '<table style="height: 100%; width: 100%;" id="' + node.id + '-view-container">'
								+ '<tr><td style="height=100%;">'
								+ '<a href="/share/page/workflow-details?workflowId=' + node.id + '" ' 
								+ ' id="' + node.id + '-view">' + node.name + '</a>' 
								+ '</td></tr></table>';

					/*YAHOO.util.Event.on(label.id, 'click', me.onContainerClick, node, me);
					YAHOO.util.Event.on(label.id + '-view', 'click', me.onViewLinkClick, node, me);*/

					// set label styles
					var style = label.style;
					style.width = 150 + 'px';
					style.height = 40 + 'px';
					style.cursor = 'pointer';
					style.color = '#333';
					style.fontSize = 14 + 'px';
					style.textAlign = 'center';

				},

				// This method is called right before plotting
				// a node. It's useful for changing an individual node
				// style properties before plotting it.
				// The data properties prefixed with a dollar
				// sign will override the global node style properties.
				onBeforePlotNode : function(node)
				{
					// default node height
					var label_height = 40;

					// get height of the node label
					var label = document.getElementById(node.id + "-view-container");
					if(label && label.clientHeight > 40)
						label_height = label.clientHeight;

					// if label is too big - resize node
					if(label_height > node.data.$height)
						node.data.$height = label_height;

					// add some color to the nodes in the path between the
					// root node and the selected node.
					if (node.selected) {
						node.data.$color = "#94C4E7";
					} else {
						delete node.data.$color;
						// if the node belongs to the last plotted level
						if (!node.anySubnode("exist")) {
							// count children number
							var count = 0;
							node.eachSubnode(function(n) {
								count++;
							});
							// assign a node color based on
							// how many children it has
							node.data.$color = '#ddd';
						}
					}
				},

				// This method is called right before plotting
				// an edge. It's useful for changing an individual edge
				// style properties before plotting it.
				// Edge data proprties prefixed with a dollar sign will
				// override the Edge global style properties.
				onBeforePlotLine : function(adj)
				{
					if (adj.nodeFrom.selected && adj.nodeTo.selected) {
						adj.data.$color = "#aaa";
						adj.data.$lineWidth = 3;
					} else {
						delete adj.data.$color;
						delete adj.data.$lineWidth;
					}
				}
			});

			// load json data to draw initial orgchart group scheme
			this.options.st.loadJSON( this.copyTreeForJIT(tree[0]) );

			// compute node positions and layout
			this.options.st.compute();

			// optional: make a translation of the tree
			this.options.st.geom.translate(new $jit.Complex(-200, 0), "current");

			// emulate a click on the root node
			this.options.st.onClick(this.options.st.root);

			// small hack to ensure nodes sizes were really recalculated _after_ labels were displayed
			this.options.st.refresh();
			this.options.st.refresh();

		},

		copyTreeForJIT: function(tree)
		{
			var jitTree = tree;
			jitTree.name = jitTree.title;
			for(var c in tree.children)
				jitTree.children[c] = this.copyTreeForJIT(tree.children[c]);
			return jitTree;
		},

      /**
       * Updates a task property
       *
       * @method: _updateTaskProperties
       * @private
       */
      _updateTaskProperties: function TEH__updateTaskProperties(properties, action)
      {
         this._disableActionButtons(true);
         YAHOO.lang.later(2000, this, function()
         {
            if (this.isRunning)
            {
               if (!this.widgets.feedbackMessage)
               {
                  this.widgets.feedbackMessage = Alfresco.util.PopupManager.displayMessage(
                  {
                     text: this.msg("message." + action),
                     spanClass: "wait",
                     displayTime: 0
                  });
               }
               else if (!this.widgets.feedbackMessage.cfg.getProperty("visible"))
               {
                  this.widgets.feedbackMessage.show();
               }
            }
         }, []);

         // Run rules for folder (and sub folders)
         if (!this.isRunning)
         {
            this.isRunning = true;

            // Start/stop inherit rules from parent folder
            Alfresco.util.Ajax.jsonPut(
            {
               url: Alfresco.constants.PROXY_URI_RELATIVE + "api/task-instances/" + this.taskId,
               dataObj: properties,
               successCallback:
               {
                  fn: function(response, action)
                  {
                     this.isRunning = false;
                     var data = response.json.data;
                     if (data)
                     {
                        Alfresco.util.PopupManager.displayMessage(
                        {
                           text: this.msg("message." + action + ".success")
                        });

                        YAHOO.lang.later(3000, this, function(data)
                        {
                           if (data.owner && data.owner.userName == Alfresco.constants.USERNAME)
                           {
                              // Let the user keep working on the task since he claimed it
                              document.location.reload();
                           }
                           else
                           {
                              // Take the user to the most suitable place
                              this.navigateForward(true);
                           }
                        }, data);

                     }
                  },
                  obj: action,
                  scope: this
               },
               failureCallback:
               {
                  fn: function(response)
                  {
                     this.isRunning = false;
                     this._disableActionButtons(false);
                     Alfresco.util.PopupManager.displayPrompt(
                     {
                        title: this.msg("message.failure"),
                        text: this.msg("message." + action + ".failure")
                     });
                  },
                  scope: this
               }
            });
         }
      },

      _disableActionButtons: function(disabled)
      {
         if (this.widgets.reassignButton)
         {
            this.widgets.reassignButton.set("disabled", disabled)
         }
         if (this.widgets.releaseButton)
         {
            this.widgets.releaseButton.set("disabled", disabled)
         }
         if (this.widgets.claimButton)
         {
            this.widgets.claimButton.set("disabled", disabled)
         }
      }

   });
})();
