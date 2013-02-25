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

/**
 * ManagerDashboardTasks extension implementation
 */

public class ManagerDashboardTasksExtension extends RepositoryExtension {

	// constructor
	public ManagerDashboardTasksExtension() throws Exception {
		id = "manager-dashboard-tasks";
		fileListPath = "alvex-manager-dashboard-tasks-file-list.txt";
		extInfoPath = "alvex-manager-dashboard-tasks.properties";
	}

	@Override
	void upgradeConfiguration(String oldVersion, String oldEdition) {
	}
}
