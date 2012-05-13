<import resource="classpath:alfresco/templates/orgstruct.lib.js">

(function(){
	if (!(json.has('id') && json.has('name')))
	{
		model.code = 500;
		model.message = 'Mandatory fields were not provided.';
		return;
	}
	
	// get parent group
	var parentGroupId = json.has('parent') ?
                        json.get('parent') :
                        null;

	try {
		OrgStruct.addGroup(json.get('id'), json.get('name'), parentGroupId);	
		model.code = 200;
	} catch(e) {
		model.code = 500;
		model.message = e.message;
	}
})();
