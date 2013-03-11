connector = remote.connect('alfresco');

model.config = eval('('+connector.get('/api/alvex/config/orgchart/cm:orgchart-view.default')+')');