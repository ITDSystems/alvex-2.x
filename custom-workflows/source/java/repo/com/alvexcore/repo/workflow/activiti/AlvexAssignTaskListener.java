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
import org.alfresco.service.ServiceRegistry;
import org.springframework.beans.factory.InitializingBean;

public class AlvexAssignTaskListener implements AbstractAlvexTaskListener,
		InitializingBean {

	protected List<AbstractAlvexTaskListener> beforeChangeListeners = new ArrayList<AbstractAlvexTaskListener>();
	protected List<AbstractAlvexTaskListener> changeListeners = new ArrayList<AbstractAlvexTaskListener>();
	protected List<AbstractAlvexTaskListener> afterChangeListeners = new ArrayList<AbstractAlvexTaskListener>();

	protected ServiceRegistry serviceRegistry;
	protected AlvexPreParseListener alvexPreParseListener;

	public void setAlvexPreParseListener(
			AlvexPreParseListener alvexPreParseListener) {
		this.alvexPreParseListener = alvexPreParseListener;
	}

	@Override
	public void notify(DelegateTask delegateTask) {
		String taskName = delegateTask.getName();
		String processName = delegateTask.getProcessDefinitionId();
		// call task listeners
		for (AbstractAlvexTaskListener listener : beforeChangeListeners)
			if (listener.taskMatches(processName, taskName))
				listener.notify(delegateTask);
		for (AbstractAlvexTaskListener listener : changeListeners)
			if (listener.taskMatches(processName, taskName))
				listener.notify(delegateTask);
		for (AbstractAlvexTaskListener listener : afterChangeListeners)
			if (listener.taskMatches(processName, taskName))
				listener.notify(delegateTask);
	}

	@Override
	public boolean taskMatches(String processName, String taskName) {
		return true;
	}

	public void addBeforeChangeListener(AbstractAlvexTaskListener listener) {
		beforeChangeListeners.add(listener);
	}

	public void addChangeListener(AbstractAlvexTaskListener listener) {
		changeListeners.add(listener);
	}

	public void addAfterChangeListener(AbstractAlvexTaskListener listener) {
		afterChangeListeners.add(listener);
	}

	@Override
	public void afterPropertiesSet() throws Exception {
		if (alvexPreParseListener == null)
			throw new Exception(
					"Alvex pre-parse listener is not set, it's fatal.");
		// register task listener
		alvexPreParseListener.addTaskListener(EVENTNAME_ASSIGNMENT, this);
	}
}
