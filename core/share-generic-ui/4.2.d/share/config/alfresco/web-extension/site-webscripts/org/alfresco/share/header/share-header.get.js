<import resource="classpath:alfresco/web-extension/site-webscripts/org/alfresco/share/header/share-header.lib.js">

model.jsonModel = {
   rootNodeId: "share-header",
   services: getHeaderServices(),
   widgets: [
      {
         id: "SHARE_VERTICAL_LAYOUT",
         name: "alfresco/layout/VerticalWidgets",
         config: 
         {
            widgets: getHeaderModel()
         }
      }
   ]
};
