<import resource="classpath:alfresco/web-extension/js/alvex-config.lib.js">

var uiConfig = Alvex.configs.getConfig('orgchart', 'ui-config');
var syncConfig = Alvex.configs.getConfig('orgchart', 'sync-config');

model.config = {
	defaultRoleName: uiConfig.props['alvexoc:defaultRoleName'],
	uiConfigNodeRef: uiConfig.nodeRef,
	syncConfigNodeRef: syncConfig.nodeRef,
	syncSource: syncConfig.props['alvexoc:syncSource']
}