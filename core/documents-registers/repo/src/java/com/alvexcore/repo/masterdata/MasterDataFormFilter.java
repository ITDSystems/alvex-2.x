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

import com.alvexcore.repo.AlvexContentModel;
import com.alvexcore.repo.AlvexDictionaryService;
import com.alvexcore.repo.masterdata.AlvexMasterDataService;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.alfresco.repo.dictionary.constraint.ListOfValuesConstraint;
import static org.alfresco.repo.dictionary.constraint.ListOfValuesConstraint.ALLOWED_VALUES_PARAM;
import static org.alfresco.repo.dictionary.constraint.ListOfValuesConstraint.CASE_SENSITIVE_PARAM;
import static org.alfresco.repo.dictionary.constraint.ListOfValuesConstraint.SORTED_PARAM;

import org.alfresco.repo.forms.Field;
import org.alfresco.repo.forms.FieldGroup;
import org.alfresco.repo.forms.FieldDefinition;
import org.alfresco.repo.forms.PropertyFieldDefinition;
import org.alfresco.repo.forms.PropertyFieldDefinition.FieldConstraint;
import org.alfresco.repo.forms.Form;
import org.alfresco.repo.forms.FormData;
import org.alfresco.repo.forms.processor.AbstractFilter;
import org.alfresco.repo.forms.processor.node.FieldUtils;
import org.alfresco.repo.jscript.ValueConverter;
import org.alfresco.service.cmr.dictionary.Constraint;
import org.alfresco.service.cmr.dictionary.DictionaryService;
import org.alfresco.service.cmr.dictionary.TypeDefinition;
import org.alfresco.service.cmr.dictionary.PropertyDefinition;
import org.alfresco.service.cmr.dictionary.ConstraintDefinition;
import org.alfresco.service.cmr.repository.AssociationRef;
import org.alfresco.service.cmr.repository.ChildAssociationRef;
import org.alfresco.service.cmr.repository.NodeRef;
import org.alfresco.service.cmr.repository.NodeService;
import org.alfresco.service.namespace.NamespaceService;
import org.alfresco.service.namespace.QName;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;

/**
 * Should cover master data based dynamic constraints
 */
public class MasterDataFormFilter<ItemType> extends AbstractFilter<ItemType, NodeRef>
{
	/** Logger */
	private static Log logger = LogFactory.getLog(MasterDataFormFilter.class);
	protected NodeService nodeService;
	protected DictionaryService dictionaryService;
	protected AlvexMasterDataService alvexMasterDataService;
	protected AlvexDictionaryService alvexDictionaryService;

	/**
	 * @see
	 * org.alfresco.repo.forms.processor.Filter#beforePersist(java.lang.Object,
	 * org.alfresco.repo.forms.FormData)
	 */
	public void beforePersist(ItemType item, FormData data)
	{
		// ignored
	}

	/**
	 * @see
	 * org.alfresco.repo.forms.processor.Filter#beforeGenerate(java.lang.Object,
	 * java.util.List, java.util.List, org.alfresco.repo.forms.Form,
	 * java.util.Map)
	 */
	public void beforeGenerate(ItemType item, List<String> fields, List<String> forcedFields,
			Form form, Map<String, Object> context)
	{
		// ignored
	}

	/**
	 * @see
	 * org.alfresco.repo.forms.processor.Filter#afterPersist(java.lang.Object,
	 * org.alfresco.repo.forms.FormData, java.lang.Object)
	 */
	public void afterPersist(ItemType item, FormData data, NodeRef persistedObject)
	{
		// ignored
	}
	
	/**
	 * @see
	 * org.alfresco.repo.forms.processor.Filter#afterGenerate(java.lang.Object,
	 * java.util.List, java.util.List, org.alfresco.repo.forms.Form,
	 * java.util.Map)
	 */
	public void afterGenerate(ItemType item, List<String> fields, List<String> forcedFields, 
			Form form, Map<String, Object> context)
	{
		NodeRef registerRef = null;
		if(item instanceof NodeRef)
		{
			ChildAssociationRef parent = nodeService.getPrimaryParent((NodeRef)item);
			registerRef = parent.getParentRef();
		}
		else if(item instanceof TypeDefinition)
		{
			Object dest = context.get("destination");
			registerRef = (dest != null ? new NodeRef((String)dest) : null);
		}
		
		for(FieldDefinition fd : form.getFieldDefinitions())
		{
			if(fd instanceof PropertyFieldDefinition)
			{
				PropertyFieldDefinition pfd = (PropertyFieldDefinition)fd;
				String name = pfd.getName();
				Constraint c = alvexMasterDataService.getConstraint(registerRef, name);
				if(c != null)
				{
					ListOfValuesConstraint lovc = (ListOfValuesConstraint)c;
					List<String> allowedValues = lovc.getAllowedValues();
					List<String> allowedValuesStrings = new ArrayList<String>();
					for(String val : allowedValues)
					{
						allowedValuesStrings.add(val + "|" + lovc.getDisplayLabel(val, dictionaryService));
					}
					List<FieldConstraint> cs = pfd.getConstraints();
					if(cs == null)
						cs = new ArrayList<FieldConstraint>();
					Map<String, Object> params = new HashMap<String, Object>(3);
					params.put(CASE_SENSITIVE_PARAM, true);
					params.put(ALLOWED_VALUES_PARAM, allowedValuesStrings);
					params.put(SORTED_PARAM, true);
					FieldConstraint fc = new FieldConstraint("LIST", params);
					cs.add(fc);
					pfd.setConstraints(cs);
				}
			}
		}
	}
	
	public void setNodeService(NodeService nodeService)
	{
		this.nodeService = nodeService;
	}
	
	public void setAlvexMasterDataService(AlvexMasterDataService alvexMasterDataService) {
		this.alvexMasterDataService = alvexMasterDataService;
	}
	
	public void setAlvexDictionaryService(AlvexDictionaryService alvexDictionaryService)
	{
		this.alvexDictionaryService = alvexDictionaryService;
		this.dictionaryService = alvexDictionaryService.getDictionaryService();
	}
}