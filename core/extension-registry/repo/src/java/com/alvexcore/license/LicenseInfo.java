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
			null, null, 0, 0, null, null, false, false);

	private String id;
	private String owner;
	private Date validThru;
	private Date issued;
	private int cores;
	private int edition;
	private String product;
	private boolean valid;
	private boolean trial;

	public LicenseInfo(String id, String owner, String product, int edition,
			int cores, Date issued, Date validThru, boolean valid, boolean trial) {
		this.owner = owner;
		this.product = product;
		this.edition = edition;
		this.cores = cores;
		this.issued = issued;
		this.validThru = validThru;
		this.valid = valid;
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

	public int getEdition() {
		return edition;
	}

	public String getProduct() {
		return product;
	}

	public boolean isValid() {
		return valid;
	}

	public Date getIssued() {
		return issued;
	}

	public static LicenseInfo getInvalidLicense() {
		return INVALID_LICENSE;
	}

	public boolean isTrial() {
		return trial;
	}

	public String getId() {
		return id;
	}

	public void setId(String id) {
		this.id = id;
	}
}
