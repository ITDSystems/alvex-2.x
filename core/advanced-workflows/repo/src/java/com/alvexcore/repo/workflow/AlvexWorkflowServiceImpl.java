/*
 * Copyright (C) 2013 ITD Systems.
 *
 * This file is part of Alvex
 *
 * Alvex is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Alvex is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Alvex. If not, see <http://www.gnu.org/licenses/>.
 */

package com.alvexcore.repo.workflow;

import java.io.InputStream;
import java.io.Serializable;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.Iterator;

import org.alfresco.model.ContentModel;
import org.alfresco.model.WCMModel;
import org.alfresco.repo.avm.AVMNodeConverter;
import org.alfresco.service.ServiceRegistry;
import org.alfresco.service.cmr.avmsync.AVMDifference;
import org.alfresco.service.cmr.avmsync.AVMSyncService;
import org.alfresco.service.cmr.dictionary.DictionaryService;
import org.alfresco.service.cmr.repository.ChildAssociationRef;
import org.alfresco.service.cmr.repository.ContentReader;
import org.alfresco.service.cmr.repository.ContentService;
import org.alfresco.service.cmr.repository.NodeRef;
import org.alfresco.service.cmr.repository.NodeService;
import org.alfresco.service.cmr.repository.StoreRef;
import org.alfresco.service.cmr.security.AuthorityService;
import org.alfresco.service.cmr.security.AuthorityType;
import org.alfresco.service.cmr.workflow.WorkflowAdminService;
import org.alfresco.service.cmr.workflow.WorkflowDefinition;
import org.alfresco.service.cmr.workflow.WorkflowDeployment;
import org.alfresco.service.cmr.workflow.WorkflowException;
import org.alfresco.service.cmr.workflow.WorkflowInstance;
import org.alfresco.service.cmr.workflow.WorkflowInstanceQuery;
import org.alfresco.service.cmr.workflow.WorkflowPath;
import org.alfresco.service.cmr.workflow.WorkflowService;
import org.alfresco.service.cmr.workflow.WorkflowTask;
import org.alfresco.service.cmr.workflow.WorkflowTaskDefinition;
import org.alfresco.service.cmr.workflow.WorkflowTaskQuery;
import org.alfresco.service.cmr.workflow.WorkflowTaskState;
import org.alfresco.service.cmr.workflow.WorkflowTimer;
import org.alfresco.service.namespace.QName;
import org.alfresco.util.collections.CollectionUtils;
import org.alfresco.util.collections.Function;
import org.apache.commons.logging.Log;
import org.apache.commons.logging.LogFactory;

import org.alfresco.repo.workflow.BPMEngineRegistry;
import org.alfresco.repo.workflow.WorkflowModel;
import org.alfresco.repo.workflow.WorkflowPackageComponent;
import org.alfresco.repo.workflow.WorkflowServiceImpl;

import org.alfresco.service.cmr.security.PersonService;
import org.alfresco.service.cmr.security.AuthorityService;
import org.alfresco.repo.security.authentication.AuthenticationUtil;
import org.alfresco.repo.security.authentication.AuthenticationUtil.RunAsWork;

import com.alvexcore.repo.orgchart.OrgchartPerson;
import com.alvexcore.repo.orgchart.OrgchartService;
import com.alvexcore.repo.orgchart.OrgchartUnit;
import java.util.HashMap;


/* TODO
 * Helper class below is copied from WorkflowHelper.
 * Refactoring required here.
 */
class canReassignTask implements RunAsWork<Boolean>
{
	private ServiceRegistry serviceRegistry;
	private OrgchartService orgchartService;
	private WorkflowTask wt;
	private String userName;
	
	public canReassignTask(ServiceRegistry serviceRegistry, 
			OrgchartService orgchartService, WorkflowTask wt, String userName)
	{
		this.serviceRegistry = serviceRegistry;
		this.orgchartService = orgchartService;
		this.wt = wt;
		this.userName = userName;
	}
	
