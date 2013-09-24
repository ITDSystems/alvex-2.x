var getFolder = function(store, name)
{
	var folder;
	if( (folder = store.childByNamePath(name)) === null )
		folder = store.createNode(name, 'sys:container', 'sys:children');
	return folder;
}

var relationExists = function(folder, discussionId, workflowId)
{
	var found = false;
	for each(var node in folder.children)
		if( node.properties['alvexcm:relationType'] === 'workflow-discussion' 
				&& node.properties['alvexcm:workflowInstance'] === workflowId.split('$').join('$') 
				&& node.properties['alvexcm:relatedObject'] === discussionId )
		{
			found = true;
			break;
		}
	return found;
}

var pushWorkflowsForDiscussion = function( discussionId, workflows )
{
	var store = companyhome.childrenByXPath('/sys:system/sys:alvex/alvex:data/alvex:advanced-workflows')[0];
	var discussionFolder = getFolder(store, discussionId);
	if( !discussionFolder || discussionFolder === null )
		return;
	for each (var workflowId in workflows)
	{
		if( relationExists(discussionFolder, discussionId, workflowId) )
			continue;
		var relNode = discussionFolder.createNode(null, 'alvexcm:workflowRelation', 
				{
					'alvexcm:workflowInstance': workflowId, 
					'alvexcm:relationType': 'workflow-discussion', 
					'alvexcm:relatedObject': discussionId
				}, 
				'sys:children' );
		var workflowFolder = getFolder(store, workflowId);
		workflowFolder.createAssociation(relNode, 'sys:children');
	}
};

var pushDiscussionsForWorkflow = function( workflowId, discussions )
{
	var store = companyhome.childrenByXPath('/sys:system/sys:alvex/alvex:data/alvex:advanced-workflows')[0];
	var workflowFolder = getFolder(store, workflowId);
	if( !workflowFolder || workflowFolder === null )
		return;
	for each (var discussionId in discussions)
	{
		if( relationExists(workflowFolder, discussionId, workflowId) )
			continue;
		var relNode = workflowFolder.createNode(null, 'alvexcm:workflowRelation', 
				{
					'alvexcm:workflowInstance': workflowId, 
					'alvexcm:relationType': 'workflow-discussion', 
					'alvexcm:relatedObject': discussionId
				}, 
				'sys:children' );
		var discussionFolder = getFolder(store, discussionId);
		discussionFolder.createAssociation(relNode, 'sys:children');
	}
};

(function() {
	var discussionId = decodeURIComponent(url.templateArgs['discussionId']);
	var workflowId = decodeURIComponent(url.templateArgs['workflowId']);
	try {
		if( discussionId && discussionId !== null && discussionId !== 'null' 
				&& json.get('data').has('workflows') )
		{
			var workflows = json.get('data').get('workflows').split(',');
			pushWorkflowsForDiscussion( discussionId, workflows );
		}
		else if( workflowId && workflowId !== null && workflowId !== 'null'
				&& json.get('data').has('discussions') )
		{
			var discussions = json.get('data').get('discussions').split(',');
			pushDiscussionsForWorkflow( workflowId, discussions );
		}
		status.code = 200;
	} catch (e) {
		status.code = 500;
		status.message = e.message;
		model.message = e.message;
	}
})();