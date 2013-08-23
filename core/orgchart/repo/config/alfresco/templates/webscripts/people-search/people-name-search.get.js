function createPersonResult(node)
{
   var personObject = {};
   personObject.nodeRef = "" + node.nodeRef;
   personObject.firstName = (node.properties.firstName ? node.properties.firstName : '');
   personObject.lastName = (node.properties.lastName ? node.properties.lastName : '');
   personObject.userName = node.properties.userName;
   personObject.fullName = (node.properties.lastName ? node.properties.lastName + ", " : "") 
				+ (node.properties.firstName ? node.properties.firstName : "");
   return personObject;
}

function main()
{
   var argsSearchTerm = args['searchTerm'],
      argsMaxResults = args['size'],
      results = [];
   
   try
   {
      // default to max of 100 results
      var maxResults = 100;
      if (argsMaxResults != null)
      {
         // force the argsMaxResults var to be treated as a number
         maxResults = parseInt(argsMaxResults, 10) || maxResults;
      }

      findUsers(argsSearchTerm, maxResults, results);
   }
   catch (e)
   {
      var msg = e.message;
      
      if (logger.isLoggingEnabled())
         logger.log(msg);
      
      status.setCode(500, msg);
      
      return;
   }

   model.results = results;
}

function findUsers(searchTerm, maxResults, results)
{
   var paging = utils.createPaging(maxResults, -1);
   var searchResults = groups.searchUsers(searchTerm, paging, "lastName");
   
   // create person object for each result
   for each(var user in searchResults)
   {     
      // add to results
      results.push( createPersonResult(user.person) );
   }
}

main();
