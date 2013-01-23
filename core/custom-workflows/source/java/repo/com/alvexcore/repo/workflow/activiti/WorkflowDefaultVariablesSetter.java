package com.alvexcore.repo.workflow.activiti;

import org.activiti.engine.delegate.DelegateExecution;
import org.activiti.engine.delegate.ExecutionListener;

public class WorkflowDefaultVariablesSetter extends AlvexActivitiListener implements ExecutionListener {
	
	final public static String VARIABLE_SEND_EMAIL_NOTIFICATIONS = "bpm_sendEMailNotifications";

	@Override
	public void notify(DelegateExecution execution) throws Exception {
		execution.setVariable(VARIABLE_SEND_EMAIL_NOTIFICATIONS, true);
	}

}
