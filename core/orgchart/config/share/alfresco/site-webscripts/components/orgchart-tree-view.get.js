connector = remote.connect('alfresco');
var uiConfig = eval('('+connector.get('/api/alvex/orgchart/ui-config')+')');
var syncConfig = eval('('+connector.get('/api/alvex/orgchart/sync-config')+')');

model.config = {};
model.config.defaultRoleName = uiConfig.config.defaultRoleName;
model.config.viewType = uiConfig.config.viewType;
model.config.showUnitsRecursively = uiConfig.config.showUnitsRecursively;
model.config.syncSource = syncConfig.config.syncSource;
