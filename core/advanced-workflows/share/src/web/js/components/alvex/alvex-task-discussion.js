/**
 * Copyright © 2012 ITD Systems
 * 
 * This file is part of Alvex
 * 
 * This program is free software: you can redistribute it and/or modify it under
 * the terms of the GNU Lesser General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or (at your option) any
 * later version.
 * 
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU Lesser General Public License for more
 * details.
 * 
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

// Ensure root object exists
if (typeof Alvex == 'undefined' || !Alvex)
{
	var Alvex = {};
}
	
(function()
{
	Alvex.TaskDiscussion = function(htmlId)
	{
		Alvex.TaskDiscussion.superclass.constructor.call(this, 'Alvex.TaskDiscussion', htmlId);
		
		// Instance variables
		this.options = YAHOO.lang.merge(this.options, Alvex.TaskDiscussion.superclass.options);
		Alfresco.util.ComponentManager.reregister(this);
		
		/* Decoupled event listeners */
		YAHOO.Bubbling.on("workflowDetailedData", this.onWorkflowDetailedData, this);
		
		return this;
	};

	YAHOO.extend(Alvex.TaskDiscussion, Alfresco.component.Base,
	{
		isUpdating: false,

		options:
		{
			/*
			 * By default we do not create automatically when control is ready
			 */
			createOnReady: false,
			/*
			 * By default we do not use remote API to persist form when
			 * discussion is just created
			 */
			persistOnCreate: false,
			/*
			 * Property name to be used to submit the form
			 */
			propName: null,
			/*
			 * URL to submit form to. Used together with submitOnCreate and urlAuto
			 */
			actionUrl: null,
			/*
			 * Get submission url automatically by searching over DOM
			 */
			urlAuto: true
		},
		
		/*
		 * Name of the CSS class to use for displaying border of selected comments 
		 */
		SELECTED_BORDER: 'theme-border-4',

		/*
		 * Name of the CSS class to use for displaying background of selected comments 
		 */
		SELECTED_BG: 'theme-bg-color-4',

		/*
		 * Creates workflows discussions control and performs initialization
		 */
		onReady: function()
		{
		},
		
		onWorkflowDetailedData: function(layer, args)
		{
			// Skip duplicate events. No idea what causes them. Fix CUST-130
			if(args[1] instanceof Array)
				return;
			this.workflow = args[1];
			this.thread = '';
			this.initUI();
		},
		
		initUI: function()
		{
			// get ui elements
			this.textArea = YAHOO.util.Dom.get(this.id+'-discussion-textArea');
			this.spinnerAnim = YAHOO.util.Dom.get(this.id+'-discussion-spinnerAnim');
			this.discussionsContainer = YAHOO.util.Dom.get(this.id+'-discussion-container');
			
			// create comment button
			this.addCommentButton = new YAHOO.widget.Button(this.id + '-discussion-addCommentButton');
			this.addCommentButton.set('disabled', true);
			// subscribe to events 
			this.addCommentButton.on('click', this.onAddCommentClicked, null, this);
			YAHOO.util.Event.addListener(this.textArea, 'input', this.handleTextAreaInput, null, this);

			this.getDiscussionThread( this.updateDiscussion );
		},
		
		/*
		 * Changes availability of «add comment» button depending on current comment text length
		 */
		handleTextAreaInput: function(){
			this.addCommentButton.set('disabled', this.textArea.value.length === 0);
		},
		
		/*
		 * Displays popup dialog with error message
		 */
		showErrorMessage: function(_, obj)
		{
			// show popup dialog with error message for 5 seconds
			Alfresco.util.PopupManager.displayMessage({
				text: obj,
				displayTime: 5
			});
		},
		
		/*
		 * Callback to run when «add comment» button is clicked. Creates new
		 * topic or uses existent one to add new comment.
		 */
		onAddCommentClicked: function()
		{
			// check if comment is empty
			if (this.textArea.value === '')
				return;
			// show spinner
			this.spinnerAnim.style.display='inline';
			// disable input controls
			this.textArea.disabled = 'disabled';
			this.addCommentButton.set('disabled', true);
			// post comment
			this.addComment();	
		},
		
		/*
		 * Creates new discussion thread. Called when first discussion comment
		 * is posted.
		 */
		getDiscussionThread: function(clb)
		{
			if( !this.workflow.id || this.workflow.id === undefined )
				return;
			Alfresco.util.Ajax.jsonGet(
				{
					url: Alfresco.constants.PROXY_URI + 
							"api/alvex/workflow/" + this.workflow.id + "/discussions",
					successCallback: {
						fn: function (response)
						{
							if( response.json.data.length > 0 )
							{
								this.thread = response.json.data[0].discussion.nodeRef;
								clb.call(this);
							}
							else
							{
								this.createDiscussionThread(clb);
							}
						},
						scope: this
					}
				});
		},
		
		createDiscussionThread: function(clb)
		{
			Alvex.util.processAjaxQueue({
				queue: [
					{
						url: Alfresco.constants.PROXY_URI+'api/alvex/wfdiscussions/storage',
				        responseContentType: Alfresco.util.Ajax.JSON,
						successCallback: {
							fn: function (response)
							{
								// build url for the next query
								var url = YAHOO.lang.substitute(
									'{proxy}/api/forum/node/{protocol}/{storeId}/{nodeId}/posts',
									{
										proxy: Alfresco.constants.PROXY_URI,
										protocol: response.json.container.protocol,
										storeId: response.json.container.storeId,
										nodeId: response.json.container.nodeId
									}
								);
								response.config.config.queue[1].url = url;
							},
							scope: this
						},
						failureCallback: {
							fn: this.showErrorMessage,
							obj: this.msg('alvex.discussions.error.storage'),
							scope: this
						}
					},
					{
						url: null,
				        responseContentType: Alfresco.util.Ajax.JSON,
						requestContentType: Alfresco.util.Ajax.JSON,
						method: Alfresco.util.Ajax.POST,
						dataObj:
						{
							title: '',
							content: ''
						},
						successCallback: {
							fn: function (response)
							{
								// update thread nodeRef
								this.thread = response.json.item.nodeRef;
								var url = YAHOO.lang.substitute(
									'{proxy}/api/alvex/workflow/{workflowId}/discussions',
									{
										proxy: Alfresco.constants.PROXY_URI,
										workflowId: this.workflow.id
									}
								);
								response.config.config.queue[1].url = url;
								var nodeInfo = this.thread.match(new RegExp('(.*)://(.*)/(.*)'));
								var nodeId = nodeInfo[1] + '#' + nodeInfo[2] + '#' + nodeInfo[3];
								response.config.config.queue[1].dataObj.data.discussions = nodeId;
							},
							scope: this
						},
						failureCallback: {
							fn: this.showErrorMessage,
							obj: this.msg('alvex.discussions.error.thread'),
							scope: this
						}
					},
					{
						url: null,
				        responseContentType: Alfresco.util.Ajax.JSON,
						requestContentType: Alfresco.util.Ajax.JSON,
						method: Alfresco.util.Ajax.PUT,
						dataObj:
						{
							data: {
								discussions: ''
							}
						},
						successCallback: {
							fn: function (response)
							{
								
							},
							scope: this
						},
						failureCallback: {
							fn: this.showErrorMessage,
							obj: this.msg('alvex.discussions.error.relation'),
							scope: this
						}
					}
				],
				doneCallback:
				{
					fn: clb,
					scope: this
				}
			});	
		},
		
		/*
		 * Submits new comment to discussion.
		 */ 
		addComment: function()
		{
			// built url to submit data to
			var nodeRef = ( this.selectedComment && this.selectedComment !== null ) ? this.selectedComment.name : this.thread;
			if (nodeRef === '')
			{
				return;
			}
			var nodeInfo = nodeRef.match(new RegExp('(.*)://(.*)/(.*)'));
			var url = YAHOO.lang.substitute(
				'{proxy}/api/forum/post/node/{protocol}/{storeId}/{nodeId}/replies',
				{
					proxy: Alfresco.constants.PROXY_URI, 
					protocol: nodeInfo[1],
					storeId: nodeInfo[2],
					nodeId: nodeInfo[3]	
				}
			);
			// post new comment by invoking Alfresco API
			Alfresco.util.Ajax.jsonRequest({
				method: Alfresco.util.Ajax.POST,
				url: url,
				dataObj:
				{
					content: this.textArea.value
				},
				successCallback:
				{
					fn: function()
					{
						// hide spinner
						this.spinnerAnim.style.display='none';
						// clear text area
						this.textArea.value = '';
						// enable input controls
						this.textArea.disabled = '';
						this.updateDiscussion();
					},
					scope: this
				},
				failureCallback:
				{
					fn: this.showErrorMessage,
					obj: this.msg('alvex.discussions.error.comment'),
					scope:this
				},
				scope: this
			});
		},
		
		/*
		 * Fetches discussion thread.
		 */
		updateDiscussion: function()
		{
			// check if updating is already running
			if (this.isUpdating)
				return;				
			this.isUpdating = true;
			// show popup window while we're loading thread
			if (!this.collapsed)
			{
				this.popupMessage = Alfresco.util.PopupManager.displayMessage({
					text: this.msg('alvex.discussions.updating'),
					displayTime: 0,
					spanClass: 'wait'
				});
				// do not place popup dialog at the center of screen
				// move it right over discussions container
				var region = YAHOO.util.Dom.getRegion(this.discussionsContainer);
				var region2 = YAHOO.util.Dom.getRegion(this.popupMessage.body);
				this.popupMessage.moveTo(
					(region.left+region.right)/2-(region2.right-region2.left)/2,
					(region.top+region.bottom)/2-(region2.bottom-region2.top)/2
				);
			}
			// check if discussion already exists
			if (this.thread === '')
			{
				// thread is empty, nothing to load
				this.onDiscussionUpdated();
				return;
			}
			var nodeInfo = this.thread.match(new RegExp('(.*)://(.*)/(.*)'));
			var url = YAHOO.lang.substitute(
				'{proxy}/api/forum/post/node/{protocol}/{storeId}/{nodeId}/replies',
				{
					proxy: Alfresco.constants.PROXY_URI, 
					protocol: nodeInfo[1],
					storeId: nodeInfo[2],
					nodeId: nodeInfo[3]	
				}
			);

			Alvex.util.processAjaxQueue({
				queue: [
					{
						url: url,
				        responseContentType: Alfresco.util.Ajax.JSON,
						successCallback: {
							fn: this.processReplyResponse,
							obj: this.discussionsContainer,
							scope: this
						},
						failureCallback: {
							fn: this.showErrorMessage,
							obj: this.msg('alvex.discussions.error.update'),
							scope: this
						}
					}
				],
				doneCallback: {
					fn: this.onDiscussionUpdated,
					scope: this
				}
			});		
		},
		
		/*
		 * Processes request received from server during discussion update
		 */
		processReplyResponse: function (param, obj)
		{
			for (var i = 0; i < param.json.items.length; i++)
			{
				// get item
				var item = param.json.items[i];
				// try to get node in DOM representing item 
				var commentDiv = YAHOO.util.Dom.get(this.id+'-'+item.name);
				if (!commentDiv)
				{
					// node does not exist, create it
					// TODO check for cross-browser safety
					commentDiv = document.createElement('div');
					var contentDiv = document.createElement('div');
					commentDiv.id = this.id+'-'+item.name;
					contentDiv.name = item.nodeRef;
					var picDiv = document.createElement('div');
					var img = document.createElement('img');
					img.setAttribute(
						'src',
						YAHOO.lang.substitute(
							'{proxy}/slingshot/profile/avatar/{username}',
							{
								proxy: Alfresco.constants.PROXY_URI,
								username: item.author.username
							}
						)
					);
					var publishedDiv = document.createElement('div');
					var textDiv = document.createElement('div');
					
					publishedDiv.textContent = item.author.firstName+' '+item.author.lastName+' '
							+Alfresco.util.formatDate(item.createdOn);
					// TODO add correct replacement code below
					textDiv.innerHTML = '<p>'+item.content.replace(/\n/g, '</p><p>')+'</p>';
					
					YAHOO.util.Dom.addClass(commentDiv, 'comment');
					YAHOO.util.Dom.addClass(picDiv, 'author');
					YAHOO.util.Dom.addClass(publishedDiv, 'published');
					YAHOO.util.Dom.addClass(contentDiv, 'content');
					YAHOO.util.Dom.addClass(textDiv, 'text');
					
					picDiv.appendChild(img);
					contentDiv.appendChild(picDiv);
					contentDiv.appendChild(publishedDiv);
					contentDiv.appendChild(textDiv);
					commentDiv.appendChild(contentDiv);
					obj.insertBefore(commentDiv, obj.firstChild);
					
					// subscribe to events
					YAHOO.util.Event.addListener(contentDiv, 'mouseover', this.highlightComment, contentDiv, this);
					YAHOO.util.Event.addListener(contentDiv, 'mouseout', this.unhighlightComment, contentDiv, this);
					YAHOO.util.Event.addListener(contentDiv, 'click', this.selectComment, contentDiv, this);
				}
				if (item.replyCount > 0)
					param.config.config.queue.push({
						url: Alfresco.constants.PROXY_URI+'/api/'+item.repliesUrl,
				        responseContentType: Alfresco.util.Ajax.JSON,
						successCallback: {
							fn: this.processReplyResponse,
							obj: commentDiv,
							scope: this
						},
						failureCallback: {
							fn: this.showErrorMessage,
							obj: this.msg('alvex.discussions.error.update'),
							scope: this
						}
					});
			}
		},
		
		/*
		 * Highlights current comment
		 */
		highlightComment: function (_, obj)
		{
			if (!YAHOO.util.Dom.hasClass(obj, this.SELECTED_BORDER))
				YAHOO.util.Dom.addClass(obj, this.SELECTED_BG);
		},
		
		/*
		 * Removes selection from comment under mouse
		 */
		unhighlightComment: function (_, obj)
		{
			if (!YAHOO.util.Dom.hasClass(obj, this.SELECTED_BORDER))
				YAHOO.util.Dom.removeClass(obj, this.SELECTED_BG);
		},
		
		/*
		 * Selects comment
		 */
		selectComment: function (_, obj)
		{
			if (!YAHOO.util.Dom.hasClass(obj, this.SELECTED_BORDER))
			{
				if (obj !== this.selectedComment)
				{
					YAHOO.util.Dom.removeClass(this.selectedComment, this.SELECTED_BORDER);
					this.unhighlightComment(null, this.selectedComment);
				}
				YAHOO.util.Dom.addClass(obj, this.SELECTED_BORDER);
				this.selectedComment = obj;
			}
			else
			{
				YAHOO.util.Dom.removeClass(obj, this.SELECTED_BORDER);
				this.selectedComment = null;
			}
		},
		
		/*
		 * Function to call when discussion is updated
		 */
		onDiscussionUpdated: function()
		{
			// hide popup message
			if (this.popupMessage)
			{
				this.popupMessage.hide();
				this.popupMessage = null;
			}
			// change updating state
			this.isUpdating = false;
		}
		
	});
})();