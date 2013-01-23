import json, re, os, requests

SERVICE_URL = "http://alfresco:8080/share/proxy/alfresco";
USER = 'admin'
PASSWORD = 'admin'

imported = dict()

def importUnits():
	headers = {'Content-type': 'application/json'}

	groups = sorted(os.listdir("groups"))
	for group in groups:
		print("Processing " + group)
		filename = "groups/" + group
		f = open(filename, 'r')
		groupJSON = json.load(f)
		f.close()
		if( groupJSON['parent'] != "__orgstruct__" ) :
			gid = imported[ groupJSON['parent'] ]
			url = SERVICE_URL+"/api/alvex/orgchart/units/"+gid
			data = json.dumps({ 'data': {'name': groupJSON['name'], 'displayName': groupJSON['name'], 'weight': '1' } })
			r = requests.put(url, data, headers=headers, auth=(USER, PASSWORD))
			imported[ groupJSON['id'] ] = r.json['data']['id']
		else :
			url = SERVICE_URL+"/api/alvex/orgchart/branches/default"
			data = json.dumps({ 'data': {'name': groupJSON['name'], 'displayName': groupJSON['name'], 'weight': '1' } })
			r = requests.put(url, data, headers=headers, auth=(USER, PASSWORD))
			imported[ groupJSON['id'] ] = r.json['data']['id']


def importMembers():
	headers = {'Content-type': 'application/json'}

	groups = sorted(os.listdir("members"))
	for group in groups:
		if group != '__orgstruct__':
			print("Processing members for" + group)
			gid = imported[ group ]
			filename = "members/" + group
			f = open(filename, 'r')
			members = f.readlines()
			f.close()
			for member in members:
				name = member.rstrip()
				url = SERVICE_URL+"/api/alvex/orgchart/units/" + gid + "/members"
				data = json.dumps({ 'data': {'logins':name} })
				r = requests.put(url, data, headers=headers, auth=(USER, PASSWORD))


importUnits()
importMembers()
