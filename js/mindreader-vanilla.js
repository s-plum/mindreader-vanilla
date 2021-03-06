(function() {
	'use strict';
	//selector helpers
	var mr = function(elem) {
		return new mr.prototype.init(elem);
	};

	//convert node list from document.querySelectorAll to array for parsing/looping
	mr.convertNodeList = function (list) {
		if (!list) {
			return [];
		}
        var array = new Array(list.length);
        for (var i = 0, n = list.length; i < n; i++)
            array[i] = list[i];
        return array;
    };

    mr.mergeObjects = function(target, object, override) {
    	var objects = [];
        switch (Object.prototype.toString.call(object)) {
            case '[object Array]':
                objects = object;
                break;
            case '[object Object]':
                objects.push(object);
                break;
            default:
                return this;
        }

        if (objects.length === 0) {
            return target;
        }

        var merged = {};
        for (var key in target) {
            merged[key] = target[key];
        }
        for (var i = 0; i < objects.length; i++) {
            for (var k in objects[i]) {
                if (override || !merged[k]) {
                    merged[k] = objects[i][k];
                }
            }
        }
        return merged;
    };

	mr.prototype = {
		find: function(selector) {
            var hasId = this.el.id ? true : false;
            //if element does not have id, create temporary ID for search
            if (!hasId) {
                this.el.id = 'temp-' + Math.random().toString(36).substr(2);
            }
            var matches = document.querySelectorAll('#' + this.el.id + ' ' + selector);
            if (matches.length > 0) {
                return mr.convertNodeList(matches);
            }
            else {
                return [];
            }
            if (!hasId) {
                this.el.removeAttribute('id');
            }
        },
        empty: function() {
            while (this.el.hasChildNodes()) {
                this.el.removeChild(this.el.lastChild);
            }
        },
        setAttributes: function(attrs) {
            for (var attr in attrs) {
                this.el.setAttribute(attr, attrs[attr]);
            }
        },
        addClass: function(name) {
            if (this.el.className.length) {
                var names = name.split(' ');
                var classes = this.el.className.split(' ');
                //do not add duplicate names
                names.forEach(function(n, i) {
                    if (classes.indexOf(n) >= 0) {
                        names.splice(names.indexOf(n), 1);
                    }
                });
                if (names.length > 0) {
                    this.el.className += ' ' + names.join(' ');
                }
            }
            else {
                this.el.className = name;
            }
        },
        removeClass: function(name) {
            if (this.el.className.length > 0) {
                var names = name.split(' ');
                var classes = this.el.className.split(' ');
                names.forEach(function(n, i) {
                    if (classes.indexOf(n) >= 0) {
                        classes.splice(classes.indexOf(n), 1);
                    }
                });
                this.el.className = classes.join(' '); 
            }
        },
        text: function(newText) {
            if (newText && typeof newText != 'string') {
                newText = false;
            }
            if (!newText && (this.el.innerText || this.el.textContent)) {
                return this.el.innerText || this.el.textContent;
            }
            else if (newText) {
                if ('textContent' in document.body) {
                  this.el.textContent = newText;
                }
                else {
                    this.el.innerText = newText;
                }
            }
        },
        triggerMouseEvent: function(event) {
            var evt;
            if (MouseEvent) {
                evt = new MouseEvent(event, {
                    bubbles: true,
                    cancelable: true
                });
            }
            if (typeof evt != 'undefined') {
            	this.el.dispatchEvent(evt);
            }
            else if (this.el[event]) {
            	this.el[event]();
            }
        }
	};
	
	var init = mr.prototype.init = function (el) {
        if (el) {
            this.el = el;
        }
        return this;
    };

    init.prototype = mr.prototype;

	//polyfill for javascript forEach
    if (!Array.prototype.forEach) {
        Array.prototype.forEach = function (callback, thisArg) {

            var T, k;

            if (this === null) {
                throw new TypeError(' this is null or not defined');
            }
            var O = Object(this);
            var len = O.length >>> 0;
            if (typeof callback !== "function") {
                throw new TypeError(callback + ' is not a function');
            }
            if (arguments.length > 1) {
                T = thisArg;
            }
            k = 0;
            while (k < len) {

                var kValue;
                if (k in O) {
                    kValue = O[k];
                    callback.call(T, kValue, k, O);
                }
                k++;
            }
        };
    }

	//define Ajax handler
	var AjaxHandler = function () {
        var methods = {
            get: "GET",
            post: "POST"
        };
        var send = function (ajaxConfig) {
            var defaultConfig = {
                method: methods.post,
                url: '',
                data: null,
                callback: function () {
                    return true;
                },
                errorCallback: function () {
                    return false;
                }
            };

            var config = mr.mergeObjects(defaultConfig, ajaxConfig, true);

            var query = '';

            if (config.data) {
                var queryData = [];
                for (var key in config.data) {
                    queryData.push(encodeURIComponent(key) + '=' + encodeURIComponent(config.data[key]));
                }
                query = queryData.join('&');
            }

            if (config.method === methods.get && query.length > 0) {
                var concat = '?';
                if (config.url.indexOf('?') >= 0) {
                    concat = '&';
                }
                config.url += concat + query;
                query = null;
            }

            var req = new XMLHttpRequest();
            if ('withCredentials' in req) {
                req.open(config.method, config.url, true);

            }
            else if (typeof XDomainRequest != 'undefined') {
                req = new XDomainRequest();
                req.open(config.method, config.url);
            }
            else {
                return false;
            }

            req.setRequestHeader('Content-type', 'application/json');

            req.onreadystatechange = function () {
            	var res = null;
                if ((req.readyState == XMLHttpRequest.DONE || req.readyState === 4) && req.status == 200 && config.callback) {
                    res = req.responseText;
                    try {
                        res = JSON.parse(req.responseText);
                    } catch (e) {
                        if (config.errorCallback) config.errorCallback(res);
                        res = null;
                    }
                    if (res !== null && config.callback) config.callback(res);
                }
                else {
                    if (config.errorCallback) config.errorCallback(res);
                }
            };
            req.send(query);
        };

        var get = function (params) {
            params.method = methods.get;
            send(params);
        };

        var post = function (params) {
            params.method = methods.post;
            send(params);
        };

        return {
            get: get,
            post: post
        };
 	};

	var Mindreader = function(elem, mindreaderConfig) {
		var activeItem,
			bindDomEvents,
			clearResults,
			create,
			config,
			el,
			hideResults,
			moveListSelection,
			parent,
			parseResults,
			positionResults,
			results,
			resultsData,
			search,
			searchTimeout,
			showResults,
			statusBox;
			

		var keyCode = {
	        BACKSPACE: 8,
	        DOWN: 40,
	        ENTER: 13,
	        ESCAPE: 27,
	        HOME: 36,
	        LEFT: 37,
	        RIGHT: 39,
	        TAB: 9,
	        UP: 38
	    };

	    var classes = {
	        status: 'mindreader-status',
	        results: 'mindreader-results',
	        active: 'active',
	        nomatch: 'mindreader-nomatch',
	        resultsOpen: 'mindreader-results-open'
	    };

	    var dataAttributes = {
	        currentVal: 'data-current-val'
	    };

	    var directions = {
	    	up: 0,
	    	down: 1
	    };

	    var defaultConfig = {
	        ajaxUrl: '',
	        parseMatches: null,
	        matchSelected: null,
	        matchStatus: '{0} items found. Use up and down arrow keys to navigate.',
	        noMatchStatus: null,
	        postData: null,
	        actionType: 'POST',
	        matchEvents: 'mouseover click',
	        minLength: 1,
	        searchPause: 50,
	        errorCallback: function() { return false; }
	    };

		create = function(elem, mindreaderConfig) {
    		el = elem;
    		el.setAttribute(dataAttributes.currentVal, '');
    		parent = elem.parentNode;   		
    		config = mr.mergeObjects(defaultConfig, mindreaderConfig, true);
    		searchTimeout = null;
    		activeItem = {
    			el: null,
    			index: null
    		};
    		resultsData = [];

    		//create screen-reader friendly status box
    		statusBox = document.createElement('span');
    		mr(statusBox).setAttributes({
    			'role': 'status',
    			'class': classes.status,
    			'aria-live': 'polite'
    		});

    		results = document.createElement('ul');
    		mr(results).setAttributes({
    			'class': classes.results,
    			'id': el.id + '-mindreader'
    		});
    		document.getElementsByTagName('body')[0].appendChild(results);
    		document.getElementsByTagName('body')[0].appendChild(statusBox);
    		bindDomEvents();
    	};

    	bindDomEvents = function() {
    		window.addEventListener('resize', function() {
    			positionResults();
    		});

    		el.addEventListener('keydown', function(e) {
    			var code = e.keyCode ? e.keyCode : e.which;
                switch (code) {
                    case keyCode.ESCAPE:
                        el.value = el.getAttribute(dataAttributes.currentVal);
                        e.preventDefault();
                        clearResults();
                        break;
                    case keyCode.TAB:
                        clearResults();
                        break;
                    case keyCode.ENTER:
                        if (activeItem.el !== null) {
                            mr(activeItem.el).triggerMouseEvent('click');
                            e.preventDefault();
                        }
                        else {
                            clearResults();
                        }
                        break;
                    case keyCode.UP:
                        e.preventDefault();
                        break;
    			}
    		});	

			el.addEventListener('keyup', function(e) {
				clearTimeout(searchTimeout);
                var code = e.keyCode ? e.keyCode : e.which;
                switch (code) {
                    case keyCode.DOWN:
                        e.preventDefault();
                        if (resultsData.length > 0) {
                        	moveListSelection(directions.down);
                        }
                        break;
                    case keyCode.UP:
                        e.preventDefault();
                        if (resultsData.length > 0) {
                        	moveListSelection(directions.up);
                        }
                        break;
                    case keyCode.ENTER:
                        if (activeItem.el !== null) {
                            e.preventDefault();
                            clearResults();
                        }
                        break;
                    case keyCode.ESCAPE:
                        e.preventDefault();
                        clearResults();
                        break;
                    default:
                        search();
                        break;
                }
			});

			el.addEventListener('blur', function(e) {
				setTimeout(function() {
					if (mr(results).find('a:hover').length === 0 && mr(results).find('a:focus').length === 0 && mr(results).find('a:active').length === 0) {
                        clearResults();
                        el.setAttribute(dataAttributes.currentVal, '');
                    }
				}, 100);
			});
    	};

    	search = function() {
    		//clear previous results
    		var value = el.value;
    		
    		el.setAttribute(dataAttributes.currentVal, value);
    		if (value.length >= config.minLength) {
    			searchTimeout = setTimeout(function() {
    				//gather any additional data for posting
    				var dataObject = null;
                    if (config.postData !== null && typeof config.postData == 'function' && typeof config.postData() == 'object') {
                    	dataObject = JSON.stringify(config.postData());
                    }

                    var $ajax = new AjaxHandler();
                    $ajax[config.actionType.toLowerCase()]({
                    	url: config.ajaxUrl + value,
                    	data: dataObject,
                    	callback: function(data) {
                    		if (typeof data == 'string') {
                                data = JSON.parse(data);
                            }
                            if (Object.prototype.toString.call(data) === '[object Array]' && config.parseMatches !== null) {
                            	parseResults(data);
                            }
                    	},
                    	errorCallback: config.errorCallback
                    });
    			}, config.searchPause);
    		}
            else {
                clearResults();
            }
    	};

    	parseResults = function(data) {
    		clearResults();
    		if (data.length === 0) {
    			if (config.noMatchStatus !== null) {
    				//create empty element for no matches
    				var noMatch = document.createElement('li');
    				noMatch.className = classes.nomatch;
    				mr(noMatch).text(config.noMatchStatus);
    				results.appendChild(noMatch);
    				mr(statusBox).text(config.noMatchStatus);
    			}
    			showResults();
    			mr(el).addClass(classes.resultsOpen);
    			return false;
    		}

    		resultsData = data;

            var displayData = config.parseMatches(data);

            //if result parse is string, set as inner HTML. if result parse is array of elements, add to results box
            var resultCount = 0;

            switch(Object.prototype.toString.call(displayData)) {
                case '[object Array]':
                    resultCount = displayData.length;
                    if (displayData.length > 0) {
                        displayData.forEach(function(v, i) {
                            if (v.nodeType === 1) {
                                results.appendChild(v);
                            }
                        });
                    }
                    break;
                case '[object String]':
                    resultCount = resultsData.length;
                    results.innerHTML = config.parseMatches(data);
                    break;
            }
    		

    		//update status to result count
    		if (resultCount > 0) {
    			mr(statusBox).text(config.matchStatus.replace('{0}', resultCount));
    		}
    		showResults();
    		mr(el).addClass(classes.resultsOpen);

    		//bind onclick for result list links
    		var resultLinks = mr(results).find('a');
    		if (resultLinks.length > 0) {
    			resultLinks.forEach(function(link, i) {
    				link.onclick = function(e) {
    					e.preventDefault();
    					el.value = mr(e.target).text();
    					clearResults();
    					el.focus();
    				};
    				link.onmouseover = function(e) {
    					if (activeItem.el !== null) {
    						mr(activeItem.el).removeClass(classes.active);
    					}
    					mr(e.target).addClass(classes.active);
    					activeItem.el = e.target;
    					activeItem.index = i;
    				};

    				if (config.matchSelected !== null && config.matchEvents && config.matchEvents.length > 0) {
    					var events = config.matchEvents.split(' ');
    					events.forEach(function(e, i) {
    						link.addEventListener(e, config.matchSelected);
    					});
    				}
    			});
    		}
    	};

    	clearResults = function() {
    		resultsData = [];
    		activeItem.el = null;
    		activeItem.index = null;
    		mr(el).removeClass(classes.resultsOpen);
    		mr(statusBox).empty();
    		mr(results).empty();
    	};

    	positionResults = function() {
    		var height = el.offsetHeight,
    		width = el.offsetWidth,
    		xpos = el.offsetLeft,
    		ypos = el.offsetTop;

    		results.style.width = width + 'px';
    		results.style.left = xpos + 'px';
    		results.style.top = (ypos + height) + 'px';
    	};

    	hideResults = function() {
    		results.setAttribute('aria-hidden', 'true');
    		results.style.display = 'none';
    	};

    	showResults = function() {
    		positionResults();
    		results.removeAttribute('aria-hidden');
    		results.style.display = 'block';
    	};

    	moveListSelection = function(direction) {
    		var resultListItems = mr(results).find('li'),
    			openStart = 0,
    			incr = function(x) { x++; return x; },
    			atEnd = activeItem.index === resultListItems.length - 1;
    		if (direction == directions.up) {
				openStart = resultListItems.length - 1;
				incr = function(x) { x--; return x; };
				atEnd = activeItem.index === 0;
    		}

    		//if nothing is active
    		if (activeItem.el === null) {
    			activeItem.el = mr(results).find('a')[openStart];
    			activeItem.index = openStart;
                el.value = mr(activeItem.el).text();
    			mr(statusBox).text(mr(activeItem.el).text());
    			mr(activeItem.el).triggerMouseEvent('mouseover');
    		}

    		//if item at beginning/end of list is active
    		else if (atEnd) {
    			mr(activeItem.el).removeClass(classes.active);
    			activeItem.el = null;
    			activeItem.index = null;
    			el.value = el.getAttribute(dataAttributes.currentVal);
    			mr(statusBox).text(el.getAttribute(dataAttributes.currentVal));
    		}

    		//if list is open, make adjacent list item active depending on direction
    		else {
    			var nextItem = mr(resultListItems[incr(activeItem.index)]).find('a')[0];
                el.value = mr(nextItem).text();
    			mr(statusBox).text(mr(nextItem).text());
    			mr(nextItem).triggerMouseEvent('mouseover');
    		}
    		return false;
    	};

		return create(elem, mindreaderConfig);
	};

	//amd
	if ( typeof define === "function" && define.amd ) {
		define(function() { return Mindreader; });
	}
	//plain vanilla
	else {
		window.Mindreader = Mindreader;
	}

})();