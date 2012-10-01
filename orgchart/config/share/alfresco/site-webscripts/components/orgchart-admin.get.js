connector = remote.connect('alfresco');
var uiConfig = eval('('+connector.get('/api/alvex/orgchart/ui-config')+')');

model.config = {};
model.config.defaultRoleName = uiConfig.config.defaultRoleName;
model.config.configNodeRef = uiConfig.config.configNodeRef;