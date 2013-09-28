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