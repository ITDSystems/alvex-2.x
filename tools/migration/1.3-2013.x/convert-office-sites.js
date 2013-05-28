// 1. Install Javascript Console from https://code.google.com/p/share-extras/wiki/JavascriptConsole
// 2. Open it from Alfresco admin page (it is under 'Tools' menu on the left)
// 3. Paste this script into console
// 4. Change here 'office' to the shortName of your office site
var siteName = 'office';
// 5. Run the script

var site = siteService.getSite( siteName );
var cont = site.getContainer( 'dataLists' );

for each( list in cont.children )
{
  for each( prop in ['alvexdr:dayInc', 'alvexdr:monthInc', 'alvexdr:quarterInc', 'alvexdr:yearInc'] )
    if( list.properties[prop] == null )
    {
      print( 'Fixing ' + prop + ' for ' + list.properties.title );
      list.properties[prop] = 1;
    }
  list.save();
}

print( 'Done' );
