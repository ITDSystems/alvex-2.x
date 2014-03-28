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

import java.io.OutputStreamWriter;
import java.net.URL;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.net.ssl.HostnameVerifier;
import javax.net.ssl.HttpsURLConnection;
import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLSession;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;
import javax.xml.xpath.XPath;
import javax.xml.xpath.XPathConstants;
import javax.xml.xpath.XPathFactory;

import org.springframework.beans.factory.InitializingBean;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

import org.springframework.extensions.surf.support.ThreadLocalRequestContext;
import org.springframework.extensions.surf.RequestContext;
import org.springframework.extensions.webscripts.connector.Connector;
import org.springframework.extensions.webscripts.Status;
import org.springframework.extensions.webscripts.connector.Response;

/**
 * Share extension registry implementation
 * 
 * 
 */

public class ShareExtensionRegistry implements InitializingBean
{
	public static final String EDITION_CE = "Community";
	public static final String EDITION_EE = "Enterprise";
	
	private static final String JSON_PROP_EDITION = "edition";
	
	private DocumentBuilder xmlBuilder;
	// list of extensions
	protected List<ShareExtension> extensions = new ArrayList<ShareExtension>();
	protected String edition = null;

	@Override
	public void afterPropertiesSet() throws Exception {
		// disable SSL certs validation
		// Create a trust manager that does not validate certificate chains
		TrustManager[] trustAllCerts = new TrustManager[] { new X509TrustManager() {
			@Override
			public java.security.cert.X509Certificate[] getAcceptedIssuers() {
				return null;
			}

			@Override
			public void checkClientTrusted(
					java.security.cert.X509Certificate[] certs, String authType) {
			}

			@Override
			public void checkServerTrusted(
					java.security.cert.X509Certificate[] certs, String authType) {
			}
		} };

		SSLContext sc = SSLContext.getInstance("SSL");
		sc.init(null, trustAllCerts, new java.security.SecureRandom());
		HttpsURLConnection.setDefaultSSLSocketFactory(sc.getSocketFactory());
	}

