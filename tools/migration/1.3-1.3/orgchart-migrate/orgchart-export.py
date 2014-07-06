import json, re, os, requests

SERVERS = [
	{
		'url': "http://alfresco:8080/alfresco/service",
		'user': "admin",
		'password': "alfresco"
	}
]

USER = ''
PASSWORD = ''
SERVICE_URL = ''

roles = []
units = []

def processUnit(json, parent) :
	print("Exporting unit: " + json['displayName'])
	# Get unit details
	url = SERVICE_URL+"/api/alvex/orgchart/units/"+json['id']
	r = requests.get(url, auth=(USER, PASSWORD))
	content = r.json()
	resp = content['data']
	unit = {"name": resp['name'], "displayName": resp['displayName'], "weight": resp['weight'], "id": json['id'], "parent": parent, 
				"roles": [], "admins": [], "supervisors": [], "roleInst": []}
	for roleInst in resp['people'] :
		role = {"role": roleInst['roleName'], "user": roleInst['userName']}
		unit['roles'].append(role)
	# Get roles attached to unit
	url = SERVICE_URL+"/api/alvex/orgchart/units/"+json['id']+"/roles"
	r = requests.get(url, auth=(USER, PASSWORD))
	content = r.json()
	resp = content['roles']
	for roleInst in resp :
		ri = {"name": roleInst['name']}
		unit['roleInst'].append(ri)
	# Get unit permissions
	url = SERVICE_URL+"/api/alvex/orgchart/units/"+json['id']+"/admins"
	r = requests.get(url, auth=(USER, PASSWORD))
	content = r.json()
	resp = content['admins']
	for admin in resp :
		user = {"user": admin['userName']}
		unit['admins'].append(user)
	url = SERVICE_URL+"/api/alvex/orgchart/units/"+json['id']+"/supervisors"
	r = requests.get(url, auth=(USER, PASSWORD))
	content = r.json()
	for sup in content['supervisors'] :
		user = {"user": sup['userName']}
		unit['supervisors'].append(user)
	# Add unit
	units.append(unit)
	for child in json['children']:
		processUnit(child, json['name'])

def exportUnits() :
	url = SERVICE_URL+"/api/alvex/orgchart/tree/default"
	r = requests.get(url, auth=(USER, PASSWORD))
	content = r.json()
	tree = content['data']
	processUnit(tree[0], '')

def writeUnits() :
	num = 0
	for unit in units :
		fileName = "units/%(num)04d-%(name)s" % {'num': num, 'name': unit['id']}
		f = open(fileName, 'w')
		f.write( json.dumps(unit, sort_keys=True, indent=2) )
		f.close()
		num = num + 1

def exportRoles() :
	print("Exporting roles")
	url = SERVICE_URL+"/api/alvex/orgchart/role-definitions"
	r = requests.get(url, auth=(USER, PASSWORD))
	content = r.json()
	for role in content['roles']:
		roles.append(role)

def writeRoles() :
	for role in roles :
		fileName = "roles/"+role['id']
		f = open(fileName, 'w')
		f.write( json.dumps(role, sort_keys=True, indent=2) )
		f.close()

def createClearDirs() :
	for d in ["roles", "units"] :
		if os.path.exists(d) :
			for f in os.listdir(d):
				os.remove(d+'/'+f)
		else :
			os.makedirs(d)


createClearDirs()

for server in SERVERS:
	SERVICE_URL = server['url']
	USER = server['user']
	PASSWORD = server['password']

	print("Working with server: " + SERVICE_URL)

	exportRoles()
	writeRoles()
	exportUnits()
	writeUnits()
