<import resource="classpath:/alfresco/templates/org/alfresco/import/alfresco-util.js">

var documentDetails = AlfrescoUtil.getNodeDetails(model.nodeRef, model.site);
if( !documentDetails.item.node.contentURL )
	model.allowNewVersionUpload = false;