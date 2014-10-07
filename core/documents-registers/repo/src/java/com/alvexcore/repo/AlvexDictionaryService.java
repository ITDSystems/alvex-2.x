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
import java.util.Map;
import org.alfresco.service.namespace.QName;
import org.alfresco.service.cmr.repository.NodeRef;
import org.alfresco.service.ServiceRegistry;
import org.alfresco.service.cmr.dictionary.DictionaryService;
import org.alfresco.service.cmr.dictionary.TypeDefinition;
import org.alfresco.service.cmr.dictionary.PropertyDefinition;
import org.alfresco.service.cmr.dictionary.AssociationDefinition;

public interface AlvexDictionaryService {

	public abstract TypeDefinition getDataType(String shortName);
	public abstract List<TypeDefinition> getParentHierarchy(TypeDefinition type);
	public abstract List<TypeDefinition> getParentHierarchy(NodeRef ref);
	public abstract boolean isContent(NodeRef ref);
	public abstract boolean isRegistry(NodeRef ref);
	public abstract boolean isRegistryItem(NodeRef ref);
	
	public abstract Map<QName, PropertyDefinition> getAllTypeProperties(String shortName);
	public abstract Map<QName, PropertyDefinition> getAllTypeProperties(NodeRef ref);
	public abstract Map<QName, PropertyDefinition> getAllTypeProperties(TypeDefinition type);
	public abstract Map<QName, AssociationDefinition> getAllTypeAssocs(String shortName);
	public abstract Map<QName, AssociationDefinition> getAllTypeAssocs(NodeRef ref);
	public abstract Map<QName, AssociationDefinition> getAllTypeAssocs(TypeDefinition type);
	
	public abstract ServiceRegistry getServiceRegistry();
	public abstract DictionaryService getDictionaryService();
}