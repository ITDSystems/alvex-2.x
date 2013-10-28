package com.alvexcore.repo.tools;

import org.alfresco.repo.jscript.BaseScopableProcessorExtension;
import org.alfresco.repo.jscript.ScriptNode;
import org.alfresco.service.cmr.repository.NodeRef;
import org.springframework.beans.factory.annotation.Required;

public class JscriptCalendarHelper extends BaseScopableProcessorExtension {
	
	private CalendarHelper calendarHelper;

	@Required
	public void setCalendarHelper(CalendarHelper calendarHelper) {
		this.calendarHelper = calendarHelper;
	}
	
	public ScriptNode createEvent(String siteShortName, String eventName, String when)
	{
		NodeRef ref = calendarHelper.createEvent(siteShortName, eventName, when);
		return new ScriptNode( ref, calendarHelper.getServiceRegistry() );
	}

}
