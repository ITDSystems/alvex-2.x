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
					"label": msg.get("listconstraint.bpm_allowedPriority.1")
				},
				{
					"value": "2",
					"label": msg.get("listconstraint.bpm_allowedPriority.2")
				},
				{
					"value": "3",
					"label": msg.get("listconstraint.bpm_allowedPriority.3")
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
					"label": msg.get("listconstraint.bpm_allowedStatus.Not\ Yet\ Started")
				},
				{
					"value": "In Progress",
					"label": msg.get("listconstraint.bpm_allowedStatus.In\ Progress")
				},
				{
					"value": "Completed",
					"label": msg.get("listconstraint.bpm_allowedStatus.Completed")
				},
				{
					"value": "On Hold",
					"label": msg.get("listconstraint.bpm_allowedStatus.On\ Hold")
				},
				{
					"value": "Cancelled",
					"label": msg.get("listconstraint.bpm_allowedStatus.Cancelled")
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