	private NodeRef getUserGroupRef(Object o)
	{
		PersonService personService = serviceRegistry.getPersonService();
		AuthorityService authorityService = serviceRegistry.getAuthorityService();
		NodeRef result = null;
		if (o == null || o instanceof NodeRef) {
			result = (NodeRef) o;
		} else {
			try {
				result = personService.getPerson(o.toString());
			} catch (Exception e) {
				try {
					result = authorityService.getAuthorityNodeRef(o.toString());
				} catch (Exception e1) {
					// do nothing
				}
			}
		}
		return result;
	}
	
	private Collection<NodeRef> getUserGroupRefs(Object o)
	{
		List<NodeRef> result = new ArrayList<NodeRef>();
		if (o != null && o instanceof Collection) {
			for (Iterator<?> it = ((Collection<?>) o).iterator(); it.hasNext();) {
				result.add(getUserGroupRef(it.next()));
			}
		}
		return result;
	}
	
	private boolean isInitiatorOrAssigneeOrManager(WorkflowTask wt, String userName)
	{
		if (wt == null) {
			return true;
		}
		
		PersonService personService = serviceRegistry.getPersonService();
		AuthorityService authorityService = serviceRegistry.getAuthorityService();

		NodeRef person = personService.getPerson(userName);
		Map<QName, Serializable> props = wt.getProperties();

		String ownerName = (String) props.get(ContentModel.PROP_OWNER);
		if (userName != null && userName.equalsIgnoreCase(ownerName)) {
			return true;
		}
		
		List<NodeRef> accessUseres = new ArrayList<NodeRef>();
		accessUseres.add(getUserGroupRef(props.get(WorkflowModel.ASSOC_ASSIGNEE)));
		accessUseres.add(getUserGroupRef(props.get(WorkflowModel.ASSOC_GROUP_ASSIGNEE)));
		accessUseres.addAll(getUserGroupRefs(props.get(WorkflowModel.ASSOC_GROUP_ASSIGNEES)));
		accessUseres.addAll(getUserGroupRefs(props.get(WorkflowModel.ASSOC_ASSIGNEES)));
		accessUseres.addAll(getUserGroupRefs(wt.getProperties().get(WorkflowModel.ASSOC_POOLED_ACTORS)));
		accessUseres.add(wt.getPath().getInstance().getInitiator());

		if (accessUseres.contains(person)) {
			return true;
		}

		Set<String> userGroups = authorityService.getAuthoritiesForUser(userName);
		for (String groupName : userGroups) {
			NodeRef groupRef = authorityService.getAuthorityNodeRef(groupName);
			if (groupRef != null && accessUseres.contains(groupRef)) {
				return true;
			}
		}
		
		// Orgchart related operations
		if(userName != null)
		{
			OrgchartPerson oUser = orgchartService.getPerson(userName);
			List<OrgchartUnit> units = orgchartService.getSupervisioningUnitsForPerson(oUser);
			for (OrgchartUnit unit: units)
			{
				List<OrgchartPerson> managees = orgchartService.getUnitMembers(unit);
				for (OrgchartPerson managee : managees)
				{
					if(managee.getName().equalsIgnoreCase(ownerName))
						return true;
					NodeRef manageeRef = managee.getNode();
					if(accessUseres.contains(manageeRef))
						return true;
				}
			}
		}

		return false;
	}
	
	@Override
	public Boolean doWork() throws Exception {
		return isInitiatorOrAssigneeOrManager(wt, userName);
	}
}


public class AlvexWorkflowServiceImpl extends WorkflowServiceImpl
{
    // Dependent services
    private ServiceRegistry serviceRegistry;
	private OrgchartService orgchartService;

    /**
     * Sets the Service Registry
     * 
     * @param serviceRegistry
     */
    public void setServiceRegistry(ServiceRegistry serviceRegistry)
    {
        this.serviceRegistry = serviceRegistry;
    }

