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

package com.alvexcore.repo.masterdata;

import com.alvexcore.repo.DocumentsRegistersExtension;
import java.util.List;
import java.util.Map;
import org.alfresco.service.cmr.repository.NodeRef;
import org.alfresco.service.ServiceRegistry;
import org.alfresco.service.cmr.dictionary.Constraint;

public interface AlvexMasterDataService {
	
	public abstract List<NodeRef> getMasterDataSources();
	public abstract NodeRef getMasterDataSource(String name);
	public abstract NodeRef createMasterDataSource(Map<String,String> props);
	public abstract void deleteMasterDataSource(NodeRef source);
	public abstract List<Map<String,String>> getMasterData(NodeRef source);
	public abstract boolean syncMasterData(NodeRef source);
	public abstract void attachMasterData(String masterDataSourceName, NodeRef containerRef, String propertyName);
	public abstract void detachMasterData(NodeRef containerRef, String propertyName);
	public abstract Map<String,String> getAttachedMasterData(NodeRef containerRef);
	public abstract Constraint getConstraint(NodeRef containerRef, String propertyName);
	
	public abstract ServiceRegistry getServiceRegistry();
	public abstract void setDocumentsRegistersExtension(DocumentsRegistersExtension extension);
	public abstract void setUp();
}