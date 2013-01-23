/**
 * Copyright © 2012 ITD Systems
 *
 * This file is part of Alvex
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

package com.alvexcore.repo.workflow.activiti;

import java.util.ArrayList;
import java.util.List;

import org.activiti.engine.delegate.DelegateTask;
import org.activiti.engine.delegate.ExecutionListener;
import org.activiti.engine.delegate.TaskListener;
import org.activiti.engine.impl.bpmn.behavior.UserTaskActivityBehavior;
import org.activiti.engine.impl.bpmn.deployer.BpmnDeployer;
import org.activiti.engine.impl.bpmn.parser.BpmnParseListener;
import org.activiti.engine.impl.cfg.ProcessEngineConfigurationImpl;
import org.activiti.engine.impl.persistence.entity.ProcessDefinitionEntity;
import org.activiti.engine.impl.pvm.delegate.ActivityBehavior;
import org.activiti.engine.impl.pvm.process.ActivityImpl;
import org.activiti.engine.impl.pvm.process.ScopeImpl;
import org.activiti.engine.impl.pvm.process.TransitionImpl;
import org.activiti.engine.impl.task.TaskDefinition;
import org.activiti.engine.impl.util.xml.Element;
import org.activiti.engine.impl.variable.VariableDeclaration;
import org.alfresco.error.AlfrescoRuntimeException;
import org.alfresco.repo.workflow.activiti.AlfrescoProcessEngineConfiguration;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.beans.factory.annotation.Required;

class AssignTaskListener implements TaskListener {
	List<AlvexActivitiListener> listeners1;
	List<AlvexActivitiListener> listeners2;
	List<AlvexActivitiListener> listeners3;

	public AssignTaskListener(List<AlvexActivitiListener> listeners1,
			List<AlvexActivitiListener> listeners2,
			List<AlvexActivitiListener> listeners3) {
		this.listeners1 = listeners1;
		this.listeners2 = listeners2;
		this.listeners3 = listeners3;
	}

	@Override
	public void notify(DelegateTask delegateTask) {
		for (AlvexActivitiListener listener : listeners1)
			((TaskListener) listener).notify(delegateTask);
		for (AlvexActivitiListener listener : listeners2)
			((TaskListener) listener).notify(delegateTask);
		for (AlvexActivitiListener listener : listeners3)
			((TaskListener) listener).notify(delegateTask);
	}

}

public class AlvexPreParseListener implements BpmnParseListener,
		InitializingBean {

	final static String EVENT_TASK_ASSIGN1 = "task-assign-before-change";
	final static String EVENT_TASK_ASSIGN2 = "task-assign-change";
	final static String EVENT_TASK_ASSIGN3 = "task-assign-after-change";
	final static String EVENT_TASK_CREATE = "task-create";
	final static String EVENT_TASK_DONE = "task-done";

	final static String EVENT_FLOW_TAKE = "flow-take";

	final static String EVENT_PROCESS_START = "process-start";
	final static String EVENT_PROCESS_END = "process-end";

	protected AlfrescoProcessEngineConfiguration activitiConfiguration;
	protected List<AlvexActivitiListener> listeners = new ArrayList<AlvexActivitiListener>();

	public AlfrescoProcessEngineConfiguration getActivitiConfiguration() {
		return activitiConfiguration;
	}

	@Required
	public void setActivitiConfiguration(
			AlfrescoProcessEngineConfiguration activitiConfiguration) {
		this.activitiConfiguration = activitiConfiguration;
	}

	@Override
	public void parseBoundaryErrorEventDefinition(Element arg0, boolean arg1,
			ActivityImpl arg2, ActivityImpl arg3) {
		// Nothing to do here
	}

	// Overrides are commented out to address #190
	// This workaround allows to compile against both 4.1.0 and 4.2.a

	// @Override
	public void parseBoundaryEvent(Element boundaryEventElement,
			ScopeImpl scopeElement, ActivityImpl nestedActivity) {
		// Nothing to do here		
	}

	// @Override
	public void parseIntermediateCatchEvent(Element intermediateEventElement,
			ScopeImpl scope, ActivityImpl activity) {
		// Nothing to do here		
	}

	// @Override
	public void parseIntermediateThrowEvent(Element intermediateEventElement,
			ScopeImpl scope, ActivityImpl activity) {
		// Nothing to do here		
	}

	// @Override
	public void parseCompensateEventDefinition(
			Element compensateEventDefinition, ActivityImpl compensationActivity) {
		// Nothing to do here		
	}

	// @Override
	public void parseTransaction(Element transactionElement, ScopeImpl scope,
			ActivityImpl activity) {
		// Nothing to do here		
	}

	// @Override
	public void parseEventBasedGateway(Element eventBasedGwElement,
			ScopeImpl scope, ActivityImpl activity) {
		// Nothing to do here		
	}

	// @Override
	public void parseBoundarySignalEventDefinition(
			Element signalEventDefinition, boolean interrupting,
			ActivityImpl signalActivity) {
		// Nothing to do here		
	}

	// @Override
	public void parseIntermediateMessageCatchEventDefinition(
			Element messageEventDefinition, ActivityImpl nestedActivity) {
		// Nothing to do here		
	}

	// @Override
	public void parseIntermediateSignalCatchEventDefinition(
			Element signalEventDefinition, ActivityImpl signalActivity) {
		// Nothing to do here
	}

	// @Override
	public void parseReceiveTask(Element receiveTaskElement, ScopeImpl scope,
			ActivityImpl activity) {
		// Nothing to do here
	}

	// @Override
	public void parseInclusiveGateway(Element inclusiveGwElement,
			ScopeImpl scope, ActivityImpl activity) {
		// Nothing to do here		
	}

	@Override
	public void parseBoundaryTimerEventDefinition(Element arg0, boolean arg1,
			ActivityImpl arg2) {
		// Nothing to do here
	}

	@Override
	public void parseBusinessRuleTask(Element arg0, ScopeImpl arg1,
			ActivityImpl arg2) {
		// Nothing to do here
	}

	@Override
	public void parseCallActivity(Element arg0, ScopeImpl arg1,
			ActivityImpl arg2) {
		// Nothing to do here
	}

	@Override
	public void parseEndEvent(Element arg0, ScopeImpl arg1, ActivityImpl arg2) {
		// Nothing to do here
	}

	@Override
	public void parseExclusiveGateway(Element arg0, ScopeImpl arg1,
			ActivityImpl arg2) {
		// Nothing to do here
	}

	@Override
	public void parseIntermediateTimerEventDefinition(Element arg0,
			ActivityImpl arg1) {
		// Nothing to do here
	}

	@Override
	public void parseManualTask(Element arg0, ScopeImpl arg1, ActivityImpl arg2) {
		// Nothing to do here
	}

	@Override
	public void parseMultiInstanceLoopCharacteristics(Element arg0,
			Element arg1, ActivityImpl arg2) {
		// Nothing to do here
	}

	@Override
	public void parseParallelGateway(Element arg0, ScopeImpl arg1,
			ActivityImpl arg2) {
		// Nothing to do here
	}

	@Override
	public void parseProcess(Element arg0, ProcessDefinitionEntity arg1) {
		String startEvent = EVENT_PROCESS_START + "@" + arg1.getKey();
		String endEvent = EVENT_PROCESS_END + "@" + arg1.getKey();
		for (AlvexActivitiListener listener : listeners) {
			if (listener.matches(startEvent)) {
				arg1.addExecutionListener(ExecutionListener.EVENTNAME_START,
						(ExecutionListener) listener);
			}
			if (listener.matches(endEvent)) {
				arg1.addExecutionListener(ExecutionListener.EVENTNAME_END,
						(ExecutionListener) listener);
			}
		}
	}

	@Override
	public void parseProperty(Element arg0, VariableDeclaration arg1,
			ActivityImpl arg2) {
		// Nothing to do here
	}

	@Override
	public void parseRootElement(Element arg0,
			List<ProcessDefinitionEntity> arg1) {
		// Nothing to do here
	}

	@Override
	public void parseScriptTask(Element arg0, ScopeImpl arg1, ActivityImpl arg2) {
		// Nothing to do here
	}

	@Override
	public void parseSendTask(Element arg0, ScopeImpl arg1, ActivityImpl arg2) {
		// Nothing to do here
	}

	@Override
	public void parseSequenceFlow(Element arg0, ScopeImpl arg1,
			TransitionImpl arg2) {
		if (!(arg1.getProcessDefinition() instanceof ProcessDefinitionEntity))
			throw new AlfrescoRuntimeException(
					"arg1.getProcessDefinition() is not an instance of ProcessDefinitionEntity");
		String processId = ((ProcessDefinitionEntity) arg1
				.getProcessDefinition()).getKey();
		String event = EVENT_FLOW_TAKE + ":" + arg2.getId() + "@" + processId;
		for (AlvexActivitiListener listener : listeners) {
			if (listener.matches(event)) {
				arg2.addExecutionListener((ExecutionListener) listener);
			}
		}
	}

	@Override
	public void parseServiceTask(Element arg0, ScopeImpl arg1, ActivityImpl arg2) {
		// Nothing to do here
	}

	@Override
	public void parseStartEvent(Element arg0, ScopeImpl arg1, ActivityImpl arg2) {
		// Nothing to do here
	}

	@Override
	public void parseSubProcess(Element arg0, ScopeImpl arg1, ActivityImpl arg2) {
		// Nothing to do here
	}

	@Override
	public void parseTask(Element arg0, ScopeImpl arg1, ActivityImpl arg2) {
		// Nothing to do here
	}

	@Override
	public void parseUserTask(Element arg0, ScopeImpl arg1, ActivityImpl arg2) {
		ActivityBehavior activitybehaviour = arg2.getActivityBehavior();
		if (activitybehaviour instanceof UserTaskActivityBehavior) {
			UserTaskActivityBehavior userTaskActivity = (UserTaskActivityBehavior) activitybehaviour;
			if (!(arg1.getProcessDefinition() instanceof ProcessDefinitionEntity))
				throw new AlfrescoRuntimeException(
						"arg1.getProcessDefinition() is not an instance of ProcessDefinitionEntity");
			String processId = ((ProcessDefinitionEntity) arg1
					.getProcessDefinition()).getKey();
			String taskName = userTaskActivity.getTaskDefinition()
					.getNameExpression().getExpressionText();
			String assignEvent1 = EVENT_TASK_ASSIGN1 + ":" + taskName + "@"
					+ processId;
			String assignEvent2 = EVENT_TASK_ASSIGN2 + ":" + taskName + "@"
					+ processId;
			String assignEvent3 = EVENT_TASK_ASSIGN3 + ":" + taskName + "@"
					+ processId;
			String createEvent = EVENT_TASK_CREATE + ":" + taskName + "@"
					+ processId;
			String doneEvent = EVENT_TASK_DONE + ":" + taskName + "@"
					+ processId;
			TaskDefinition def = userTaskActivity.getTaskDefinition();
			List<AlvexActivitiListener> assign1Listeners = new ArrayList<AlvexActivitiListener>();
			List<AlvexActivitiListener> assign2Listeners = new ArrayList<AlvexActivitiListener>();
			List<AlvexActivitiListener> assign3Listeners = new ArrayList<AlvexActivitiListener>();
			for (AlvexActivitiListener listener : listeners) {
				if (listener.matches(assignEvent1))
					assign1Listeners.add(listener);
				if (listener.matches(assignEvent2))
					assign2Listeners.add(listener);
				if (listener.matches(assignEvent3))
					assign3Listeners.add(listener);
				if (listener.matches(createEvent))
					def.addTaskListener(TaskListener.EVENTNAME_CREATE,
							(TaskListener) listener);
				if (listener.matches(doneEvent))
					def.addTaskListener(TaskListener.EVENTNAME_COMPLETE,
							(TaskListener) listener);
			}
			if (assign1Listeners.size() + assign2Listeners.size()
					+ assign3Listeners.size() > 0) {
				def.addTaskListener(TaskListener.EVENTNAME_ASSIGNMENT,
						new AssignTaskListener(assign1Listeners,
								assign2Listeners, assign3Listeners));
			}
		}
	}

	@Override
	public void afterPropertiesSet() throws Exception {
		((BpmnDeployer) activitiConfiguration.getDeploymentCache()
				.getDeployers().get(0)).getBpmnParser().getParseListeners()
				.add(this);
	}

	public void addListener(AlvexActivitiListener listener) {
		listeners.add(listener);
	}
}