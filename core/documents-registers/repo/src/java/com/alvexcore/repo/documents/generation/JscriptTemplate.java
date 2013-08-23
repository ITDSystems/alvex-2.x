package com.alvexcore.repo.documents.generation;

import org.alfresco.repo.jscript.BaseScopableProcessorExtension;
import org.springframework.beans.factory.annotation.Required;
import org.alfresco.service.ServiceRegistry;
import org.alfresco.repo.jscript.ScriptNode;

public class JscriptTemplate extends BaseScopableProcessorExtension {
	private TemplateService templateService;
	private ServiceRegistry serviceRegistry;

	/**
	 * Sets template service
	 * @param templateService
	 */
	@Required
	public void setTemplateService(TemplateService templateService) {
		this.templateService = templateService;
		this.serviceRegistry = templateService.getServiceRegistry();
	}

	public boolean test() throws Exception {
		return templateService.test();
	}

	public boolean generate(ScriptNode templateFile, ScriptNode targetFolder, String targetName, String data) throws Exception {
		return templateService.generate(templateFile.getNodeRef(), targetFolder.getNodeRef(), targetName, data);
	}

}
