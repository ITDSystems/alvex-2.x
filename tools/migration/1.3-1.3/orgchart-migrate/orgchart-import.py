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

imported = dict()

def importUnits() :
	headers = {'Content-type': 'application/json'}
	units = sorted(os.listdir("units"))
	unitId = ''
	for unit in units :
		filename = "units/" + unit
		f = open(filename, 'r')
		unitJSON = json.load(f)
		f.close()
		print("Importing unit " + unitJSON['displayName'])
		if( unitJSON['parent'] != "" ) :
			gid = imported[ unitJSON['parent'] ]
			url = SERVICE_URL+"/api/alvex/orgchart/units/"+gid
			data = json.dumps({
					'data': {'name': unitJSON['name'], 'displayName': unitJSON['displayName'], 'weight': unitJSON['weight'] }
				})
			r = requests.put(url, data, headers=headers, auth=(USER, PASSWORD))
			imported[ unitJSON['name'] ] = unitId = r.json()['data']['id']
		else :
			url = SERVICE_URL+"/api/alvex/orgchart/branches/default"
			data = json.dumps({ 
					'data': {'name': unitJSON['name'], 'displayName': unitJSON['displayName'], 'weight': unitJSON['weight'] } 
				})
			r = requests.put(url, data, headers=headers, auth=(USER, PASSWORD))
			imported[ unitJSON['name'] ] = unitId = r.json()['data']['id']
		for roleInst in unitJSON['roleInst'] :
			url = SERVICE_URL+"/api/alvex/orgchart/units/"+unitId+"/roles/"+roleInst['name']
			data = json.dumps( {} )
			r = requests.put(url, data, headers=headers, auth=(USER, PASSWORD))
		for admin in unitJSON['admins'] :
			url = SERVICE_URL+"/api/alvex/orgchart/units/"+unitId+"/admins"
			data = json.dumps( { "data": { "logins": admin['user'] } } )
			r = requests.put(url, data, headers=headers, auth=(USER, PASSWORD))
		for sup in unitJSON['supervisors'] :
			url = SERVICE_URL+"/api/alvex/orgchart/units/"+unitId+"/supervisors"
			data = json.dumps( { "data": { "logins": sup['user'] } } )
			r = requests.put(url, data, headers=headers, auth=(USER, PASSWORD))
		for role in unitJSON['roles'] :
			data = json.dumps( { "data": { "logins": role['user'] } } )
			if( role['role'] != "" ) :
				url = SERVICE_URL+"/api/alvex/orgchart/units/"+unitId+"/roles/"+role['role']+"/members"
				r = requests.put(url, data, headers=headers, auth=(USER, PASSWORD))
			url = SERVICE_URL+"/api/alvex/orgchart/units/"+unitId+"/members"
			r = requests.put(url, data, headers=headers, auth=(USER, PASSWORD))
				

def importRoles() :
	print("Importing roles")
	headers = {'Content-type': 'application/json'}
	roles = sorted(os.listdir("roles"))
	for role in roles :
		filename = "roles/" + role
		f = open(filename, 'r')
		roleJSON = json.load(f)
		f.close()
		req = { "data": {} }
		req['data'] = { "displayName": roleJSON['displayName'], "weight": str(roleJSON['weight']) }
		data = json.dumps( req )
		url = SERVICE_URL+"/api/alvex/orgchart/role-definitions/"+roleJSON['name']
		r = requests.put(url, data, headers=headers, auth=(USER, PASSWORD))

for server in SERVERS:
	SERVICE_URL = server['url']
	USER = server['user']
	PASSWORD = server['password']

	print("Working with server: " + SERVICE_URL)

	importRoles()
	importUnits()
