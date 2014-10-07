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

import com.alvexcore.repo.masterdata.AlvexMasterDataService;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

import org.alfresco.service.cmr.i18n.MessageLookup;
import org.alfresco.repo.dictionary.constraint.ListOfValuesConstraint;
import org.alfresco.service.cmr.repository.datatype.DefaultTypeConverter;
import org.alfresco.service.cmr.repository.datatype.TypeConversionException;
import org.alfresco.service.cmr.dictionary.ConstraintException;
import org.alfresco.service.cmr.repository.NodeRef;
import org.alfresco.service.ServiceRegistry;

public class MasterDataConstraint extends ListOfValuesConstraint implements Serializable {

	private static final String ERR_NON_STRING = "d_dictionary.constraint.string_length.non_string";
	private static final String ERR_INVALID_VALUE = "d_dictionary.constraint.list_of_values.invalid_value";
	
	protected static ServiceRegistry serviceRegistry;
	protected static AlvexMasterDataService alvexMasterDataService;
	protected String dataSourceName;
	protected HashMap<String,String> labels;

	@Override
	public String toString() {
		StringBuilder sb = new StringBuilder(80);
		sb.append("MasterDataConstraint")
				.append("[allowedValues={DYNAMIC}")
				.append(", caseSensitive=").append(isCaseSensitive())
				.append(", sorted=").append(isSorted())
				.append("]");
		return sb.toString();
	}
	
	public MasterDataConstraint() {
		super();
		sorted = true;
		labels = new HashMap<String,String>();
	}
	
	@Override
	public List<String> getRawAllowedValues() {
		// TODO - optimize
		List<String> allowedValues = new ArrayList<String>();
		NodeRef source = alvexMasterDataService.getMasterDataSource(dataSourceName);
		List<Map<String,String>> data = alvexMasterDataService.getMasterData(source);
		for(Map<String,String> item : data) {
			String value = item.get("value");
			String label = item.get("label");
			allowedValues.add(value);
			labels.put(value, label);
		}
		return allowedValues;
	}
	
	public List<String> getRawAllowedValuesUpper() {
		// TODO - optimize
		List<String> allowedValuesUpper = new ArrayList<String>();
		List<String> allowedValues = getRawAllowedValues();
		for(String value : allowedValues) {
			allowedValuesUpper.add(value.toUpperCase());
		}
		return allowedValuesUpper;
	}
	
	public String getDisplayLabel(String constraintAllowableValue, MessageLookup messageLookup) 	{
		return labels.get(constraintAllowableValue);
	}
	
	@SuppressWarnings({ "unchecked", "rawtypes" })
	@Override
	public void setAllowedValues(List allowedValues) {
		// Nothing to do, we are totally dynamic
	}
	
	@Override
	public void initialize() {
		// Nothing to do, we have no props to check
	}
	
	@Override
	public Map<String, Object> getParameters() {
		Map<String, Object> params = new HashMap<String, Object>(3);
		params.put(CASE_SENSITIVE_PARAM, this.caseSensitive);
		params.put(ALLOWED_VALUES_PARAM, "{DYNAMIC}");
		params.put(SORTED_PARAM, this.sorted);
		return params;
	}
	
	@Override
	protected void evaluateSingleValue(Object value) {
		// convert the value to a String
		String valueStr = null;
		try {
			valueStr = DefaultTypeConverter.INSTANCE.convert(String.class, value);
		} catch (TypeConversionException e) {
			throw new ConstraintException(ERR_NON_STRING, value, e);
		}
		// check that the value is in the set of allowed values
		if (isCaseSensitive()) {
			if (!getRawAllowedValues().contains(valueStr)) {
				throw new ConstraintException(ERR_INVALID_VALUE, value);
			}
		} else {
			if (!getRawAllowedValuesUpper().contains(valueStr.toUpperCase())) {
				throw new ConstraintException(ERR_INVALID_VALUE, value);
			}
		}
	}
	
	public void setServiceRegistry(ServiceRegistry registry) {
		MasterDataConstraint.serviceRegistry = registry;
	}
	
	public void setAlvexMasterDataService(AlvexMasterDataService alvexMasterDataService) {
		MasterDataConstraint.alvexMasterDataService = alvexMasterDataService;
	}
	
	public void setDataSourceName(String dataSourceName) {
		this.dataSourceName = dataSourceName;
	}
}