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
import java.util.regex.Pattern;

import org.springframework.beans.factory.InitializingBean;
import org.springframework.beans.factory.annotation.Required;
import org.alfresco.repo.model.Repository;
import org.alfresco.service.ServiceRegistry;


public abstract class AlvexActivitiListener implements InitializingBean {
	List<Pattern> matches = new ArrayList<Pattern>();
	AlvexPostBpmnParseHandler alvexPostParseHandler;
	protected Repository repository;
	protected ServiceRegistry serviceRegistry;
	
	@Required
	public void setMatches(List<String> matches) {
		for (String match: matches) {
			this.matches.add(Pattern.compile(match));
		}
	}
	
	@Required
	public void setAlvexPostParseHandler(AlvexPostBpmnParseHandler postParseListener) {
		this.alvexPostParseHandler = postParseListener;
	}

	@Required
	public void setRepository(Repository repository) {
		this.repository = repository;
	}

	@Required
	public void setServiceRegistry(ServiceRegistry serviceRegistry) {
		this.serviceRegistry = serviceRegistry;
	}
	
	@Override
	public void afterPropertiesSet() throws Exception {
		alvexPostParseHandler.addListener(this);
	}
	
	public boolean matches(String regex) {
		for (Pattern pattern: matches)
			if (pattern.matcher(regex).matches())
				return true;
		return false;
	}
}
