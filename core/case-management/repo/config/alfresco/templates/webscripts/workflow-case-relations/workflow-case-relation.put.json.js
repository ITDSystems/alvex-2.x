var pushWorkflowsForCase = function( caseId, workflows )
{
	var store = companyhome.childrenByXPath('/sys:system/sys:alvex/alvex:data/alvex:case-management')[0];
	for each (var workflowId in workflows)
	{
		store.createNode(caseId+'-'+workflowId, 'alvexcm:workflowRelation', 
				{
					'alvexcm:workflowInstance': workflowId, 
					'alvexcm:relationType': 'case', 
					'alvexcm:relatedObject': caseId
				}, 
				'sys:children' );
	}
};

var pushCasesForWorkflow = function( workflowId, cases )
{
	var store = companyhome.childrenByXPath('/sys:system/sys:alvex/alvex:data/alvex:case-management')[0];
	for each (var caseId in cases)
	{
		store.createNode(caseId+'-'+workflowId, 'alvexcm:workflowRelation', 
				{
					'alvexcm:workflowInstance': workflowId, 
					'alvexcm:relationType': 'case', 
					'alvexcm:relatedObject': caseId
				}, 
				'sys:children' );
	}
};

(function() {
	var caseId = decodeURIComponent(url.templateArgs['caseId']);
	var workflowId = decodeURIComponent(url.templateArgs['workflowId']);
	try {
		if( caseId && json.get('data').has('workflows') )
		{
			var workflows = json.get('data').get('workflows').split(',');
			pushWorkflowsForCase( caseId, workflows );
		}
		else if( workflowId && json.get('data').has('cases') )
		{
			var cases = json.get('data').get('cases').split(',');
			pushWorkflowsForCase( workflowId, cases );
		}
		status.code = 200;
	} catch (e) {
		status.code = 500;
		status.message = e.message;
		model.message = e.message;
	}
})();