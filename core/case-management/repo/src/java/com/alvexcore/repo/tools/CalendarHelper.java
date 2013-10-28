package com.alvexcore.repo.tools;

import org.alfresco.service.ServiceRegistry;
import org.alfresco.service.cmr.repository.NodeRef;

public interface CalendarHelper {

	public abstract NodeRef createEvent(String siteShortName, String eventName, String when);

	public ServiceRegistry getServiceRegistry();
	
}
