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
package com.alvexcore.repo;

import org.alfresco.repo.model.Repository;
import org.alfresco.service.ServiceRegistry;

import com.alvexcore.ExtensionRegistry;

/**
 * Repository extension registry implementation
 * 
 * @author Alexey Ermakov
 * 
 */

public class RepositoryExtensionRegistry extends ExtensionRegistry {

	private Repository repository = null;
	private ServiceRegistry serviceRegistry = null;
	
	public Repository getRepository() {
		return repository;
	}

	public ServiceRegistry getServiceRegistry() {
		return serviceRegistry;
	}	
	
	public void setRepository(Repository repository) {
		this.repository = repository;
	}
	
	public void setServiceRegistry(ServiceRegistry serviceRegistry) {
		this.serviceRegistry = serviceRegistry;
	}
	
	@Override
	public void afterPropertiesSet() throws Exception {
		super.afterPropertiesSet();
		if (repository == null)
			throw new Exception("Repository is not set, it' fatal.");
		if (serviceRegistry == null)
			throw new Exception("Service registry is not set, it' fatal.");
	}	
	
	@Override
	public String getSystemId() {
		return "noderef:" + repository.getCompanyHome().getId();
	}

}
