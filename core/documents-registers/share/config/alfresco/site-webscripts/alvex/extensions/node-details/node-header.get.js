<import resource="classpath:/alfresco/templates/org/alfresco/import/alfresco-util.js">

var documentDetails = AlfrescoUtil.getNodeDetails(model.nodeRef, model.site, null, model.libraryRoot)
if( !documentDetails.item.node.contentURL )
	model.showQuickShare = "false";