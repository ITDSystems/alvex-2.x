import json, re, os, requests

SERVERS = [
	{
		'url': "http://alfresco:8080/alfresco/service",
		'user': "admin",
		'password': "admin"
	}
]

USER = ''
PASSWORD = ''
SERVICE_URL = ''
groups = []

def getGroupChildren(groupName) :
	url = SERVICE_URL+"/api/groups/"+groupName+"/children?authorityType=GROUP"
	r = requests.get(url, auth=(USER, PASSWORD))
	content = r.json
	return content['data']

def getGroupMembers(groupName) :
	url = SERVICE_URL+"/api/groups/"+groupName+"/children?authorityType=USER"
	r = requests.get(url, auth=(USER, PASSWORD))
	content = r.json
	return content['data']

def processGroup(groupName, groups) :
	managers = []
	members = []

	print("Processing group: " + groupName)
	children = getGroupChildren(groupName)

	members = getGroupMembers(groupName)
	for group in children :
		if group['displayName'] == '__roles__' :
			print("Getting indirect members")
			roles = getGroupChildren(group['shortName'])
			for role in roles :
				rmembers = getGroupMembers(role['shortName'])
				for u in rmembers:
					members.append(u)

	fileName = "members/"+groupName
	f = open(fileName, 'w')
	for user in members :
		f.write(user['shortName']+"\n")
	f.close()

	for group in children :
		if group['displayName'] != '__managers__' and group['displayName'] != '__roles__' :
			unit = {"id": group['shortName'], "name": group['displayName'], "parent": groupName}
			groups.append(unit)
			processGroup(group['shortName'], groups)

def exportOrgChart() :
	processGroup("__orgstruct__", groups)

def createClearDirs() :
	for d in ["groups", "members"] :
		if os.path.exists(d) :
			for f in os.listdir(d):
				os.remove(d+'/'+f)
		else :
			os.makedirs(d)

def writeGroups() :
	num = 0;
	for group in groups :
		fileName = "groups/%(num)03d-%(name)s" % {'num': num, 'name': group['id']}
		num = num+1;
		f = open(fileName, 'w')
		f.write( json.dumps(group, sort_keys=True, indent=2) )
		f.close()


createClearDirs()

for server in SERVERS:
	SERVICE_URL = server['url']
	USER = server['user']
	PASSWORD = server['password']

	print("Working with server: " + SERVICE_URL)

	exportOrgChart()

writeGroups()
