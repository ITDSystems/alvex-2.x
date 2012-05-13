<#--escape x as x?xml-->
<html>
	<#if message?has_content>
	<b>${message}</b>
	<#else>
		<#list updates as update>
		<div>
		id: ${update.extensionId}<br/>
		repo-version: ${update.repoVersion} <br/>
		share-version: ${update.shareVersion} <br/>
		repo-latest-version: ${update.repoLatestVersion} <br/>
		share-latest-version: ${update.shareLatestVersion} <br/>
		repoFiles: <br/>
		<div>
		<#list update.repoFiles as fileEntry>
		${fileEntry.file} — ${fileEntry.status?string("ok", "err")} <br/>
		</#list>
		</div>
		shareFiles: <br/>
		<div>
		<#list update.shareFiles as fileEntry>
		${fileEntry.file} — ${fileEntry.status?string("ok", "err")} <br/>
		</#list>
		</div>
		</div>
		motd: ${update.motd}
		</#list>
	</#if>
<html>
<#--/#escape-->	