    /*
     * @see org.alfresco.service.cmr.workflow.WorkflowService#isTaskEditable(org.alfresco.service.cmr.workflow.WorkflowTask, java.lang.String)
     */
    public boolean isTaskEditable(WorkflowTask task, String username)
    {
        task = getTaskById(task.getId()); // Refresh the task.
        
        // if the task is complete it is not editable
        if (task.getState() == WorkflowTaskState.COMPLETED)
        {
            return false;
        }

        Map<QName, Serializable> props = task.getProperties();
        String ownerName = (String) props.get(ContentModel.PROP_OWNER);
        boolean canModify = ( username != null && username.equalsIgnoreCase(ownerName) );
        if (canModify || isAdminUser(username))
        {
            return true;
        }
        
        if (task.getProperties().get(ContentModel.PROP_OWNER) == null)
        {
            // if the user is not the owner or initiator check whether they are
            // a member of the pooled actors for the task (if it has any)
            return isUserInPooledActors(task, username);
        }
        else
        {
            // if the task has an owner and the user is not the owner
            // or the initiator do not allow editing
            return false;
        }
    }
    
    /*
     * @see org.alfresco.service.cmr.workflow.WorkflowService#isTaskReassignable(org.alfresco.service.cmr.workflow.WorkflowTask, java.lang.String)
     */
    public boolean isTaskReassignable(WorkflowTask task, String username)
    {
        task = getTaskById(task.getId()); // Refresh the task.
        
        // if the task is complete it is not reassignable
        if (task.getState() == WorkflowTaskState.COMPLETED)
        {
            return false;
        }
        
        // if a task does not have an owner it can not be reassigned
        if (task.getProperties().get(ContentModel.PROP_OWNER) == null)
        {
            return false;
        }
        
        // if the task has the 'reassignable' property set to false it can not be reassigned
        Map<QName, Serializable> properties = task.getProperties();
        Boolean reassignable = (Boolean)properties.get(WorkflowModel.PROP_REASSIGNABLE);
        if (reassignable != null && reassignable.booleanValue() == false)
        {
            return false;
        }
        
        // if the task has pooled actors and an owner it can not be reassigned (it must be released)
        Collection<?> actors = (Collection<?>) properties.get(WorkflowModel.ASSOC_POOLED_ACTORS);
        String owner = (String)properties.get(ContentModel.PROP_OWNER);
        if (actors != null && !actors.isEmpty() && owner != null)
        {
            return false;
        }

        RunAsWork<Boolean> work = new canReassignTask(serviceRegistry, orgchartService, task, username);
        boolean canReassign = AuthenticationUtil.runAsSystem(work);
        if (canReassign || isAdminUser(username))
        {
            return true;
        }
        
        return false;
    }

    /*
     * @see org.alfresco.service.cmr.workflow.WorkflowService#isTaskClaimable(org.alfresco.service.cmr.workflow.WorkflowTask, java.lang.String)
     */
    public boolean isTaskClaimable(WorkflowTask task, String username)
    {
        return isTaskClaimable(task, username, true);
    }
    
    /*
     * @see org.alfresco.service.cmr.workflow.WorkflowService#isTaskClaimable(org.alfresco.service.cmr.workflow.WorkflowTask, java.lang.String, boolean)
     */
    public boolean isTaskClaimable(WorkflowTask task, String username, boolean refreshTask)
    {
        task = getTaskById(task.getId()); // Refresh the task.
        
        // if the task is complete it is not claimable
        if (task.getState() == WorkflowTaskState.COMPLETED)
        {
            return false;
        }
        
        // if the task has an owner it can not be claimed
        if (task.getProperties().get(ContentModel.PROP_OWNER) != null)
        {
            return false;
        }
        
        // a task can only be claimed if the user is a member of
        // of the pooled actors for the task
        return isUserInPooledActors(task, username);
    }

    /*
     * @see org.alfresco.service.cmr.workflow.WorkflowService#isTaskReleasable(org.alfresco.service.cmr.workflow.WorkflowTask, java.lang.String)
     */
    public boolean isTaskReleasable(WorkflowTask task, String username)
    {
        return isTaskReleasable(task, username, true);
    }
    
