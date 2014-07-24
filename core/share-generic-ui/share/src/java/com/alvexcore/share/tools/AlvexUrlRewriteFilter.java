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

package com.alvexcore.share.tools;

import org.tuckey.web.filters.urlrewrite.UrlRewriteFilter;
import org.tuckey.web.filters.urlrewrite.Conf;
import javax.servlet.Filter;
import javax.servlet.FilterConfig;
import javax.servlet.ServletContext;
import javax.servlet.ServletException;
import java.net.URL;
import java.io.InputStream;

public class AlvexUrlRewriteFilter extends UrlRewriteFilter
{
	// Overload just one method to load config file properly
	@Override
	protected void loadUrlRewriter(FilterConfig filterConfig) throws ServletException
	{
		String confPath = filterConfig.getInitParameter("confPath");
		ServletContext context = filterConfig.getServletContext();
		InputStream inputStream = this.getClass().getClassLoader().getResourceAsStream(confPath);
		URL confUrl = this.getClass().getClassLoader().getResource(confPath);
		String confUrlStr = (confUrl != null ? confUrl.toString() : null );
		
		if (inputStream != null)
		{
			Conf conf = new Conf(context, inputStream, confPath, confUrlStr, false);
			checkConf(conf);
		}
	}
}