/**
 * Copyright © 2012-2014 ITD Systems
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

package com.alvexcore.repo;

import org.alfresco.service.namespace.NamespaceService;
import org.alfresco.service.namespace.QName;

public interface AlvexContentModel {
	final static String ALVEX_MODEL_URI = "http://alvexcore.com/prefix/alvex";
	final static String ALVEXWF_MODEL_URI = "http://alvexcore.com/prefix/alvexwf";
	final static String ALVEXOC_MODEL_URI = "http://alvexcore.com/prefix/alvexoc";	
	final static String ALVEXRWF_MODEL_URI = "http://alvexcore.com/prefix/alvexrwf";
	final static String ALVEXDOCREG_MODEL_URI = "http://alvexcore.com/prefix/alvexdocreg20";
	final static String ALVEXDR_MODEL_URI = "http://alvexcore.com/prefix/alvexdr";
	final static String ALVEXDT_MODEL_URI = "http://alvexcore.com/prefix/alvexdt";
	final static String ALVEXEM_MODEL_URI = "http://alvexcore.com/prefix/alvexem";
	final static String ALVEXMD_MODEL_URI = "http://alvexcore.com/prefix/alvexmd";
	
	final static String ALVEX_MODEL_PREFIX = "alvex";
	final static String ALVEXWF_MODEL_PREFIX = "alvexwf";
	final static String ALVEXOC_MODEL_PREFIX = "alvexoc";
	final static String ALVEXRWF_MODEL_PREFIX = "alvexrwf";
	final static String ALVEXDOCREG_MODEL_PREFIX = "alvexdocreg20";
	final static String ALVEXDR_MODEL_PREFIX = "alvexdr";
	final static String ALVEXDT_MODEL_PREFIX = "alvexdt";
	final static String ALVEXMD_MODEL_PREFIX = "alvexmd";
	final static String ALVEXEM_MODEL_PREFIX = "alvexem";
	
	final static QName TYPE_EXTENSION_CONFIG = QName.createQName(ALVEX_MODEL_URI, "extensionConfig");
	final static QName TYPE_ORGCHART_UNIT = QName.createQName(ALVEXOC_MODEL_URI, "unit");
	final static QName TYPE_ORGCHART_DELEGATION = QName.createQName(ALVEXOC_MODEL_URI, "orgchartDelegation");
	final static QName TYPE_ORGCHART_UI_CONFIG = QName.createQName(ALVEXOC_MODEL_URI, "UIConfig");
	final static QName TYPE_ORGCHART_SYNC_CONFIG = QName.createQName(ALVEXOC_MODEL_URI, "syncConfig");
	final static QName TYPE_ROLE_DEF = QName.createQName(ALVEXOC_MODEL_URI, "roleDefinition");
	final static QName TYPE_ROLE_INST = QName.createQName(ALVEXOC_MODEL_URI, "roleInstance");
	final static QName TYPE_DOCUMENT_REGISTER = QName.createQName(ALVEXDR_MODEL_URI, "documentRegister");
	final static QName TYPE_DOCUMENT_REGISTER_MASTER_DATA = QName.createQName(ALVEXDR_MODEL_URI, "masterDataServiceConfig");
	final static QName TYPE_DOCUMENT_REGISTER_ITEM = QName.createQName(ALVEXDT_MODEL_URI, "object");

	final static QName TYPE_EMAIL_CONTAINER = QName.createQName(ALVEXEM_MODEL_URI, "container");
	final static QName TYPE_EMAIL_FOLDER = QName.createQName(ALVEXEM_MODEL_URI, "folder");
	final static QName TYPE_EMAIL_MESSAGE = QName.createQName(ALVEXEM_MODEL_URI, "message");
	final static QName TYPE_EMAIL_ATTACHMENT = QName.createQName(ALVEXEM_MODEL_URI, "attachment");
	final static QName TYPE_EMAIL_PROVIDER = QName.createQName(ALVEXEM_MODEL_URI, "emailProvider");
	
	final static QName TYPE_DATALIST_MASTER_DATA_SOURCE = QName.createQName(ALVEXMD_MODEL_URI, "datalistMasterDataSource");
	final static QName TYPE_REST_JSON_MASTER_DATA_SOURCE = QName.createQName(ALVEXMD_MODEL_URI, "restJsonMasterDataSource");
	final static QName TYPE_REST_XML_MASTER_DATA_SOURCE = QName.createQName(ALVEXMD_MODEL_URI, "restXmlMasterDataSource");
	final static QName TYPE_MASTER_DATA_ITEM = QName.createQName(ALVEXMD_MODEL_URI, "masterDataItem");

	final static QName ASPECT_ATTACHED_TO_REGISTRY_ITEM = QName.createQName(ALVEXDR_MODEL_URI, "attachedToRegistryItem");
	final static QName ASPECT_ORGCHART_MEMBER = QName.createQName(ALVEXOC_MODEL_URI, "orgchartMember");
	
	final static QName ASSOC_ROLE = QName.createQName(ALVEXOC_MODEL_URI, "role");
	final static QName ASSOC_ROLE_DEF = QName.createQName(ALVEXOC_MODEL_URI, "roleDefinition");
	final static QName ASSOC_SUBUNIT = QName.createQName(ALVEXOC_MODEL_URI, "subunit");
	final static QName ASSOC_MEMBER = QName.createQName(ALVEXOC_MODEL_URI, "member");
	final static QName ASSOC_ADMIN = QName.createQName(ALVEXOC_MODEL_URI, "admin");
	final static QName ASSOC_SUPERVISOR = QName.createQName(ALVEXOC_MODEL_URI, "supervisor");
	final static QName ASSOC_ROLE_MEMBER = QName.createQName(ALVEXOC_MODEL_URI, "roleMember");
	final static QName ASSOC_DELEGATION = QName.createQName(ALVEXOC_MODEL_URI, "delegation");
	final static QName ASSOC_DELEGATION_SOURCE = QName.createQName(ALVEXOC_MODEL_URI, "delegationSource");
	final static QName ASSOC_DELEGATION_TARGET = QName.createQName(ALVEXOC_MODEL_URI, "delegationTarget");
	final static QName ASSOC_DELEGATION_ROLE = QName.createQName(ALVEXOC_MODEL_URI, "delegationRole");
	final static QName ASSOC_DOCUMENTS = QName.createQName(ALVEXDOCREG_MODEL_URI, "documents");
	final static QName ASSOC_FILES = QName.createQName(ALVEXDT_MODEL_URI, "files");
	final static QName ASSOC_DOCUMENT_ASSIGNEE = QName.createQName(ALVEXDT_MODEL_URI, "assignee");
	final static QName ASSOC_PARENT_REGISTRY = QName.createQName(ALVEXDR_MODEL_URI, "parentRegister");
	final static QName ASSOC_ATTACHED_MASTER_DATA = QName.createQName(ALVEXDR_MODEL_URI, "attachedMasterData");
	final static QName ASSOC_EMAIL_ATTACHMENTS = QName.createQName(ALVEXEM_MODEL_URI, "attachments");
	final static QName ASSOC_EMAIL_PROVIDER = QName.createQName(ALVEXEM_MODEL_URI, "provider");
	final static QName ASSOC_MASTER_DATA_STORAGE = QName.createQName(ALVEXMD_MODEL_URI, "masterDataStorage");
	
	final static QName ASSOC_NAME_SYSTEM = QName.createQName(NamespaceService.SYSTEM_MODEL_1_0_URI, "system");
	final static QName ASSOC_NAME_ALVEX = QName.createQName(NamespaceService.SYSTEM_MODEL_1_0_URI, "alvex");
	final static QName ASSOC_NAME_CONFIG = QName.createQName(ALVEX_MODEL_URI, "config");
	final static QName ASSOC_NAME_DATA = QName.createQName(ALVEX_MODEL_URI, "data");
	final static QName ASSOC_NAME_EMAILS = QName.createQName(ALVEXEM_MODEL_URI, "emails");
	
	final static QName PROP_EXTENSION_VERSION = QName.createQName(ALVEX_MODEL_URI, "version");
	final static QName PROP_EXTENSION_EDITION = QName.createQName(ALVEX_MODEL_URI, "edition");
	final static QName PROP_UNIT_NAME = QName.createQName(ALVEXOC_MODEL_URI, "unitName");
	final static QName PROP_UNIT_DISPLAY_NAME = QName.createQName(ALVEXOC_MODEL_URI, "unitDisplayName");
	final static QName PROP_UNIT_WEIGHT= QName.createQName(ALVEXOC_MODEL_URI, "unitWeight");
	final static QName PROP_ROLE_NAME = QName.createQName(ALVEXOC_MODEL_URI, "roleName");
	final static QName PROP_ROLE_DISPLAY_NAME = QName.createQName(ALVEXOC_MODEL_URI, "roleDisplayName");
	final static QName PROP_ROLE_WEIGHT = QName.createQName(ALVEXOC_MODEL_URI, "roleWeight");
	final static QName PROP_GROUP_NAME= QName.createQName(ALVEXOC_MODEL_URI, "groupName");
	final static QName PROP_ROLE_GROUP_NAME= QName.createQName(ALVEXOC_MODEL_URI, "roleGroupName");
	final static QName PROP_OUT_OF_OFFICE = QName.createQName(ALVEXOC_MODEL_URI, "outOfOffice");
	final static QName PROP_REGISTRY_INC_COUNTER = QName.createQName(ALVEXDR_MODEL_URI, "inc");
	final static QName PROP_REGISTRY_DAY_INC_COUNTER = QName.createQName(ALVEXDR_MODEL_URI, "dayInc");
	final static QName PROP_REGISTRY_MONTH_INC_COUNTER = QName.createQName(ALVEXDR_MODEL_URI, "monthInc");
	final static QName PROP_REGISTRY_QUARTER_INC_COUNTER = QName.createQName(ALVEXDR_MODEL_URI, "quarterInc");
	final static QName PROP_REGISTRY_YEAR_INC_COUNTER = QName.createQName(ALVEXDR_MODEL_URI, "yearInc");
	final static QName PROP_REGISTRY_ID_FORMAT = QName.createQName(ALVEXDR_MODEL_URI, "idFormat");
	final static QName PROP_REGISTRY_CREATE_ID_MODE = QName.createQName(ALVEXDR_MODEL_URI, "createIdMode");
	final static QName PROP_REGISTRY_ALLOW_ID_EDIT = QName.createQName(ALVEXDR_MODEL_URI, "allowIdEdit");
	final static QName PROP_REGISTRY_MASTER_DATA_TARGET_FIELD = QName.createQName(ALVEXDR_MODEL_URI, "masterDataTargetField");
	final static QName PROP_REGISTRY_MASTER_DATA_DATASOURCE_NAME = QName.createQName(ALVEXDR_MODEL_URI, "masterDataDataSourceName");
	final static QName PROP_DOCUMENT_STATUS = QName.createQName(ALVEXDT_MODEL_URI, "status");
	final static QName PROP_DOCUMENT_ID = QName.createQName(ALVEXDT_MODEL_URI, "id");
	final static QName PROP_RELATED_WORKFLOWS = QName.createQName(ALVEXRWF_MODEL_URI, "relatedWorkflows");
	final static QName PROP_EMAIL_FROM = QName.createQName(ALVEXEM_MODEL_URI, "from");
	final static QName PROP_EMAIL_TO = QName.createQName(ALVEXEM_MODEL_URI, "to");
	final static QName PROP_EMAIL_CC = QName.createQName(ALVEXEM_MODEL_URI, "cc");
	final static QName PROP_EMAIL_SUBJECT = QName.createQName(ALVEXEM_MODEL_URI, "subject");
	final static QName PROP_EMAIL_SENT_DATE = QName.createQName(ALVEXEM_MODEL_URI, "sentDate");
	final static QName PROP_EMAIL_ENCODING = QName.createQName(ALVEXEM_MODEL_URI, "encoding");
	final static QName PROP_EMAIL_IN_REPLY_TO = QName.createQName(ALVEXEM_MODEL_URI, "inReplyTo");
	final static QName PROP_EMAIL_ID = QName.createQName(ALVEXEM_MODEL_URI, "id");
	final static QName PROP_EMAIL_UID = QName.createQName(ALVEXEM_MODEL_URI, "uid");
	final static QName PROP_EMAIL_CONFIG_USERNAME = QName.createQName(ALVEXEM_MODEL_URI, "username");
	final static QName PROP_EMAIL_CONFIG_PASSWORD = QName.createQName(ALVEXEM_MODEL_URI, "password");
	final static QName PROP_EMAIL_FOLDER_FETCH_ACTIVE = QName.createQName(ALVEXEM_MODEL_URI, "fetchActive");
	final static QName PROP_EMAIL_REAL_NAME = QName.createQName(ALVEXEM_MODEL_URI, "realName");
	final static QName PROP_EMAIL_CONFIG_REAL_NAME = QName.createQName(ALVEXEM_MODEL_URI, "userRealName");
	final static QName PROP_EMAIL_CONFIG_ADDRESS = QName.createQName(ALVEXEM_MODEL_URI, "address");
	final static QName PROP_EMAIL_PROVIDER_INCOMING_PROTO = QName.createQName(ALVEXEM_MODEL_URI, "incomingProto");
	final static QName PROP_EMAIL_PROVIDER_INCOMING_SERVER = QName.createQName(ALVEXEM_MODEL_URI, "incomingServer");
	final static QName PROP_EMAIL_PROVIDER_INCOMING_PORT = QName.createQName(ALVEXEM_MODEL_URI, "incomingPort");
	final static QName PROP_EMAIL_PROVIDER_OUTGOING_PROTO = QName.createQName(ALVEXEM_MODEL_URI, "outgoingProto");
	final static QName PROP_EMAIL_PROVIDER_OUTGOING_SERVER = QName.createQName(ALVEXEM_MODEL_URI, "outgoingServer");
	final static QName PROP_EMAIL_PROVIDER_OUTGOING_PORT = QName.createQName(ALVEXEM_MODEL_URI, "outgoingPort");
	final static QName PROP_MASTER_DATA_SOURCE_TYPE = QName.createQName(ALVEXMD_MODEL_URI, "sourceType");
	final static QName PROP_MASTER_DATA_DATALIST_COLUMN_VALUE = QName.createQName(ALVEXMD_MODEL_URI, "datalistColumnValueField");
	final static QName PROP_MASTER_DATA_DATALIST_COLUMN_LABEL = QName.createQName(ALVEXMD_MODEL_URI, "datalistColumnLabelField");
	final static QName PROP_MASTER_DATA_REST_URL = QName.createQName(ALVEXMD_MODEL_URI, "masterDataURL");
	final static QName PROP_MASTER_DATA_REST_CACHE_MODE = QName.createQName(ALVEXMD_MODEL_URI, "caching");
	final static QName PROP_MASTER_DATA_JSON_ROOT_QUERY = QName.createQName(ALVEXMD_MODEL_URI, "dataRootJsonQuery");
	final static QName PROP_MASTER_DATA_JSON_VALUE_FIELD = QName.createQName(ALVEXMD_MODEL_URI, "valueJsonField");
	final static QName PROP_MASTER_DATA_JSON_LABEL_FIELD = QName.createQName(ALVEXMD_MODEL_URI, "labelJsonField");
	final static QName PROP_MASTER_DATA_XPATH_ROOT_QUERY = QName.createQName(ALVEXMD_MODEL_URI, "dataRootXpathQuery");
	final static QName PROP_MASTER_DATA_XPATH_VALUE = QName.createQName(ALVEXMD_MODEL_URI, "valueXpath");
	final static QName PROP_MASTER_DATA_XPATH_LABEL = QName.createQName(ALVEXMD_MODEL_URI, "labelXpath");
	
	final static String DOCUMENT_STATUS_NOT_STARTED = "notStarted";
	final static String DOCUMENT_STATUS_IN_PROGRESS = "inProgress";
	final static String DOCUMENT_STATUS_COMPLETED = "completed";
	
	final static String MASTERDATA_TYPE_DATALIST = "datalist";
	final static String MASTERDATA_TYPE_REST_JSON = "restJSON";
	final static String MASTERDATA_TYPE_REST_XML = "restXML";
}
