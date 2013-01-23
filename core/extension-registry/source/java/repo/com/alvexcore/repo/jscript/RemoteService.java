package com.alvexcore.repo.jscript;

import org.alfresco.repo.processor.BaseProcessorExtension;
import org.springframework.extensions.webscripts.ScriptRemote;
import org.springframework.extensions.webscripts.ScriptRemoteConnector;
import org.springframework.extensions.webscripts.connector.Response;

public class RemoteService extends BaseProcessorExtension
{
	private ScriptRemote impl;

	public void setScriptRemote(final ScriptRemote impl) {
		this.impl = impl;
	}

	public ScriptRemoteConnector connect() {
		return impl.connect();
	}

	public ScriptRemoteConnector connect(String endpointId) {
		return impl.connect(endpointId);
	}

	public Response call(String uri) {
		return impl.call(uri);
	}

	public String[] getEndpointIds() {
		return impl.getEndpointIds();
	}

	public String getEndpointName(String endpointId) {
		return impl.getEndpointName(endpointId);
	}

	public String getEndpointDescription(String endpointId) {
		return impl.getEndpointDescription(endpointId);
	}

	public boolean isEndpointPersistent(String id) {
		return impl.isEndpointPersistent(id);
	}

	public String getEndpointURL(String endpointId) {
		return impl.getEndpointURL(endpointId);
	}
}
