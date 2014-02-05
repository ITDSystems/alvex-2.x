(function() {
	try {
		
		var nodes = search.luceneSearch("TYPE:\"alvexdr:documentRegister\"");

		for each(var node in nodes)
		{
			// Process registries names
			var targetName = node.properties.title;
			var nameOk = true;
			do
			{
				nameOk = true;
				var concNodes = node.parent.children;
				for each(var concNode in concNodes)
				{
					if( ! concNode.nodeRef.toString().equals( node.nodeRef.toString() ) 
							&& concNode.properties.name == targetName )
					{
						targetName = "_" + targetName;
						nameOk = false;
						break;
					}
				}
			} while( !nameOk )
			node.name = targetName;

			// Process registry entries
			for each(var entry in node.children)
			{
				// Name
				entry.name = entry.properties["alvexdt:id"];
				// Files
				for each( var file in entry.assocs["alvexdt:files"] )
				{
					if( ! file.hasAspect("alvexdr:attachedToRegistryItem") )
					{
						file.addAspect("alvexdr:attachedToRegistryItem", null);
						file.createAssociation(entry, "alvexdr:parentRegister");
					}
				}
			}
		}
		
		status.code = 200;
	} catch (e) {
		status.code = 500;
		status.message = e.message;
		model.message = e.message;
	}
})();