    /*
     * @see org.alfresco.service.cmr.workflow.WorkflowService#isTaskReleasable(org.alfresco.service.cmr.workflow.WorkflowTask, java.lang.String, boolean)
     */
    public boolean isTaskReleasable(WorkflowTask task, String username, boolean refreshTask)
    {
        task = getTaskById(task.getId()); // Refresh the task.
        
        // if the task is complete it is not releasable
        if (task.getState() == WorkflowTaskState.COMPLETED)
        {
            return false;
        }
        
        // if the task doesn't have pooled actors it is not releasable
        Map<QName, Serializable> properties = task.getProperties();
        Collection<?> actors = (Collection<?>) properties.get(WorkflowModel.ASSOC_POOLED_ACTORS);
        if (actors == null || actors.isEmpty())
        {
            return false;
        }
        
        // if the task does not have an owner it is not releasable
        String owner = (String)properties.get(ContentModel.PROP_OWNER);
        if (owner == null)
        {
            return false;
        }

        if (isUserOwnerOrInitiator(task, username) || isAdminUser(username))
        {
            // releasable if the current user is the task owner or initiator
            return true;
        }
        
        return false;
    }

    /**
     * Determines if the given user is the owner of the given task or
     * the initiator of the workflow the task is part of
     * 
     * @param task The task to check
     * @param username The username to check
     * @return true if the user is the owner or the workflow initiator
     */
    private boolean isUserOwnerOrInitiator(WorkflowTask task, String username)
    {
        boolean result = false;
        String owner = (String)task.getProperties().get(ContentModel.PROP_OWNER);

        if (username.equals(owner))
        {
            // user owns the task
            result = true;
        }
        else if (username.equals(getWorkflowInitiatorUsername(task)))
        {
            // user is the workflow initiator
            result = true;
        }
        
        return result;
    }
    
    /**
     * Returns the username of the user that initiated the workflow the
     * given task is part of.
     * 
     * @param task The task to get the workflow initiator for
     * @return Username or null if the initiator could not be found
     */
    private String getWorkflowInitiatorUsername(WorkflowTask task)
    {
        NodeService nodeService = this.serviceRegistry.getNodeService();
        String initiator = null;
        
        NodeRef initiatorRef = task.getPath().getInstance().getInitiator();
        
        if (initiatorRef != null && nodeService.exists(initiatorRef))
        {
            initiator = (String)nodeService.getProperty(initiatorRef, ContentModel.PROP_USERNAME);
        }
        
        return initiator;
    }

    /**
     * Determines if the given user is a member of the pooled actors assigned to the task
     * 
     * @param task The task instance to check
     * @param username The username to check
     * @return true if the user is a pooled actor, false otherwise
     */
    @SuppressWarnings("unchecked")
    private boolean isUserInPooledActors(WorkflowTask task, String username)
    {
        NodeService nodeService = this.serviceRegistry.getNodeService();
        DictionaryService dictionaryService = this.serviceRegistry.getDictionaryService();
        // Get the pooled actors
        Collection<NodeRef> actors = (Collection<NodeRef>)task.getProperties().get(WorkflowModel.ASSOC_POOLED_ACTORS);
        if (actors != null)
        {
            for (NodeRef actor : actors)
            {
                QName type = nodeService.getType(actor);
                if (dictionaryService.isSubClass(type, ContentModel.TYPE_PERSON))
                {
                    Serializable name = nodeService.getProperty(actor, ContentModel.PROP_USERNAME);
                    if(name!=null && name.equals(username))
                    {
                        return true;
                    }
                }
                else if (dictionaryService.isSubClass(type, ContentModel.TYPE_AUTHORITY_CONTAINER))
                {
                    if (isUserInGroup(username, actor))
                    {
                        // The user is a member of the group
                        return true;
                    }
                }
            }
        }
        return false;
    }

    private boolean isUserInGroup(String username, NodeRef group)
    {
        NodeService nodeService = this.serviceRegistry.getNodeService();
        AuthorityService authorityService = this.serviceRegistry.getAuthorityService();
        // Get the group name
        String name = (String)nodeService.getProperty(group, ContentModel.PROP_AUTHORITY_NAME);

        // Get all group members
        Set<String> groupMembers = authorityService.getContainedAuthorities(AuthorityType.USER, name, false);

        // Chekc if the user is a group member.
        return groupMembers != null && groupMembers.contains(username);
    }
    
    /**
     * Determines if the given user is admin user with privileged access
     *
     * @param username The username to check
     * @return true if the user is admin user
     */
    private boolean isAdminUser(String username)
    {
        return username.equals("admin");
    }
	
	public void setOrgchartService(OrgchartService orgchartService)
	{
		this.orgchartService = orgchartService;
	}
}