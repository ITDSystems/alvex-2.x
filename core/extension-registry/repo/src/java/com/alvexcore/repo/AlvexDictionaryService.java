/*
 * Copyright © 2014 ITD Systems
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

import java.util.List;
import org.alfresco.service.cmr.repository.NodeRef;
import org.alfresco.service.ServiceRegistry;
import org.alfresco.service.cmr.dictionary.DictionaryService;
import org.alfresco.service.cmr.dictionary.TypeDefinition;

public interface AlvexDictionaryService {

	public abstract TypeDefinition getDataType(String shortName);
	public abstract List<TypeDefinition> getParentHierarchy(TypeDefinition type);
	public abstract List<TypeDefinition> getParentHierarchy(NodeRef ref);
	public abstract boolean isContent(NodeRef ref);
	public abstract boolean isRegistry(NodeRef ref);
	public abstract boolean isRegistryItem(NodeRef ref);
	
	public abstract List<NodeRef> getParentRegistryItems(NodeRef fileRef);
	
	//public abstract List<PropertyDefinition> getTypeDescription(TypeDefinition type);
	//public abstract List<PropertyDefinition> getDirectTypeDescription(TypeDefinition type);
	//public abstract List<PropertyDefinition> getAspectDescription(QName aspectName);
	
	public abstract ServiceRegistry getServiceRegistry();
	public abstract DictionaryService getDictionaryService();
}