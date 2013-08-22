<import resource="classpath:alfresco/web-extension/js/alvex-config.lib.js">

var uiConfig = Alvex.configs.getConfig('orgchart', 'ui-config');
var syncConfig = Alvex.configs.getConfig('orgchart', 'sync-config');

// should this be done automatically in some library call?
model.config = {
	defaultRoleName: uiConfig.props['alvexoc:defaultRoleName'] ? uiConfig.props['alvexoc:defaultRoleName'] : '',
	viewType: uiConfig.props['alvexoc:viewType'],
	showUnitsRecursively: uiConfig.props['alvexoc:showUnitsRecursively'],
	syncSource: syncConfig.props['alvexoc:syncSource']
};
