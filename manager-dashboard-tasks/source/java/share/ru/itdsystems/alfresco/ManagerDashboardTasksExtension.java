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

package ru.itdsystems.alfresco;

import ru.itdsystems.alfresco.ManagerDashboardTasksExtension;

/**
 * ManagerDashboardTasks extension implementation
 */

public class ManagerDashboardTasksExtension extends Extension {

	// constructor
	public ManagerDashboardTasksExtension() throws Exception {
		id = "manager-dashboard-tasks";
		version = "1.2.1";
		fileListPath = "alfresco/itd-manager-dashboard-tasks-file-list.txt";
	}
}
