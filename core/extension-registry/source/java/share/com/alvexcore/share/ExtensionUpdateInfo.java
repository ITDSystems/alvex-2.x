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

package com.alvexcore.share;

import java.util.Map;

/**
 * Class to hold information about extension update
 *
 */
public class ExtensionUpdateInfo {
	public String extensionId;
	public String repoVersion;
	public String shareVersion;
	public String repoLatestVersion;
	public String shareLatestVersion;
	public Map<String,Boolean> repoFiles;
	public Map<String,Boolean> shareFiles;
	public String motd;
	
	public ExtensionUpdateInfo(String extensionId, String repoVersion, String shareVersion, String repoLatestVersion, String shareLatestVersion, Map<String,Boolean> repoFiles, Map<String,Boolean> shareFiles, String motd)
	{
		this.extensionId = extensionId;
		this.repoVersion = repoVersion;
		this.shareVersion = shareVersion;
		this.repoLatestVersion = repoLatestVersion;
		this.shareLatestVersion = shareLatestVersion;
		this.repoFiles = repoFiles;
		this.shareFiles = shareFiles;
		this.motd = motd;
	}
	
}
