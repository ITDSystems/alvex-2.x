(function() {
	var nodeRef = search.xpathSearch('/sys:system/sys:alvex/alvex:data/alvex:workflows-discussions')[0].nodeRef;
	model.container = {
			protocol: nodeRef.storeRef.protocol,
			storeId: nodeRef.storeRef.identifier,
			nodeId: nodeRef.id
	};
})();