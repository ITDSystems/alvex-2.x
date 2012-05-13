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

package ru.itdsystems.alfresco.memo;

import org.alfresco.repo.processor.BaseProcessorExtension;
import org.springframework.beans.factory.InitializingBean;

import java.sql.*;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;

import org.apache.commons.lang.StringEscapeUtils;

public class MemoService extends BaseProcessorExtension implements
		InitializingBean {

	private String dbUsername = null;
	private String dbPassword = null;
	private String dbUrl = null;
	private Connection dbConnection;
	private Statement dbStatement = null;

	private String TABLE_CHECK_QUERY = "SELECT * FROM itd_memo WHERE memo_id=-1;";
	private String TABLE_CREATE_QUERY = "CREATE TABLE itd_memo(memo_id SERIAL,memo_key VARCHAR(50) NOT NULL,memo_value VARCHAR(100),PRIMARY KEY(memo_id));";
	private String GET_VALUE_QUERY = "SELECT memo_value FROM itd_memo WHERE memo_key='{key}' ORDER BY memo_id LIMIT 1;";
	private String ADD_VALUE_QUERY = "INSERT INTO itd_memo(memo_key, memo_value) VALUES ('{key}', '{value}');";
	private String GET_VALUES_QUERY = "SELECT memo_value FROM itd_memo WHERE memo_key='{key}' ORDER BY memo_id;";
	private String REMOVE_VALUE_QUERY = "DELETE FROM itd_memo WHERE memo_key='{key}' AND memo_value='{value}';";
	private String REMOVE_VALUES_QUERY = "DELETE FROM itd_memo WHERE memo_key='{key}';";
	private String REMOVE_KEYS_LIKE_QUERY = "DELETE FROM itd_memo WHERE memo_key LIKE '{key}%';";

	// for spring injection
	public void setDbUrl(String dbUrl) {
		this.dbUrl = dbUrl;
	}

	public void setDbUsername(String dbUsername) {
		this.dbUsername = dbUsername;
	}

	public void setDbPassword(String dbPassword) {
		this.dbPassword = dbPassword;
	}

	public void afterPropertiesSet() throws Exception {
		initializeConnection();
	}

	// initializes database connection
	private void initializeConnection() throws Exception {
		try {
			// get connection
			dbConnection = DriverManager.getConnection(dbUrl, dbUsername,
					dbPassword);
			// FIXME
			// check table existence
			try {
				dbStatement = dbConnection.createStatement();
				dbStatement.executeQuery(TABLE_CHECK_QUERY);
				// table exists
			} catch (SQLException e) {
				// table doesn't exist
				dbStatement.executeUpdate(TABLE_CREATE_QUERY);
			}
		} catch (SQLException e) {
			throw new Exception("Error occured while connecting to database.", e);
		}
	}

	// returns SQL query with all substitutions performed
	private String buildQueryString(String queryTemplate, Map<String, String> substitutions) {
		String query = queryTemplate;
		Iterator<Entry<String, String>> iter = substitutions.entrySet().iterator();
		while (iter.hasNext()) {
			Entry<String, String> entry = iter.next();
			query = query.replace(entry.getKey(), StringEscapeUtils.escapeSql(entry.getValue()));
		}
		
		return query;
	}
	
	// returns one value for specified key
	public synchronized String getValue(String key) throws Exception {
		String result = null;
		Map <String, String> subst = new HashMap<String, String>();
		subst.put("{key}", key);
		try {
			ResultSet dbResultSet = dbStatement.executeQuery(buildQueryString(GET_VALUE_QUERY, subst));					
			if (dbResultSet.next())
				result = dbResultSet.getString(1);
		} catch (SQLException e) {
			throw new Exception("Error occured while processing your request.", e);
		}
		return result;
	}

	// returns all values for specified key
	public synchronized Object[] getValues(String key) throws Exception {
		List<String> result = new ArrayList<String>();
		Map <String, String> subst = new HashMap<String, String>();
		subst.put("{key}", key);
		try {
			ResultSet dbResultSet = dbStatement.executeQuery(buildQueryString(GET_VALUES_QUERY, subst));
			while (dbResultSet.next())
				result.add(dbResultSet.getString(1));
			return result.toArray();
		} catch (SQLException e) {
			throw new Exception("Error occured while processing your request.", e);
		}
	}

	// adds new key-value pair
	public synchronized void addValue(String key, String value)
			throws Exception {
		Map <String, String> subst = new HashMap<String, String>();
		subst.put("{key}", key);
		subst.put("{value}", value);
		try {
			dbStatement.executeUpdate(buildQueryString(ADD_VALUE_QUERY, subst));
		} catch (SQLException e) {
			throw new Exception("Error occured while processing your request.", e);
		}
	}
	
	// removes specified value
	public synchronized void removeValue(String key, String value) throws Exception {
		Map <String, String> subst = new HashMap<String, String>();
		subst.put("{key}", key);
		subst.put("{value}", value);
		try {
			dbStatement.executeUpdate(buildQueryString(REMOVE_VALUE_QUERY, subst));
		} catch (SQLException e) {
			throw new Exception("Error occured while processing your request.", e);
		}
	}

	// removes all values for specified key
	public synchronized void removeValues(String key) throws Exception {
		Map <String, String> subst = new HashMap<String, String>();
		subst.put("{key}", key);
		try {
			dbStatement.executeUpdate(buildQueryString(REMOVE_VALUES_QUERY, subst));
		} catch (SQLException e) {
			throw new Exception("Error occured while processing your request.", e);
		}
	}
	
	// removes all values for keys that start with specified string
	public synchronized void removeKeysLike(String startsWith) throws Exception {
		Map <String, String> subst = new HashMap<String, String>();
		subst.put("{key}", startsWith);
		try {
			dbStatement.executeUpdate(buildQueryString(REMOVE_KEYS_LIKE_QUERY, subst));
		} catch (SQLException e) {
			throw new Exception("Error occured while processing your request.", e);
		}
	}

}
