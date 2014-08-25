model.columns = [];

model.columns.push({
	"renderer": "Alvex.DatagridTaskPrioRenderer",
	"showByDefault": true,
	"type": "property",
	"name": "bpm:priority",
	"labelid": "column.title.bpm_priority",
	"width": 75,
	"dataType": "text"
});

model.columns.push({
	"renderer": "Alvex.DatagridTaskStateRenderer",
	"showByDefault": false,
	"type": "prop",
	"name": "state",
	"labelid": "column.title.state",
	"width": 75,
	"dataType": "ghost"
});

model.columns.push({
	"renderer": "Alvex.DatagridTaskDescRenderer",
	"showByDefault": true,
	"type": "property",
	"name": "bpm:description",
	"labelid": "column.title.bpm_description",
	"width": 0,
	"dataType": "text"
});

model.columns.push({
	"renderer": "",
	"showByDefault": false,
	"type": "property",
	"name": "bpm:status",
	"labelid": "column.title.bpm_status",
	"width": 100,
	"dataType": "text"
});

model.columns.push({
	"renderer": "",
	"showByDefault": false,
	"type": "property",
	"name": "bpm:startDate",
	"labelid": "column.title.bpm_startDate",
	"width": 150,
	"dataType": "date"
});

model.columns.push({
	"renderer": "",
	"showByDefault": true,
	"type": "property",
	"name": "bpm:dueDate",
	"labelid": "column.title.bpm_dueDate",
	"width": 150,
	"dataType": "date"
});

model.columns.push({
	"renderer": "",
	"showByDefault": false,
	"type": "property",
	"name": "bpm:completionDate",
	"labelid": "column.title.bpm_completionDate",
	"width": 150,
	"dataType": "date"
});

model.columns.push({
	"renderer": "",
	"showByDefault": true,
	"type": "property",
	"name": "taskTitle",
	"labelid": "column.title.taskType",
	"width": 150,
	"dataType": "ghost"
});

model.columns.push({
	"renderer": "",
	"showByDefault": false,
	"type": "property",
	"name": "workflowTitle",
	"labelid": "column.title.wflType",
	"width": 150,
	"dataType": "ghost"
});

model.columns.push({
	"renderer": "",
	"showByDefault": false,
	"type": "assoc",
	"name": "owner",
	"labelid": "column.title.owner",
	"width": 200,
	"dataType": "cm:person"
});

model.columns.push({
	"renderer": "",
	"showByDefault": true,
	"type": "assoc",
	"name": "initiator",
	"labelid": "column.title.initiator",
	"width": 200,
	"dataType": "cm:person"
});