package com.alvexcore.repo.tools;

import java.util.Date;
import org.alfresco.service.ServiceRegistry;
import org.alfresco.service.cmr.calendar.CalendarEntry;
import org.alfresco.service.cmr.calendar.CalendarEntryDTO;
import org.alfresco.service.cmr.calendar.CalendarService;
import org.alfresco.service.cmr.repository.NodeRef;
import org.alfresco.util.ISO8601DateFormat;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.beans.factory.annotation.Required;

public class CalendarHelperImpl implements InitializingBean, CalendarHelper {
	
	protected CalendarService calendarService;
	protected ServiceRegistry serviceRegistry;

	@Required
	public void setServiceRegistry(ServiceRegistry serviceRegistry) {
		this.serviceRegistry = serviceRegistry;
	}
	
	@Override
	public ServiceRegistry getServiceRegistry() {
		return serviceRegistry;
	}
	
	@Override
	public void afterPropertiesSet() throws Exception {
		calendarService = serviceRegistry.getCalendarService();
	}

	@Override
	public NodeRef createEvent(String siteShortName, String eventName, String when)
	{
		String utcMidnight = "T00:00:00Z";
		Date date = ISO8601DateFormat.parse( when.substring(0, 10) + utcMidnight );
		
		CalendarEntry entry = new CalendarEntryDTO();
		entry.setTitle(eventName);
		entry.setStart(date);
		entry.setEnd(date);
		
		entry = calendarService.createCalendarEntry(siteShortName, entry);
		return entry.getNodeRef();
	}
	
}
