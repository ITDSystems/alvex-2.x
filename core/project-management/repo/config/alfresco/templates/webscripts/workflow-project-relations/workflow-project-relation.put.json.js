var createEvent = function(projectId, workflowId)
{
	var store = companyhome.childrenByXPath('/sys:system/sys:alvex/alvex:data/alvex:project-management')[0];
	var wi = workflowHelper.getWorkflowInstance(workflowId)[0];
	if( !wi.dueDate || wi.dueDate === null )
		return;
	var event = calendarHelper.createEvent(projectId, wi.description, utils.toISO8601(wi.dueDate));
	var eventId = event.nodeRef.id;
	var eventFolder = getFolder(store, eventId);
	var strRef = event.nodeRef.toString().replace("://","#").replace("/","#");
	
	var workflowFolder = getFolder(store, workflowId);
	var relNode = workflowFolder.createNode(null, 'alvexcm:workflowRelation', 
		{
			'alvexcm:workflowInstance': workflowId, 
			'alvexcm:relationType': 'workflow-deadline-event-' + projectId, 
			'alvexcm:relatedObject': strRef
		}, 
		'sys:children' );
	eventFolder.createAssociation(relNode, 'sys:children');
}

var getFolder = function(store, name)
{
	var folder;
	if( (folder = store.childByNamePath(name)) === null )
		folder = store.createNode(name, 'sys:container', 'sys:children');
	return folder;
}

var relationExists = function(folder, projectId, workflowId)
{
	var found = false;
	for each(var node in folder.children)
		if( node.properties['alvexcm:relationType'] === 'project-workflows' 
				&& node.properties['alvexcm:workflowInstance'] === workflowId.split('$').join('$') 
				&& node.properties['alvexcm:relatedObject'] === projectId )
		{
			found = true;
			break;
		}
	return found;
}

var pushWorkflowsForProject = function( projectId, workflows )
{
	var store = companyhome.childrenByXPath('/sys:system/sys:alvex/alvex:data/alvex:project-management')[0];
	var projectFolder = getFolder(store, projectId);
	if( !projectFolder || projectFolder === null )
		return;
	for each (var workflowId in workflows)
	{
		if( relationExists(projectFolder, projectId, workflowId) )
			continue;
		createEvent(projectId, workflowId);
		var relNode = projectFolder.createNode(null, 'alvexcm:workflowRelation', 
				{
					'alvexcm:workflowInstance': workflowId, 
					'alvexcm:relationType': 'project-workflows', 
					'alvexcm:relatedObject': projectId
				}, 
				'sys:children' );
		var workflowFolder = getFolder(store, workflowId);
		workflowFolder.createAssociation(relNode, 'sys:children');
	}
};

var pushProjectsForWorkflow = function( workflowId, projects )
{
	var store = companyhome.childrenByXPath('/sys:system/sys:alvex/alvex:data/alvex:project-management')[0];
	var workflowFolder = getFolder(store, workflowId);
	if( !workflowFolder || workflowFolder === null )
		return;
	for each (var projectId in projects)
	{
		if( relationExists(projectFolder, projectId, workflowId) )
			continue;
		createEvent(projectId, workflowId);
		var relNode = workflowFolder.createNode(null, 'alvexcm:workflowRelation', 
				{
					'alvexcm:workflowInstance': workflowId, 
					'alvexcm:relationType': 'project-workflows', 
					'alvexcm:relatedObject': projectId
				}, 
				'sys:children' );
		var projectFolder = getFolder(store, projectId);
		projectFolder.createAssociation(relNode, 'sys:children');
	}
};

(function() {
	var projectId = decodeURIComponent(url.templateArgs['projectId']);
	var workflowId = decodeURIComponent(url.templateArgs['workflowId']);
	try {
		if( projectId && projectId !== null && projectId !== 'null' 
				&& json.get('data').has('workflows') )
		{
			var workflows = json.get('data').get('workflows').split(',');
			pushWorkflowsForProject( projectId, workflows );
		}
		else if( workflowId && workflowId !== null && workflowId !== 'null'
				&& json.get('data').has('projects') )
		{
			var projects = json.get('data').get('projects').split(',');
			pushProjectsForWorkflow( workflowId, projects );
		}
		status.code = 200;
	} catch (e) {
		status.code = 500;
		status.message = e.message;
		model.message = e.message;
	}
})();