	// submits install information to server
	// returns the newest versions of installed extensions
	public ExtensionUpdateInfo checkForUpdates(String extensionId,
			String shareId, Map<String, String> shareHashes,
			String shareVersion, String repoId, Map<String, String> repoHashes,
			String repoVersion, String licenseId) throws Exception {
		// search for extension
		DocumentBuilderFactory xmlFact = DocumentBuilderFactory.newInstance();
		xmlFact.setNamespaceAware(true);
		xmlBuilder = xmlFact.newDocumentBuilder();

		// build query
		Document queryXML = xmlBuilder.newDocument();
		Element rootElement = queryXML.createElement("extension");
		queryXML.appendChild(rootElement);
		Element el = queryXML.createElement("license-id");
		el.appendChild(queryXML.createTextNode(licenseId));
		rootElement.appendChild(el);
		el = queryXML.createElement("id");
		el.appendChild(queryXML.createTextNode(extensionId));
		rootElement.appendChild(el);
		el = queryXML.createElement("share-version");
		el.appendChild(queryXML.createTextNode(shareVersion));
		rootElement.appendChild(el);
		el = queryXML.createElement("repo-version");
		el.appendChild(queryXML.createTextNode(repoVersion));
		rootElement.appendChild(el);
		el = queryXML.createElement("share-id");
		el.appendChild(queryXML.createTextNode(shareId));
		rootElement.appendChild(el);
		el = queryXML.createElement("repo-id");
		el.appendChild(queryXML.createTextNode(repoId));
		rootElement.appendChild(el);
		el = queryXML.createElement("share-files");
		rootElement.appendChild(el);
		for (String fileName : shareHashes.keySet()) {
			Element fileElem = queryXML.createElement("file");
			fileElem.setAttribute("md5hash", shareHashes.get(fileName));
			fileElem.appendChild(queryXML.createTextNode(fileName));
			el.appendChild(fileElem);
		}
		el = queryXML.createElement("repo-files");
		rootElement.appendChild(el);
		for (String fileName : repoHashes.keySet()) {
			Element fileElem = queryXML.createElement("file");
			fileElem.setAttribute("md5hash", repoHashes.get(fileName));
			fileElem.appendChild(queryXML.createTextNode(fileName));
			el.appendChild(fileElem);
		}
		// query server
		try {
			URL url = new URL(
					"https://update.alvexhq.com:443/alfresco/s/api/alvex/extension/"
							+ extensionId + "/update");
			HttpsURLConnection conn = (HttpsURLConnection) url.openConnection();
			// disable host verification
			conn.setHostnameVerifier(new HostnameVerifier() {
				@Override
				public boolean verify(String arg0, SSLSession arg1) {
					return true;
				}
			});
			conn.setDoOutput(true);
			conn.setDoInput(true);
			conn.connect();
			OutputStreamWriter wr = new OutputStreamWriter(
					conn.getOutputStream());
			TransformerFactory.newInstance().newTransformer()
					.transform(new DOMSource(queryXML), new StreamResult(wr));
			wr.close();
			// get response
			Document responseXML = xmlBuilder.parse(conn.getInputStream());
			XPath xpath = XPathFactory.newInstance().newXPath();

			// get version
			String repoLatestVersion = ((Node) xpath.evaluate(
					"/extension/repo-version/text()", responseXML,
					XPathConstants.NODE)).getNodeValue();
			String shareLatestVersion = ((Node) xpath.evaluate(
					"/extension/share-version/text()", responseXML,
					XPathConstants.NODE)).getNodeValue();
			NodeList nl = (NodeList) xpath.evaluate(
					"/extension/repo-files/file", responseXML,
					XPathConstants.NODESET);
			Map<String, Boolean> repoFiles = new HashMap<String, Boolean>(
					nl.getLength());
			for (int i = 0; i < nl.getLength(); i++)
				repoFiles.put(
						nl.item(i).getTextContent(),
						"ok".equals(nl.item(i).getAttributes()
								.getNamedItem("status").getNodeValue()));
			nl = (NodeList) xpath.evaluate("/extension/share-files/file",
					responseXML, XPathConstants.NODESET);
			Map<String, Boolean> shareFiles = new HashMap<String, Boolean>(
					nl.getLength());
			for (int i = 0; i < nl.getLength(); i++)
				shareFiles.put(
						nl.item(i).getTextContent(),
						"ok".equals(nl.item(i).getAttributes()
								.getNamedItem("status").getNodeValue()));
			String motd = ((Node) xpath.evaluate("/extension/motd/text()",
					responseXML, XPathConstants.NODE)).getNodeValue();
			return new ExtensionUpdateInfo(extensionId, repoVersion,
					shareVersion, repoLatestVersion, shareLatestVersion,
					repoFiles, shareFiles, motd);
		} catch (Exception e) {
			return new ExtensionUpdateInfo(extensionId, repoVersion,
					shareVersion, "", "", new HashMap<String, Boolean>(),
					new HashMap<String, Boolean>(), "");
		}
	}

	// registers new extension
	public void registerExtension(ShareExtension extension) throws Exception {
		for (ShareExtension ext : extensions)
			if (ext.getId().equals(extension.getId()))
				throw new Exception("Extension " + ext.getId()
						+ " is registered already");
		// register if it's not registered yet
		extensions.add(extension);
	}

	// returns a list of installed extensions
	public List<ShareExtension> getInstalledExtensions() {
		return extensions;
	}
	
	public String getEdition() {
		if( edition == null )
			getEditionFromRepo();
		return edition;
	}
	
	protected void getEditionFromRepo()
	{
		try {
			// Get connector
			RequestContext rc = ThreadLocalRequestContext.getRequestContext();
			String userId = rc.getUserId();
			Connector conn = rc.getServiceRegistry().getConnectorService().getConnector("alfresco");

			String url = "/api/alvex/server";
			Response response = conn.call(url);
			if (Status.STATUS_OK == response.getStatus().getCode())
			{
				org.json.JSONObject scriptResponse = new org.json.JSONObject(response.getResponse());
				edition = (String) scriptResponse.get(JSON_PROP_EDITION);
			}
		} catch (Exception e) {
			edition = EDITION_CE;
		}
	}
}
