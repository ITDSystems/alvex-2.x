var createEvent = function(caseId, workflowId)
{
	var store = companyhome.childrenByXPath('/sys:system/sys:alvex/alvex:data/alvex:case-management')[0];
	var wi = workflowHelper.getWorkflowInstance(workflowId)[0];
	if( !wi.dueDate || wi.dueDate === null )
		return;
	var event = calendarHelper.createEvent(caseId, wi.description, utils.toISO8601(wi.dueDate));
	var eventId = event.nodeRef.id;
	var eventFolder = getFolder(store, eventId);
	var strRef = event.nodeRef.toString().replace("://","#").replace("/","#");
	
	var workflowFolder = getFolder(store, workflowId);
	var relNode = workflowFolder.createNode(null, 'alvexcm:workflowRelation', 
		{
			'alvexcm:workflowInstance': workflowId, 
			'alvexcm:relationType': 'workflow-deadline-event-' + caseId, 
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

var relationExists = function(folder, caseId, workflowId)
{
	var found = false;
	for each(var node in folder.children)
		if( node.properties['alvexcm:relationType'] === 'case-workflows' 
				&& node.properties['alvexcm:workflowInstance'] === workflowId.split('$').join('$') 
				&& node.properties['alvexcm:relatedObject'] === caseId )
		{
			found = true;
			break;
		}
	return found;
}

var pushWorkflowsForCase = function( caseId, workflows )
{
	var store = companyhome.childrenByXPath('/sys:system/sys:alvex/alvex:data/alvex:case-management')[0];
	var caseFolder = getFolder(store, caseId);
	if( !caseFolder || caseFolder === null )
		return;
	for each (var workflowId in workflows)
	{
		if( relationExists(caseFolder, caseId, workflowId) )
			continue;
		createEvent(caseId, workflowId);
		var relNode = caseFolder.createNode(null, 'alvexcm:workflowRelation', 
				{
					'alvexcm:workflowInstance': workflowId, 
					'alvexcm:relationType': 'case-workflows', 
					'alvexcm:relatedObject': caseId
				}, 
				'sys:children' );
		var workflowFolder = getFolder(store, workflowId);
		workflowFolder.createAssociation(relNode, 'sys:children');
	}
};

var pushCasesForWorkflow = function( workflowId, cases )
{
	var store = companyhome.childrenByXPath('/sys:system/sys:alvex/alvex:data/alvex:case-management')[0];
	var workflowFolder = getFolder(store, workflowId);
	if( !workflowFolder || workflowFolder === null )
		return;
	for each (var caseId in cases)
	{
		if( relationExists(caseFolder, caseId, workflowId) )
			continue;
		createEvent(caseId, workflowId);
		var relNode = workflowFolder.createNode(null, 'alvexcm:workflowRelation', 
				{
					'alvexcm:workflowInstance': workflowId, 
					'alvexcm:relationType': 'case-workflows', 
					'alvexcm:relatedObject': caseId
				}, 
				'sys:children' );
		var caseFolder = getFolder(store, caseId);
		caseFolder.createAssociation(relNode, 'sys:children');
	}
};

(function() {
	var caseId = decodeURIComponent(url.templateArgs['caseId']);
	var workflowId = decodeURIComponent(url.templateArgs['workflowId']);
	try {
		if( caseId && caseId !== null && caseId !== 'null' 
				&& json.get('data').has('workflows') )
		{
			var workflows = json.get('data').get('workflows').split(',');
			pushWorkflowsForCase( caseId, workflows );
		}
		else if( workflowId && workflowId !== null && workflowId !== 'null'
				&& json.get('data').has('cases') )
		{
			var cases = json.get('data').get('cases').split(',');
			pushCasesForWorkflow( workflowId, cases );
		}
		status.code = 200;
	} catch (e) {
		status.code = 500;
		status.message = e.message;
		model.message = e.message;
	}
})();