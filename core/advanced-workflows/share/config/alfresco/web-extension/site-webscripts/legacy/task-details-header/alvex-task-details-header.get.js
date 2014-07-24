var conn = remote.connect("alfresco");
var resp = eval('(' + conn.get("/api/alvex/license") + ')');

model.alvexVersion = resp.version;
model.alvexEdition = resp.edition;
model.alvexCodename = resp.codename;