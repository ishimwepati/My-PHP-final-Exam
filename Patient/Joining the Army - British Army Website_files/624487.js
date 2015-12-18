var flxpxlObj = (function() {
	var obj = {};

	obj.version = '7';

	obj.execute = function() {

		var bodyHTML = '';
		var bodyText = '';
		var bodyNormalized = '';
		var currentQueryTemp = '';
		var currentFunction = function(){};

		// Page group: Army Join Page
		var conditions_726671 = {};
		setTimeout(function() {
		function pageGroup_726671() {
			obj.placeAppNexusSegmentScript('seg?add=3457189&t=1', null, null, null, 'None', '');
		}
		currentFunction=function(queryId){return (function(){queryId&&(conditions_726671[queryId]=true);if(checkConditions(conditions_726671)){pageGroup_726671();}});};
		if(
			(window.location.href.indexOf('www.army.mod.uk/join/') != -1)
		) {
			if(checkConditions(conditions_726671)){pageGroup_726671();}
		}
		}, 1);

		// Page group: Army Login Page
		var conditions_726672 = {};
		setTimeout(function() {
		function pageGroup_726672() {
			obj.placeAppNexusSegmentScript('seg?add=3681866&t=1', null, null, null, 'None', '');
		}
		currentFunction=function(queryId){return (function(){queryId&&(conditions_726672[queryId]=true);if(checkConditions(conditions_726672)){pageGroup_726672();}});};
		if(
			(window.location.href.indexOf('apply.army.mod.uk/user/login?') != -1)
		) {
			if(checkConditions(conditions_726672)){pageGroup_726672();}
		}
		}, 1);

		// Page group: Army Registration Page 1
		var conditions_726673 = {};
		setTimeout(function() {
		function pageGroup_726673() {
			obj.placeAppNexusSegmentScript('seg?add=3681908&t=1', null, null, null, 'None', '');
		}
		currentFunction=function(queryId){return (function(){queryId&&(conditions_726673[queryId]=true);if(checkConditions(conditions_726673)){pageGroup_726673();}});};
		if(
			(window.location.href.indexOf('apply.army.mod.uk/user/register#1') != -1)
		) {
			if(checkConditions(conditions_726673)){pageGroup_726673();}
		}
		}, 1);

		// Page group: Army Registration Page 2
		var conditions_726674 = {};
		setTimeout(function() {
		function pageGroup_726674() {
			obj.placeAppNexusSegmentScript('seg?add=3681994&t=1', null, null, null, 'None', '');
		}
		currentFunction=function(queryId){return (function(){queryId&&(conditions_726674[queryId]=true);if(checkConditions(conditions_726674)){pageGroup_726674();}});};
		if(
			(window.location.href.indexOf('apply.army.mod.uk/user/register#2') != -1)
		) {
			if(checkConditions(conditions_726674)){pageGroup_726674();}
		}
		}, 1);

		// Page group: Army Registration Page 3
		var conditions_726675 = {};
		setTimeout(function() {
		function pageGroup_726675() {
			obj.placeAppNexusSegmentScript('seg?add=3682140&t=1', null, null, null, 'None', '');
		}
		currentFunction=function(queryId){return (function(){queryId&&(conditions_726675[queryId]=true);if(checkConditions(conditions_726675)){pageGroup_726675();}});};
		if(
			(window.location.href.indexOf('apply.army.mod.uk/user/register#3') != -1)
		) {
			if(checkConditions(conditions_726675)){pageGroup_726675();}
		}
		}, 1);

		// Page group: Army - Logged in
		var conditions_726676 = {};
		setTimeout(function() {
		function pageGroup_726676() {
			obj.placeAppNexusScript('px?id=622079&t=1', '622079');
		}
		currentFunction=function(queryId){return (function(){queryId&&(conditions_726676[queryId]=true);if(checkConditions(conditions_726676)){pageGroup_726676();}});};
		if(
			(window.location.href.indexOf('apply.army.mod.uk/dashboard') != -1)
		) {
			if(checkConditions(conditions_726676)){pageGroup_726676();}
		}
		}, 1);

		// Page group: Army Tumblr
		var conditions_726677 = {};
		setTimeout(function() {
		function pageGroup_726677() {
			obj.placeAppNexusSegmentScript('seg?add=3698960&t=1', null, null, null, 'None', '');
		}
		currentFunction=function(queryId){return (function(){queryId&&(conditions_726677[queryId]=true);if(checkConditions(conditions_726677)){pageGroup_726677();}});};
		if(
			(window.location.href.indexOf('britisharmyjobs.tumblr.com/') != -1) &&
			(window.location.href.indexOf('apply.army.mod.uk/user/login') == -1)
		) {
			if(checkConditions(conditions_726677)){pageGroup_726677();}
		}
		}, 1);

		// Page group: Been on Tumblr - partly registered
		var conditions_726678 = {};
		setTimeout(function() {
		function pageGroup_726678() {
			obj.placeAppNexusSegmentScript('seg?add=3699081&t=1', null, null, null, 'None', '');
		}
		currentFunction=function(queryId){return (function(){queryId&&(conditions_726678[queryId]=true);if(checkConditions(conditions_726678)){pageGroup_726678();}});};
		if(
			(window.location.href.indexOf('apply.army.mod.uk/user/register#3') == -1) &&
			(window.location.href.indexOf('apply.army.mod.uk/user/register#1') != -1)
		) {
			if(checkConditions(conditions_726678)){pageGroup_726678();}
		}
		}, 1);

		// Page group: Been on Tumblr - Haven’t Completed Application
		var conditions_726679 = {};
		setTimeout(function() {
		function pageGroup_726679() {
			obj.placeAppNexusSegmentScript('seg?add=3699151&t=1', null, null, null, 'None', '');
		}
		currentFunction=function(queryId){return (function(){queryId&&(conditions_726679[queryId]=true);if(checkConditions(conditions_726679)){pageGroup_726679();}});};
		if(
			(window.location.href.indexOf('apply.army.mod.uk/dashboard') != -1) &&
			(window.location.href.indexOf('/check') == -1)
		) {
			if(checkConditions(conditions_726679)){pageGroup_726679();}
		}
		}, 1);

		// Page group: Been on main site - haven't registered
		var conditions_726680 = {};
		setTimeout(function() {
		function pageGroup_726680() {
			obj.placeAppNexusSegmentScript('seg?add=3797819&t=1', null, null, null, 'None', '');
		}
		currentFunction=function(queryId){return (function(){queryId&&(conditions_726680[queryId]=true);if(checkConditions(conditions_726680)){pageGroup_726680();}});};
		if(
			(window.location.href.indexOf('apply.army.mod.uk/user/register') == -1) ||
			(window.location.href.indexOf('www.army.mod.uk/join/') == -1)
		) {
			if(checkConditions(conditions_726680)){pageGroup_726680();}
		}
		}, 1);

		// Page group: Army - Check and Send
		var conditions_726681 = {};
		setTimeout(function() {
		function pageGroup_726681() {
			obj.placeAppNexusScript('px?id=636657&t=1', '636657');
		}
		currentFunction=function(queryId){return (function(){queryId&&(conditions_726681[queryId]=true);if(checkConditions(conditions_726681)){pageGroup_726681();}});};
		if(
			(window.location.href.indexOf('/check') != -1)
		) {
			if(checkConditions(conditions_726681)){pageGroup_726681();}
		}
		}, 1);



	}; // end execute

	obj.placePixel = function(url, tagId) {
		if(tagId && tagsPlaced[tagId]) {
			return;
		} else if(tagId) {
			tagsPlaced[tagId] = 1;
		}
		var i = document.createElement("img");
		i.onload = function(){};
		i.src = obj.fixUrl((url + '')).replace('{iatRandom}', obj.randomId());
	};

	obj.placeCode = function(code, tagId) {
		if(tagId && tagsPlaced[tagId]) {
			return;
		} else if(tagId) {
			tagsPlaced[tagId] = 1;
		}
		var scriptCode = [];
		code = "" + code;
		if(code.toLowerCase().indexOf("<scr"+"ipt") > -1) {
			var d = document.createElement("div");
			d.innerHTML = "_" + code;
			var scripts = d.getElementsByTagName("script");
			for(var i=0, len=scripts.length; i < len; i++) {
				if(scripts[i].src) {
					scriptCode.push({url: scripts[i].src});
				} else {
					scriptCode.push({evalSrc: scripts[i].innerHTML});
				}
			}
			for(var j=scripts.length-1; j >= 0; j--) {
				scripts[j].parentNode.removeChild(scripts[j]);
			}
			code = d.innerHTML.substring(1);
		}
		obj.placeHtml(code);
		if(scriptCode.length) {
			 scriptsToPlace = scriptsToPlace.concat(scriptCode);
		}
		return scriptCode;
	};

	obj.placeScript = function(url, tagId) {
		if(tagId && tagsPlaced[tagId]) {
			return;
		} else if(tagId) {
			tagsPlaced[tagId] = 1;
		}
		var script = document.createElement("script");
		script.async = true;
		script.type = "text/javascript";
		script.src = obj.fixUrl(url).replace('{iatRandom}', obj.randomId());
		document.getElementsByTagName('head')[0].appendChild(script);
	};

	obj.placeHtml = function(code, tagId) {
		if(tagId && tagsPlaced[tagId]) {
			return;
		} else if(tagId) {
			tagsPlaced[tagId] = 1;
		}
		df.innerHTML += code.replace('{iatRandom}', obj.randomId());
	};

	obj.placeAppNexusScript = function(code, tagId, purchaseIntegration, scVariable) {
		code = window.location.protocol == 'https:' ? 'https://secure.adnxs.com/' + code : 'http://ib.adnxs.com/' + code;
		if(purchaseIntegration && purchaseIntegration != 'None') {
			code = code + obj.getIntegrationData(purchaseIntegration, scVariable);
		}
		obj.placeScript(code, tagId);
	};

	obj.placeAppNexusSegmentScript = function(code, tagId, purchaseIntegration, scVariable, keywordType, queryParam) {
		if(keywordType && keywordType == 'Organic') {
			if(flxKeywordHash) {
				code += '&other=' + escape(flxKeywordHash);
			}
		} else if(keywordType && keywordType == 'Custom') {
			var customKeyword = flxGetKeyword(queryParam);
			var hash = '';
			if(customKeyword) {
				hash = flxSendKeyword(customKeyword);
			}
			if(hash) {
				code += '&other=' + escape(hash);
			}
		} else if(keywordType && keywordType == 'Both') {
			var customKeyword = flxGetKeyword(queryParam);
			var hash = '';
			if(customKeyword) {
				hash = flxSendKeyword(customKeyword);
			}

			if(hash) {
				code += '&other=' + escape(hash);
			} else {
				if(flxKeywordHash) {
					code += '&other=' + escape(flxKeywordHash);
				}
			}
		}
		obj.placeAppNexusScript(code, tagId, purchaseIntegration, scVariable);
	};

	obj.getIntegrationData = function(purchaseIntegration, scVariable) {
		var ret = '';
		var orderId = '';
		var revenue = 0;
		if(purchaseIntegration == 'Google Analytics') {
			var html = document.body.innerHTML;
			//async
			if(html.indexOf('_gaq.push') != -1) {
				try {
					orderId = html.split('_addTrans')[1].split('_trackTrans')[0].split(',')[1].match(/['"].*?['"]/g)[0].replace(/['"]/g, '');
				} catch(e){};
				try {
					revenue = parseFloat(html.split('_addTrans')[1].split('_trackTrans')[0].split(',')[3].match(/['"].*?['"]/g)[0].replace(/['"]/g, ''));
				} catch(e){};
				if(!revenue) {
					try {
						revenue = parseFloat(html.split('_addTrans')[1].split('_trackTrans')[0].split(/\,\s+.*/g)[2].match(/['"].*?['"]/g)[0].replace(/['"]/g, ''));
					} catch(e){}
				}
			}

			//sync
			if(!orderId && !revenue) {
				try {
					orderId = html.split('_addTrans')[1].split('_trackTrans')[0].split(',')[0].match(/['"].*?['"]/g)[0].replace(/['"]/g, '');
				} catch(e){};
				try {
					revenue = parseFloat(html.split('_addTrans')[1].split('_trackTrans')[0].split(',')[2].match(/['"].*?['"]/g)[0].replace(/['"]/g, ''));
				} catch(e){};
			}
		} else if(purchaseIntegration == 'Adobe SiteCatalyst') {
			try {
				if(!scVariable) {
					scVariable = 's';
				}
				if(window[scVariable]) {
					orderId = window[scVariable].purchaseID;
				}
			} catch(e){};
			try {
				if(window[scVariable]) {
					var productsVar = window[scVariable].products;
					if(productsVar) {
						var products = productsVar.split(',');
						for(var i=0; i<products.length; i++) {
							var items = products[i].split(';');
							if(items.length > 3 && items[3]) {
								revenue += parseFloat(items[3], 10);
							}
						}
					}
				}
			} catch(e){};
		} else if(purchaseIntegration == 'Qubit Universal Variable') {
			try {
				if(window.universal_variable && window.universal_variable.transaction) {
					orderId = window.universal_variable.transaction.order_id;
					revenue = window.universal_variable.transaction.total;
				}
			} catch(e){}
		}

		if(orderId) {
			ret += '&order_id=' + encodeURIComponent(orderId);
		}
		if(revenue) {
			ret += '&value=' + encodeURIComponent(revenue);
		}
		return ret;
	};

	obj.randomId = function() {
		return (new Date()).getTime() + '' + (Math.random() * 1e16);
	};

	obj.fixUrl = function(url) {
		if(url.substring(0, 5) === 'http:') {
			return url;
		}
		if(url.substring(0, 6) === 'https:') {
			return url;
		}
		return "//" + url;
	};

	obj.scriptEval = function(script) {
		if (window.execScript) {
			window.execScript(script);
		} else {
			var f = function () {
				eval.call(window, script);
			};
			f();
		}
	};

	obj.placeScripts = function(scripts) {
		for(var i=0, len=scripts.length; i<len; i++) {
			if(scripts[i].url) {
				obj.placeScript(scripts[i].url);
			} else if(scripts[i].evalSrc) {
				obj.scriptEval(scripts[i].evalSrc);
			}
		}
	};

	function getTextContentExceptScript(element) {
		var text = [];
		var self = arguments.callee;
		var el, els = element.childNodes;

		for (var i=0, iLen=els.length; i<iLen; i++) {
			el = els[i];
			if (el.nodeType == 1 && el.tagName && el.tagName.toLowerCase() != 'script' && el.tagName.toLowerCase() != 'noscript' && el.tagName.toLowerCase() != 'style') {
				text.push(self(el));
			} else if (el.nodeType == 3) {
				text.push(el.data);
			}
		}
		return text.join(' ').replace(/\s{2,}/g, ' ').replace(/^\s\s*/, '').replace(/\s\s*$/, '');
	}

	function checkConditions(conditions) {
		for(var i in conditions) {
			if(conditions.hasOwnProperty(i)) {
				if(!conditions[i]) {
					return false;
				}
			}
		}
		return true;
	}
    
    var visibilityObj = null;
    var flxKeyword = '';
    var flxCustomKeyword = '';
    var flxKeywordHash = '';
    var flxCustomKeywordHash = '';
    var flxRewriteDocumentWrite = true;

	
	
	

	
	
	
	
	
    
    
    
    
    
    
    
    
    
    

    function timeout(numberOfSeconds, funcToExec) {
    	window.setTimeout(funcToExec, numberOfSeconds * 1000);
    	return false;
    }
	
	var tagsPlaced = {};
	var docFragment = document.createDocumentFragment();
	var df = document.createElement('div');
	df.style.display = 'none';
	df.id = 'iatDivInsert';
	docFragment.appendChild(df);
	var scriptsToPlace = [];
	
	var main = function() {
		obj.execute();

		if(document.body) {
			document.body.appendChild(docFragment);
		}

		var dwCodes = [];
		var dw = document.write;
		var dwl = document.writeln;
		document.write = document.writeln = function(html){dwCodes.push(html)};
		obj.placeScripts(scriptsToPlace);
		scriptsToPlace = [];
		obj.placeCode(dwCodes.join(''));
		obj.placeScripts(scriptsToPlace);

		if(flxRewriteDocumentWrite) {
			document.write = document.writeln = function(html){var scriptsToPlace = obj.placeCode(html); obj.placeScripts(scriptsToPlace);};
		}

		if(window.location.href.indexOf('iatDev=1') != -1) {
			document.cookie = "iatDev=1; path=/";
		} else if(window.location.href.indexOf('iatDev=0') != -1) {
			document.cookie = "iatDev=0; path=/";
		}
	};
		// Following function is adapted from https://github.com/jfriend00/docReady
		// licensed under MIT license
		// https://github.com/jfriend00/docReady/blob/master/license
	  ((function(funcName, baseObj) {
	    "use strict";
	    // The public function name defaults to window.docReady
	    // but you can modify the last line of this function to pass in a different object or method name
	    // if you want to put them in a different namespace and those will be used instead of 
	    // window.docReady(...)
	    funcName = funcName || "docReady";
	    baseObj = baseObj || window;
	    var readyList = [];
	    var readyFired = false;
	    var readyEventHandlersInstalled = false;
	    
	    // call this when the document is ready
	    // this function protects itself against being called more than once
	    function ready() {
	        if (!readyFired) {
	            // this must be set to true before we start calling callbacks
	            readyFired = true;
	            for (var i = 0; i < readyList.length; i++) {
	                readyList[i].fn.call(window, readyList[i].ctx);
	            }
	            // allow any closures held by these functions to free
	            readyList = [];
	        }
	    }
	    
	    function readyStateChange() {
	        if ( document.readyState === "complete" ) {
	            ready();
	        }
	    }
	    
	    baseObj[funcName] = function(callback, context) {
	        // if ready has already fired, then just schedule the callback
	        // to fire asynchronously, but right away
	        if (readyFired) {
	            setTimeout(function() {callback(context);}, 1);
	            return;
	        } else {
	            // add the function and context to the list
	            readyList.push({fn: callback, ctx: context});
	        }
	        // if document already ready to go, schedule the ready function to run
	        // IE only safe when readyState is "complete", others safe when readyState is "interactive"
	        if (document.readyState === "complete" || (!document.attachEvent && document.readyState === "interactive")) {
	            setTimeout(ready, 1);
	        } else if (!readyEventHandlersInstalled) {
	            // otherwise if we don't have event handlers installed, install them
	            if (document.addEventListener) {
	                // first choice is DOMContentLoaded event
	                document.addEventListener("DOMContentLoaded", ready, false);
	                // backup is window load event
	                window.addEventListener("load", ready, false);
	            } else {
	                // must be IE
	                document.attachEvent("onreadystatechange", readyStateChange);
	                window.attachEvent("onload", ready);
	            }
	            readyEventHandlersInstalled = true;
	        }
	    }
	    return baseObj[funcName];
	})("docReady"))(main);

	return obj;
})();