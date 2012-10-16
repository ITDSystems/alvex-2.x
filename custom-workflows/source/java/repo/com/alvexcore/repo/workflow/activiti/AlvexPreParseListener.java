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
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.activiti.engine.impl.bpmn.behavior.UserTaskActivityBehavior;
import org.activiti.engine.impl.bpmn.deployer.BpmnDeployer;
import org.activiti.engine.impl.bpmn.parser.BpmnParseListener;
import org.activiti.engine.impl.persistence.entity.ProcessDefinitionEntity;
import org.activiti.engine.impl.pvm.delegate.ActivityBehavior;
import org.activiti.engine.impl.pvm.process.ActivityImpl;
import org.activiti.engine.impl.pvm.process.ScopeImpl;
import org.activiti.engine.impl.pvm.process.TransitionImpl;
import org.activiti.engine.impl.util.xml.Element;
import org.activiti.engine.impl.variable.VariableDeclaration;
import org.alfresco.repo.model.Repository;
import org.alfresco.repo.workflow.activiti.AlfrescoProcessEngineConfiguration;
import org.alfresco.service.ServiceRegistry;
import org.springframework.beans.factory.InitializingBean;

public class AlvexPreParseListener implements BpmnParseListener,
		InitializingBean {

	protected Repository repository = null;
	protected ServiceRegistry serviceRegistry = null;
	protected AlfrescoProcessEngineConfiguration activitiConfiguration;
	protected Map<String, List<AbstractAlvexTaskListener>> taskListeners = new HashMap<String, List<AbstractAlvexTaskListener>>();
	protected Map<String, List<AbstractAlvexExecutionListener>> processListeners = new HashMap<String, List<AbstractAlvexExecutionListener>>();

	public AlfrescoProcessEngineConfiguration getActivitiConfiguration() {
		return activitiConfiguration;
	}

	public void setActivitiConfiguration(
			AlfrescoProcessEngineConfiguration activitiConfiguration) {
		this.activitiConfiguration = activitiConfiguration;
	}

	public Repository getRepository() {
		return repository;
	}

	public void setRepository(Repository repository) {
		this.repository = repository;
	}

	public ServiceRegistry getServiceRegistry() {
		return serviceRegistry;
	}

	public void setServiceRegistry(ServiceRegistry serviceRegistry) {
		this.serviceRegistry = serviceRegistry;
	}

	@Override
	public void parseBoundaryErrorEventDefinition(Element arg0, boolean arg1,
			ActivityImpl arg2, ActivityImpl arg3) {
		//
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
		//
	}

	@Override
	public void parseBusinessRuleTask(Element arg0, ScopeImpl arg1,
			ActivityImpl arg2) {
		//
	}

	@Override
	public void parseCallActivity(Element arg0, ScopeImpl arg1,
			ActivityImpl arg2) {
		//
	}

	@Override
	public void parseEndEvent(Element arg0, ScopeImpl arg1, ActivityImpl arg2) {
		//
	}

	@Override
	public void parseExclusiveGateway(Element arg0, ScopeImpl arg1,
			ActivityImpl arg2) {
		//
	}

	@Override
	public void parseIntermediateTimerEventDefinition(Element arg0,
			ActivityImpl arg1) {
		//
	}

	@Override
	public void parseManualTask(Element arg0, ScopeImpl arg1, ActivityImpl arg2) {
		//
	}

	@Override
	public void parseMultiInstanceLoopCharacteristics(Element arg0,
			Element arg1, ActivityImpl arg2) {
		//
	}

	@Override
	public void parseParallelGateway(Element arg0, ScopeImpl arg1,
			ActivityImpl arg2) {
		//
	}

	@Override
	public void parseProcess(Element arg0, ProcessDefinitionEntity arg1) {
		//
	}

	@Override
	public void parseProperty(Element arg0, VariableDeclaration arg1,
			ActivityImpl arg2) {
		//
	}

	@Override
	public void parseRootElement(Element arg0,
			List<ProcessDefinitionEntity> arg1) {
		for (ProcessDefinitionEntity def : arg1)
			for (String event : processListeners.keySet()) {
				for (AbstractAlvexExecutionListener listener : processListeners
						.get(event))
					if (listener.processMatches(def.getId()))
						def.addExecutionListener(event, listener);
			}
	}

	@Override
	public void parseScriptTask(Element arg0, ScopeImpl arg1, ActivityImpl arg2) {
		//
	}

	@Override
	public void parseSendTask(Element arg0, ScopeImpl arg1, ActivityImpl arg2) {
		//
	}

	@Override
	public void parseSequenceFlow(Element arg0, ScopeImpl arg1,
			TransitionImpl arg2) {
		//
	}

	@Override
	public void parseServiceTask(Element arg0, ScopeImpl arg1, ActivityImpl arg2) {
		//
	}

	@Override
	public void parseStartEvent(Element arg0, ScopeImpl arg1, ActivityImpl arg2) {
		//
	}

	@Override
	public void parseSubProcess(Element arg0, ScopeImpl arg1, ActivityImpl arg2) {
		//
	}

	@Override
	public void parseTask(Element arg0, ScopeImpl arg1, ActivityImpl arg2) {
		//
	}

	@Override
	public void parseUserTask(Element arg0, ScopeImpl arg1, ActivityImpl arg2) {
		ActivityBehavior activitybehaviour = arg2.getActivityBehavior();
		if (activitybehaviour instanceof UserTaskActivityBehavior) {
			UserTaskActivityBehavior userTaskActivity = (UserTaskActivityBehavior) activitybehaviour;
			String processId = arg1.getProcessDefinition().getId();
			String taskName = userTaskActivity.getTaskDefinition()
					.getNameExpression().getExpressionText();
			for (String event : taskListeners.keySet()) {
				for (AbstractAlvexTaskListener listener : taskListeners
						.get(event))
					if (listener.taskMatches(processId, taskName))
						userTaskActivity.getTaskDefinition().addTaskListener(
								event, listener);
			}
		}
	}

	@Override
	public void afterPropertiesSet() throws Exception {
		if (serviceRegistry == null)
			throw new Exception("Service registry is not set, it's fatal");
		if (repository == null)
			throw new Exception("Repository is not set, it's fatal");
		if (activitiConfiguration == null)
			throw new Exception("Activiti configuration is not set, it's fatal");
		// register listener
		// TODO check this deployment method
		((BpmnDeployer) activitiConfiguration.getDeploymentCache()
				.getDeployers().get(0)).getBpmnParser().getParseListeners()
				.add(this);
	}

	public void addTaskListener(String event, AbstractAlvexTaskListener listener) {
		if (!taskListeners.containsKey(event))
			taskListeners
					.put(event, new ArrayList<AbstractAlvexTaskListener>());
		taskListeners.get(event).add(listener);
	}

	public void addProcessListener(String event,
			AbstractAlvexExecutionListener listener) {
		if (!processListeners.containsKey(event))
			processListeners.put(event, new ArrayList<AbstractAlvexExecutionListener>());
		processListeners.get(event).add(listener);
	}
}