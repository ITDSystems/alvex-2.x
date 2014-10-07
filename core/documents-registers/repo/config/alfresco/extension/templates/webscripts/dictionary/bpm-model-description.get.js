(function() {
	try {
		model.type = {};
		model.type.type = "bpm";
		model.type.title = "bpm";
		model.type.fields = [];
		model.type.assocs = [];
		
		model.type.fields.push({
			"name": "bpm:priority",
			"allowedValues": [
				{
					"value": "1",
					"label": "Low"
				},
				{
					"value": "2",
					"label": "Medium"
				},
				{
					"value": "3",
					"label": "High"
				}
			],
			"title": ""
		});

		model.type.fields.push({
			"name": "state",
			"title": ""
		});

		model.type.fields.push({
			"name": "bpm:description",
			"title": ""
		});

		model.type.fields.push({
			"name": "bpm:status",
			"allowedValues": [
				{
					"value": "Not Yet Started",
					"label": "Not Yet Started"
				},
				{
					"value": "In Progress",
					"label": "In Progress"
				},
				{
					"value": "Completed",
					"label": "Completed"
				}
			],
			"title": ""
		});

		model.type.fields.push({
			"name": "bpm:startDate",
			"title": ""
		});

		model.type.fields.push({
			"name": "bpm:dueDate",
			"title": ""
		});

		model.type.fields.push({
			"name": "bpm:completionDate",
			"title": ""
		});

		model.type.fields.push({
			"name": "taskTitle",
			"title": ""
		});

		model.type.fields.push({
			"name": "workflowTitle",
			"title": ""
		});

		model.type.fields.push({
			"name": "owner",
			"title": ""
		});

		model.type.fields.push({
			"name": "initiator",
			"title": ""
		});
		
		status.code = 200;
	} catch (e) {
		status.code = 500;
		status.message = e.message;
		model.message = e.message;
	}
})();