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
package com.alvexcore.license;

import java.util.Date;

public class LicenseInfo {

	public static final LicenseInfo INVALID_LICENSE = new LicenseInfo("INVALID",
			null, null, null, null, -1, -1, null, null, false);

	private String id;
	private String owner;
	private Date validThru;
	private Date issued;
	private int cores;
	private long users;
	private String version;
	private String edition;
	private String product;
	private boolean trial;

	public LicenseInfo(String id, String owner, String product, String edition, String version, 
			int cores, long users, Date issued, Date validThru, boolean trial) {
		this.owner = owner;
		this.product = product;
		this.edition = edition;
		this.version = version;
		this.cores = cores;
		this.users = users;
		this.issued = issued;
		this.validThru = validThru;
		this.trial = trial;
		this.id = id;
	}

	public String getOwner() {
		return owner;
	}

	public Date getValidThru() {
		return validThru;
	}

	public int getCores() {
		return cores;
	}

	public long getUsers() {
		return users;
	}

	public String getEdition() {
		return edition;
	}

	public String getProduct() {
		return product;
	}
	
	public String getVersion() {
		return version;
	}
	
	public Date getIssued() {
		return issued;
	}

	public static LicenseInfo getInvalidLicense() {
		return INVALID_LICENSE;
	}

	public boolean getTrial() {
		return trial;
	}

	public String getId() {
		return id;
	}

	public void setId(String id) {
		this.id = id;
	}
}