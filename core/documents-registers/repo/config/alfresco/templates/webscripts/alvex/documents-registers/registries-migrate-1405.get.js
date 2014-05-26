var nodes = search.luceneSearch("TYPE:\"alvexdr:documentRegister\"");


for each(var node in nodes) {
 
	// Processing nodes
	for each(var entry in node.children) {

		logger.log( "Node: " + entry.properties["alvexdt:id"] + " (" + entry.typeShort + ")");

		// Look at "Related Documents" assocs
		for each(var i in entry.childAssocs["alvexdt:relatedDocuments"]) {
      
			logger.log("Docs assoc: " + i.properties["alvexdt:id"] + " (" + i.typeShort + ") " + i.nodeRef);
      
			// Set the flag that such assoc is not exist in "linked documents" (new assoc)
			var flag=0;
      
			// search for all "linked documents" assocs to check if exists
			for each(var linked in entry.assocs["alvexdt:linkedDocuments"])
        
				// check
				if ( i.nodeRef.toString().equals( linked.nodeRef.toString() ) ) { 
					flag=1;
				}
      
			//if not exist, then create
			if ( flag == 0 ) {
				entry.createAssociation(i, "alvexdt:linkedDocuments");
				logger.log("assoc created: " + i.properties["alvexdt:id"] + " " + i.typeShort + ") ");
			}

			// remove old (related documents) assocs, doesn't work :(
			entry.removeNode(i);
			logger.log("assoc deleted: " + i.properties["alvexdt:id"] + " " + i.typeShort + ") ");
		}
    
    
    
		// repeat the same with "related Received" and "related Sent"
		for each(i in entry.childAssocs["alvexdt:relatedReceived"]) {
			logger.log("Docs assoc: " + i.properties["alvexdt:id"] + " (" + i.typeShort + ") " + i.nodeRef);
			flag=0;
			for each(linked in entry.assocs["alvexdt:linkedDocuments"]) {
				if ( i.nodeRef.toString().equals( linked.nodeRef.toString() ) ) { 
					flag=1;
				}
			}
			if ( flag == 0 ) {
				entry.createAssociation(i, "alvexdt:linkedDocuments");
				logger.log("assoc created: " + i.properties["alvexdt:id"] + " " + i.typeShort + ") ");
			}
			entry.removeNode(i);
			logger.log("assoc deleted: " + i.properties["alvexdt:id"] + " " + i.typeShort + ") ");
		}
		for each(i in entry.childAssocs["alvexdt:relatedSent"]) {
			logger.log("Docs assoc: " + i.properties["alvexdt:id"] + " (" + i.typeShort + ") " + i.nodeRef);
			flag=0;
			for each(linked in entry.assocs["alvexdt:linkedDocuments"]) {
				if ( i.nodeRef.toString().equals( linked.nodeRef.toString() ) ) { 
					flag=1;
				}
			}
			if ( flag == 0 ) {
				entry.createAssociation(i, "alvexdt:linkedDocuments");
				logger.log("assoc created: " + i.properties["alvexdt:id"] + " " + i.typeShort + ") ");
			}
			entry.removeNode(i);
			logger.log("assoc deleted: " + i.properties["alvexdt:id"] + " " + i.typeShort + ") ");
		}
	}
}

