function main()
{
   // Call the repo to collect server meta-data
   var conn = remote.connect("alfresco");
   var res = conn.get("/api/server");
   var json = eval('(' + res + ')');
   
   // Create model and defaults
   model.serverEdition = "Unknown";
   model.serverVersion = "Unknown (Unknown)";
   model.serverSchema = "Unknown";
   
   // Check if we got a positive result
   if (json.data)
   {
      model.serverEdition = json.data.edition;
      model.serverVersion = json.data.version;
      model.serverSchema = json.data.schema;
   }

   var resp = eval('(' + conn.get("/api/alvex/license") + ')');

   model.alvexVersion = resp.version;
   model.alvexEdition = resp.edition;
   model.alvexCodename = resp.codename;

}

main();