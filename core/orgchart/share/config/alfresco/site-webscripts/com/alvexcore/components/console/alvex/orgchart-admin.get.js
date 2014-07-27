<import resource="classpath:alfresco/web-extension/js/alvex-config.lib.js">

var uiConfig = Alvex.configs.getConfig('orgchart', 'ui-config');
var syncConfig = Alvex.configs.getConfig('orgchart', 'sync-config');

model.config = {
	defaultRoleName: uiConfig.props['alvexoc:defaultRoleName'] ? uiConfig.props['alvexoc:defaultRoleName'] : '',
	uiConfigNodeRef: uiConfig.nodeRef,
	syncConfigNodeRef: syncConfig.nodeRef,
	syncSource: syncConfig.props['alvexoc:syncSource']
}

var conn = remote.connect("alfresco");
var resp = eval('(' + conn.get("/api/alvex/server") + ')');

model.alvexVersion = resp.version;
model.alvexEdition = resp.edition;
model.alvexCodename = resp.codename;