// get filter URI parameter or set it to default value
var expr = new RegExp('filter' in args ? decodeURIComponent(args['filter']) : '.*');
// retrieve all definitions
var defs = workflow.getAllDefinitions();
// sort by title and version
defs.sort(
  function(a,b)
  {
    return a.title > b.title || a.title == b.title &&
           parseInt(a.version, 10) < parseInt(b.version,10);
  });
// extract only latest version for each workflow definition
model.defs = [];
var t = [];
for each(d in defs)
  if (!(d.name in t) && (d.name.match(expr)))
  {
    model.defs.push({"name": d.name, "title": d.title});
    t[d.name] = 0;
  }
