<!--[if IE]>
<iframe id="yui-history-iframe" src="${url.context}/res/yui/history/assets/blank.html"></iframe>
<![endif]-->
<input id="yui-history-field" type="hidden" />

<#assign el=args.htmlid?js_string>
<script type="text/javascript">//<![CDATA[
	new Alvex.MasterDataAdmin("${el}").setOptions({
	}).setMessages(${messages});
//]]></script>

<div id="${el}-body" class="users">
	<div id="${el}-main" class="hidden">
		<div class="title"><label>${msg("masterdata.admin.title")}</label></div>
		<div>
			<span class="yui-button yui-push-button" id="${el}-add-datalist-button">
				<span class="first-child">
					<button>${msg("masterdata.add.datalist")}</button>
				</span>
			</span>
			<span class="yui-button yui-push-button" id="${el}-add-rest-json-button">
				<span class="first-child">
					<button>${msg("masterdata.add.restjson")}</button>
				</span>
			</span>
			<span class="yui-button yui-push-button" id="${el}-add-rest-xml-button">
				<span class="first-child">
					<button>${msg("masterdata.add.restxml")}</button>
				</span>
			</span>
		</div>
		<div id="${el}-datatable"></div>
	</div>
</div>
