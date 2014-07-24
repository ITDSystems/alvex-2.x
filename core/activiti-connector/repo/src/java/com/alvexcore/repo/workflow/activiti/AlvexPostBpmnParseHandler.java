/**
 * Copyright © 2013 ITD Systems
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
import java.util.Collection;
import java.util.List;

import org.activiti.bpmn.model.BaseElement;
import org.activiti.bpmn.model.UserTask;
import org.activiti.bpmn.model.Process;
import org.activiti.engine.delegate.DelegateTask;
import org.activiti.engine.delegate.ExecutionListener;
import org.activiti.engine.delegate.TaskListener;
import org.activiti.engine.impl.bpmn.behavior.AbstractBpmnActivityBehavior;
import org.activiti.engine.impl.bpmn.behavior.ParallelMultiInstanceBehavior;
import org.activiti.engine.impl.bpmn.behavior.UserTaskActivityBehavior;
import org.activiti.engine.impl.bpmn.parser.BpmnParse;
import org.activiti.engine.impl.persistence.entity.ProcessDefinitionEntity;
import org.activiti.engine.impl.pvm.delegate.ActivityBehavior;
import org.activiti.engine.impl.pvm.process.ActivityImpl;
import org.activiti.engine.impl.task.TaskDefinition;
import org.activiti.engine.parse.BpmnParseHandler;
import org.alfresco.error.AlfrescoRuntimeException;
import org.springframework.beans.BeansException;
import org.springframework.beans.MutablePropertyValues;
import org.springframework.beans.PropertyValue;
import org.springframework.beans.factory.config.BeanDefinition;
import org.springframework.beans.factory.config.BeanFactoryPostProcessor;
import org.springframework.beans.factory.config.ConfigurableListableBeanFactory;
import org.springframework.beans.factory.config.RuntimeBeanReference;
import org.springframework.beans.factory.support.ManagedList;

import java.lang.reflect.Method;
import java.lang.NoSuchMethodException;

class AssignTaskListener implements TaskListener {
	private static final long serialVersionUID = -4057748622633153271L;

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

public class AlvexPostBpmnParseHandler implements BpmnParseHandler,
		BeanFactoryPostProcessor {

	private static final String HANDLER_BEAN_NAME = "alvex-activiti-connector-post-parse-handler";
	private static final String POST_PARSE_HANDLERS = "postBpmnParseHandlers";
	private static final String ACTIVITI_PROCESS_ENGINE_CONFIGURATION = "activitiProcessEngineConfiguration";
	final static String EVENT_TASK_ASSIGN1 = "task-assign-before-change";
	final static String EVENT_TASK_ASSIGN2 = "task-assign-change";
	final static String EVENT_TASK_ASSIGN3 = "task-assign-after-change";
	final static String EVENT_TASK_CREATE = "task-create";
	final static String EVENT_TASK_DONE = "task-done";

	// TODO
	// add back sequence flow execution listeners support
	// that was removed during because of changes made to activiti engine at
	// 4.2.d release
	// final static String EVENT_FLOW_TAKE = "flow-take";

	final static String EVENT_PROCESS_START = "process-start";
	final static String EVENT_PROCESS_END = "process-end";

	protected List<AlvexActivitiListener> listeners = new ArrayList<AlvexActivitiListener>();

	protected Collection<Class<? extends BaseElement>> handledTypes = new ArrayList<Class<? extends BaseElement>>();

	public AlvexPostBpmnParseHandler() {
		handledTypes.add(UserTask.class);
		handledTypes.add(Process.class);
	}

	public void addListener(AlvexActivitiListener listener) {
		listeners.add(listener);
	}

	@Override
	public Collection<Class<? extends BaseElement>> getHandledTypes() {
		return handledTypes;
	}

	@Override
	public void parse(BpmnParse bpmnParse, BaseElement element) {
		if (element instanceof Process) {
			ProcessDefinitionEntity cpd = bpmnParse
					.getCurrentProcessDefinition();
			String startEvent = EVENT_PROCESS_START + "@" + cpd.getKey();
			String endEvent = EVENT_PROCESS_END + "@" + cpd.getKey();
			for (AlvexActivitiListener listener : listeners) {
				if (listener.matches(startEvent)) {
					cpd.addExecutionListener(ExecutionListener.EVENTNAME_START,
							(ExecutionListener) listener);
				}
				if (listener.matches(endEvent)) {
					cpd.addExecutionListener(ExecutionListener.EVENTNAME_END,
							(ExecutionListener) listener);
				}
			}
		} else if (element instanceof UserTask) {
			ActivityImpl activity = bpmnParse.getCurrentScope().findActivity(
					element.getId());
			ActivityBehavior activityBehavior = activity.getActivityBehavior();
			UserTaskActivityBehavior userTaskActivitiBehaviour = null;
			
			// Ugly hack - check if getInnerActivityBehavior() is present.
			// It exists for 4.2.e+ and 4.2.0+ only and is absent for 4.2.d.
			// However, 4.2.d contains ParallelMultiInstanceBehavior already.
			// So we determine is the method is present to prevent bad calls later.
			// If we do not do it, we just crash on 4.2.d during startup.
			// Please, remove this hack as soon as we decide to drop 4.2.d completely.
			// Also consider removing imports for Method and NoSuchMethodException.
			Method getInnerActivityBehavior = null;
			try {
				getInnerActivityBehavior = ParallelMultiInstanceBehavior.class.getMethod(
												"getInnerActivityBehavior", (Class<?>[]) null);
			} catch (NoSuchMethodException e) {
				// Do nothing
			}
			
			if (activityBehavior instanceof UserTaskActivityBehavior) {
				userTaskActivitiBehaviour = (UserTaskActivityBehavior) activityBehavior;
			}
			/* 
				This code works only for 4.2.e+ and 4.2.0+
				ParallelMultiInstanceBehavior and AbstractBpmnActivityBehavior are not in 4.2.d
			*/
			else if (activityBehavior instanceof ParallelMultiInstanceBehavior
						&& getInnerActivityBehavior != null) {
				ParallelMultiInstanceBehavior parallelMultiInstanceBehavior = (ParallelMultiInstanceBehavior)activityBehavior;
				AbstractBpmnActivityBehavior innerActivityBehavior = parallelMultiInstanceBehavior.getInnerActivityBehavior();
				if (!(innerActivityBehavior instanceof UserTaskActivityBehavior))
					throw new AlfrescoRuntimeException("Inner behaviour in not instance of UserTaskActivityBehavior");
				userTaskActivitiBehaviour = (UserTaskActivityBehavior)innerActivityBehavior;
			}
			else
				return;

			String processId = bpmnParse.getCurrentProcessDefinition().getKey();
			String taskName = userTaskActivitiBehaviour.getTaskDefinition()
					.getNameExpression().getExpressionText();
			TaskDefinition def = userTaskActivitiBehaviour.getTaskDefinition();
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
				if (listener.matches(createEvent)) {
					def.addTaskListener(TaskListener.EVENTNAME_CREATE,
							(TaskListener) listener);
				}
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

	@SuppressWarnings("unchecked")
	@Override
	public void postProcessBeanFactory(
			ConfigurableListableBeanFactory beanFactory) throws BeansException {
		BeanDefinition activitiConfiguration = beanFactory
				.getBeanDefinition(ACTIVITI_PROCESS_ENGINE_CONFIGURATION);
		MutablePropertyValues propertyValues = activitiConfiguration
				.getPropertyValues();
		PropertyValue postParseHandlers = propertyValues
				.getPropertyValue(POST_PARSE_HANDLERS);
		ManagedList<RuntimeBeanReference> refsList = (ManagedList<RuntimeBeanReference>) postParseHandlers
				.getValue();
		refsList.add(new RuntimeBeanReference(HANDLER_BEAN_NAME));
	}
}