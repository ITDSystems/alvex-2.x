<import resource="classpath:alfresco/templates/orgstruct.lib.js">

(function(){
	try {
		OrgStruct.init();
		model.code = 200;
	} catch (e) {
		model.code = 500;
		model.message = e.message;
	}
})();
