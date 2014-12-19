Element.prototype.mindreader = function(params) {
	var self = this;
	//polyfill for javascript forEach
    if (!Array.prototype.forEach) {
        Array.prototype.forEach = function (callback, thisArg) {

            var T, k;

            if (this == null) {
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

    //convert node list from document.querySelectorAll to array for parsing/looping
    Array.convertNodeList = function (list) {
        var array = new Array(list.length);
        for (var i = 0, n = list.length; i < n; i++)
            array[i] = list[i];
        return array;
    };

        //read data attributes from element
    var dataAttributeString = function (nodeName) {
        var string = nodeName.split('-');
        string.splice(0, 1);
        string.forEach(function (v, i) {
            if (i !== 0) {
                string[i] = v.charAt(0).toUpperCase() + v.slice(1);
            }
        });
        return string.join('');
    };

    //merge objects
    var extend = function(obj1, obj2) {
    	var extended = {};
    	for (var i = 0; i < arguments.length; i++) {
    		for (var key in arguments[i]) {
    			extended[key] = arguments[i][key];
    		}
    	}
    	return extended;
    };

    //find all child elements that meet given criteria
    Element.prototype._find = function(selector) {
    	var hasId = this.id ? true : false;
    	//if element does not have id, create temporary ID for search
    	if (!hasId) {
    		this.id = 'temp-' + Math.random().toString(36).substr(2);
    	}
    	var matches = document.querySelectorAll('#' + this.id + ' ' + selector);
    	if (matches.length > 0) {
    		return Array.convertNodeList(matches);
    	}
    	else {
    		return [];
    	}
    	if (!hasId) {
    		elem.removeAttribute('id');
    	}
    };

    Element.prototype._empty = function() {
    	while (this.hasChildNodes()) {
		    this.removeChild(this.lastChild);
		}
    };

    //set multiple attributes
    Element.prototype._setAttributes = function(attrs) {
    	for (var attr in attrs) {
    		this.setAttribute(attr, attrs[attr]);
    	}
    };

    //add Class
    Element.prototype._addClass = function(name) {
    	if (this.className.length) {
    		var names = name.split(' ');
    		var classes = this.className.split(' ');
    		//do not add duplicate names
    		names.forEach(function(n, i) {
    			if (classes.indexOf(n) >= 0) {
	    			names.splice(names.indexOf(n), 1);
	    		}
    		});
    		if (names.length > 0) {
    			this.className += ' ' + names.join(' ');
    		}
    	}
    	else {
    		this.className = name;
    	}
    };

    //remove class
    Element.prototype._removeClass = function(name) {
    	if (this.className.length > 0) {
    		var names = name.split(' ');
    		var classes = this.className.split(' ');
    		names.forEach(function(n, i) {
    			if (classes.indexOf(n) >= 0) {
	    			classes.splice(classes.indexOf(n), 1);
	    		}
    		});
    		this.className = classes.join(' ');	
    	}
    };

    //get element text
    Element.prototype._text = function(newText) {
    	if (newText && typeof newText != 'string') {
    		newText = false;
    	}
    	if (!newText && (this.innerText || this.textContent)) {
    		return this.innerText || this.textContent;
    	}
    	else if (newText && this.textContent) {
    		this.textContent = newText;
    	}
    	else if (newText && this.innerText) {
    		this.innerText = newText;
    	}
    }

    //trigger
    Element.prototype._triggerMouseEvent = function(event) {
    	var evt;
    	if (document.createEvent) {
    		evt = document.createEvent("MouseEvents");
    		evt.initMouseEvent(event);
    	}
    	(evt) ? this.dispatchEvent(evt) : (el[event] && el[event]());
    };

    //constructor for ajax handler
    var AjaxHandler = function () {
        var methods = {
            get: "GET",
            post: "POST"
        };
        var send = function (params) {
            var config = {
                method: methods.post,
                url: '',
                data: null,
                callback: function () {
                    return true;
                },
                errorCallback: function () {
                    return false;
                }
            }

            for (var key in params) {
                config[key] = params[key];
            }

            var query = '';

            if (config.data) {
                var queryData = [];
                for (var key in config.data) {
                    queryData.push(encodeURIComponent(key) + '=' + encodeURIComponent(config.data[key]));
                };
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
                req.open(config.method, config.url);

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
                if ((req.readyState == XMLHttpRequest.DONE || req.readyState === 4) && req.status == 200 && config.callback) {
                    var res = req.responseText;
                    try {
                        res = JSON.parse(req.responseText);
                    } catch (e) {
                        if (config.errorCallback) config.errorCallback(res);
                        res = null;
                    }
                    if (res != null && config.callback) config.callback(res);
                }
                else {
                    if (config.errorCallback) config.errorCallback(res);
                }
            }
            req.send(query);
        };

        var get = function (params) {
            params['method'] = methods.get;
            send(params);
        };

        var post = function (params) {
            params['method'] = methods.post;
            send(params);
        };

        return {
            get: get,
            post: post
        };
    };

    var $ajax = new AjaxHandler();

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
    }

    var dataAttributes = {
        currentVal: 'data-current-val'
    };

    var directions = {
    	up: 0,
    	down: 1
    };

    var defaults = {
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

    var MindReader = {
    	create: function(elem, params) {
    		this.el = elem;
    		this.el.setAttribute(dataAttributes.currentVal, '');
    		this.parent = elem.parentNode;   		
    		this.params = extend(defaults, params);
    		this.searchTimeout;
    		this.activeItem = {
    			el: null,
    			index: null
    		};
    		this.resultsData = [];

    		//create screen-reader friendly status box
    		var statusBox = document.createElement('span');
    		statusBox._setAttributes({
    			'role': 'status',
    			'class': classes.status,
    			'aria-live': 'polite'
    		});

    		var results = document.createElement('ul');
    		results._setAttributes({
    			'class': classes.results,
    			'id': this.el.id + '-mindreader'
    		});
    		this.results = results;
    		this.statusBox = statusBox;
    		document.getElementsByTagName('body')[0].appendChild(this.results);
    		document.getElementsByTagName('body')[0].appendChild(this.statusBox);
    		this.bindDomEvents();
    	},
    	bindDomEvents: function() {
    		var self = this;
    		window.addEventListener('resize', function() {
    			self.positionResults();
    		});

    		self.el.addEventListener('keydown', function(e) {
    			var code = e.keyCode ? e.keyCode : e.which;
                switch (code) {
                    case keyCode.ESCAPE:
                        self.el.value = self.el.getAttribute(dataAttributes.currentVal);
                        e.preventDefault();
                        self.clearResults();
                        break;
                    case keyCode.TAB:
                        self.clearResults();
                        break;
                    case keyCode.ENTER:
                        if (self.activeItem.el != null) {
                            self.activeItem.el._triggerMouseEvent('click');
                            e.preventDefault();
                        }
                        else {
                            self.clearResults();
                        }
                        break;
                    case keyCode.UP:
                        e.preventDefault();
                        break;
    			}
    		});	

			self.el.addEventListener('keyup', function(e) {
				clearTimeout(self.searchTimeout);
                var code = e.keyCode ? e.keyCode : e.which;
                switch (code) {
                    case keyCode.DOWN:
                        e.preventDefault();
                        if (self.resultsData.length > 0) {
                        	self.moveListSelection(directions.down);
                        }
                        break;
                    case keyCode.UP:
                        e.preventDefault();
                        if (self.resultsData.length > 0) {
                        	self.moveListSelection(directions.up);
                        }
                        break;
                    case keyCode.ENTER:
                        if (self.activeItem.el != null) {
                            e.preventDefault();
                            self.clearResults();
                        }
                        else
                            break;
                    case keyCode.ESCAPE:
                        e.preventDefault();
                        self.clearResults();
                        break;
                    default:
                        self.search();
                        break;
                }
			});

			self.el.addEventListener('blur', function(e) {
				setTimeout(function() {
					if (self.results._find('a:hover').length === 0 && self.results._find('a:focus').length === 0 && self.results._find('a:active').length === 0) {
                        self.clearResults();
                        self.el.setAttribute(dataAttributes.currentVal, '');
                    }
				}, 100);
			});
    	},
    	search: function() {
    		var self = this;
    		//clear previous results
    		var value = self.el.value;
    		self.el.setAttribute(dataAttributes.currentVal, value);
    		if (value.length >= self.params.minLength) {
    			self.searchTimeout = setTimeout(function() {
    				//gather any additional data for posting
                    if (self.params.postData != null && typeof self.params.postData == 'function' && typeof self.params.postData() == 'object') var dataObject = JSON.stringify(self.params.postData());
                    else var dataObject = null;
                    
                    $ajax[self.params.actionType.toLowerCase()]({
                    	url: self.params.ajaxUrl + value,
                    	data: dataObject,
                    	callback: function(data) {
                    		if (typeof data == 'string') {
                                data = JSON.parse(data);
                            }
                            if (Object.prototype.toString.call(data) === '[object Array]' && self.params.parseMatches != null) {
                            	self.parseResults(data);
                            }
                    	},
                    	errorCallback: self.params.errorCallback
                    });
    			}, self.params.searchPause);
    		}

    	},
    	parseResults: function(data) {
    		var self = this;
    		self.clearResults();
    		if (data.length === 0) {
    			if (self.params.noMatchStatus != null) {
    				//create empty element for no matches
    				var noMatch = document.createElement('li');
    				noMatch.className = classes.nomatch;
    				noMatch._text(self.params.noMatchStatus);
    				self.results.appendChild(noMatch);
    				self.statusBox._text(self.params.noMatchStatus);
    			}
    			self.showResults();
    			self.el._addClass(classes.resultsOpen);
    			return false;
    		}

    		self.resultsData = data;

    		//add result string to result box
    		self.results.innerHTML = self.params.parseMatches(data);

    		//update status to result count
    		var resultCount = self.resultsData.length;
    		if (resultCount > 0) {
    			self.statusBox._text(self.params.matchStatus.replace('{0}', resultCount));
    		}
    		self.showResults();
    		self.el._addClass(classes.resultsOpen);

    		//bind onclick for result list links
    		var resultLinks = self.results._find('a');
    		if (resultLinks.length > 0) {
    			resultLinks.forEach(function(elem, i) {
    				elem.onclick = function(e) {
    					e.preventDefault();
    					self.el.value = e.target._text();
    					self.clearResults();
    					self.el.focus();
    				};
    				elem.onmouseover = function(e) {
    					if (self.activeItem.el != null) {
    						self.activeItem.el._removeClass(classes.active);
    					}
    					e.target._addClass(classes.active);
    					self.activeItem.el = e.target;
    					self.activeItem.index = i;
    				};

    				if (self.params.matchSelected != null && self.params.matchEvents && self.params.matchEvents.length > 0) {
    					var events = self.params.matchEvents.split(' ');
    					events.forEach(function(e, i) {
    						elem.addEventListener(e, self.params.matchSelected);
    					});
    				}
    			});
    		}
    	},
    	clearResults: function() {
    		var self = this;
    		self.resultsData = [];
    		self.activeItem.el = null;
    		self.activeItem.index = null;
    		self.el._removeClass(classes.resultsOpen);
    		self.statusBox.innerHTML = '';
    		self.results._empty();
    	},
    	positionResults: function() {
    		var self = this,
    		height = self.el.offsetHeight,
    		width = self.el.offsetWidth,
    		xpos = self.el.offsetLeft,
    		ypos = self.el.offsetTop

    		self.results.style.width = width + 'px';
    		self.results.style.left = xpos + 'px';
    		self.results.style.top = (ypos + height) + 'px';
    	},
    	hideResults: function() {
    		this.results.setAttribute('aria-hidden', 'true');
    		this.results.style.display = 'none';
    	},
    	showResults: function() {
    		this.positionResults();
    		this.results.removeAttribute('aria-hidden');
    		this.results.style.display = 'block';
    	},
    	moveListSelection: function(direction) {
    		var self = this;
    		var resultListItems = self.results._find('li');
    		switch (direction) {
    			case directions.down:
    				var openStart = 0;
    				var incr = function(x) { x++; return x; };
    				var atEnd = self.activeItem.index === resultListItems.length - 1;
    				break;
    			case directions.up:
    				var openStart = resultListItems.length - 1;
    				var incr = function(x) { x--; return x; };
    				var atEnd = self.activeItem.index === 0;
    				break;
    		}

    		//if nothing is active
    		if (self.activeItem.el == null) {
    			var activeItem = self.results._find('a')[openStart];
    			self.activeItem.el = activeItem;
    			self.activeItem.index = openStart;
    			self.statusBox._text(activeItem._text());
    			activeItem._triggerMouseEvent('mouseover');
    		}

    		//if item at beginning/end of list is active
    		else if (atEnd) {
    			self.activeItem.el._removeClass(classes.active);
    			self.activeItem.el = null;
    			self.activeItem.index = null;
    			self.el.value = self.el.getAttribute(dataAttributes.currentVal);
    			self.statusBox._text(self.el.getAttribute(dataAttributes.currentVal));
    		}

    		//if list is open, make adjacent list item active depending on direction
    		else {
    			var nextItem = resultListItems[incr(self.activeItem.index)]._find('a')[0];
    			self.statusBox._text(nextItem._text());
    			nextItem._triggerMouseEvent('mouseover');
    		}
    		return false;
    	}
    }

    MindReader.create(self, params);
};