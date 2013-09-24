var getFolder = function(store, name)
{
	var folder;
	if( (folder = store.childByNamePath(name)) === null )
		folder = store.createNode(name, 'sys:container', 'sys:children');
	return folder;
}

var relationExists = function(folder, srcWfId, targetWfId)
{
	var found = false;
	for each(var node in folder.children)
		if( node.properties['alvexcm:relationType'] === 'related-workflow' 
				&& node.properties['alvexcm:workflowInstance'] === srcWfId.split('$').join('$') 
				&& node.properties['alvexcm:relatedObject'] === targetWfId.split('$').join('$') )
		{
			found = true;
			break;
		}
	return found;
}

var pushRelatedWorkflows = function( srcWfId, workflows )
{
	var store = companyhome.childrenByXPath('/sys:system/sys:alvex/alvex:data/alvex:advanced-workflows')[0];
	var workflowFolder = getFolder(store, srcWfId);
	if( !workflowFolder || workflowFolder === null )
		return;
	for each (var targetWfId in workflows)
	{
		if( relationExists(workflowFolder, srcWfId, targetWfId) )
			continue;
		var relNode = workflowFolder.createNode(null, 'alvexcm:workflowRelation', 
				{
					'alvexcm:workflowInstance': srcWfId, 
					'alvexcm:relationType': 'related-workflow', 
					'alvexcm:relatedObject': targetWfId
				}, 
				'sys:children' );
		var otherFolder = getFolder(store, targetWfId);
		otherFolder.createAssociation(relNode, 'sys:children');
	}
};

(function() {
	var srcWfId = decodeURIComponent(url.templateArgs['srcWfId']);
	try {
		if( srcWfId && srcWfId !== null && srcWfId !== 'null' 
				&& json.get('data').has('workflows') )
		{
			var workflows = json.get('data').get('workflows').split(',');
			pushRelatedWorkflows( srcWfId, workflows );
		}
		status.code = 200;
	} catch (e) {
		status.code = 500;
		status.message = e.message;
		model.message = e.message;
	}
})();