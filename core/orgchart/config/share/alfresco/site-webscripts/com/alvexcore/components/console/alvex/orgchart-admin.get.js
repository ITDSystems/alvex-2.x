connector = remote.connect('alfresco');
var uiConfig = eval('('+connector.get('/api/alvex/orgchart/ui-config')+')');
var syncConfig = eval('('+connector.get('/api/alvex/orgchart/sync-config')+')');

model.config = {};
model.config.defaultRoleName = uiConfig.config.defaultRoleName;
model.config.uiConfigNodeRef = uiConfig.config.configNodeRef;
model.config.syncConfigNodeRef = syncConfig.config.configNodeRef;
model.config.syncSource = syncConfig.config.syncSource;
