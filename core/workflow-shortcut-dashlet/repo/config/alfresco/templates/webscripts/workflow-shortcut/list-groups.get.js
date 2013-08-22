var paging = utils.createPaging(-1, 0);
var list = groups.getGroupsInZone("", "APP.DEFAULT", paging, "displayName");
var gr_list = [];
gr_list.push({ shortName: "default", fullName: "default", displayName: "default" });

for each (var gr in list)
	if( (gr.shortName != "EMAIL_CONTRIBUTORS") && (gr.shortName != "ALFRESCO_ADMINISTRATORS") 
					&& (gr.shortName.indexOf("__") == -1 ) )
		gr_list.push({ shortName: gr.shortName, fullName: gr.fullName, displayName: gr.displayName });

model.groups = gr_list;
