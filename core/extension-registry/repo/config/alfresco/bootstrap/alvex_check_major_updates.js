var id = extensionRegistry.getSystemId().replace('noderef:','');
var versions = {};
var req = '';
for each(extension in extensionRegistry.getInstalledExtensions())
	versions[extension.getVersion()+extension.getEdition()] = true;
for(var v in versions)
	req += v + '+';
req = req.slice(0,-1);

var url = "http://www.alvexcore.com/service/check-major-updates.php?id=" + id + "&ver=" + req;
var connector = remoteService.connect("http");
var resp = connector.call(url);