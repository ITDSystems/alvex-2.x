function sortByTitle(list1, list2)
{
   return (list1.title > list2.title) ? 1 : (list1.title < list2.title) ? -1 : 0;
}

function main()
{
   var site = page.url.templateArgs.site,
      theUrl = "/slingshot/datalists/lists/site/" + site + "/dataLists?page=1&pageSize=512",
      result = remote.call(theUrl),
      canCreate = false,
      lists = [];
   
   if (result.status == 200)
   {
      response = eval('(' + result.response + ')');
      lists = response.datalists;
      lists.sort(sortByTitle);
      canCreate = response.permissions.create;
   }

   model.lists = lists;
   model.canCreate = canCreate;
}

main();
