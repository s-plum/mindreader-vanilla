Element.prototype.mindreader = function(mindreaderConfig) {
    var initDomHelpers = function() {
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

        //empty element
        Element.prototype._empty = function() {
            while (this.hasChildNodes()) {
                this.removeChild(this.lastChild);
            }
        };

        //set multiple attributes on element
        Element.prototype._setAttributes = function(attrs) {
            for (var attr in attrs) {
                this.setAttribute(attr, attrs[attr]);
            }
        };

        //add class to element
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

        //remove class from element
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

        //get element text content
        Element.prototype._text = function(newText) {
            if (newText && typeof newText != 'string') {
                newText = false;
            }
            if (!newText && (this.innerText || this.textContent)) {
                return this.innerText || this.textContent;
            }
            else if (newText) {
                if ('textContent' in document.body) {
                  this.textContent = newText;
                }
                else {
                    this.innerText = newText;
                }
            }
        }

        //trigger element event
        Element.prototype._triggerMouseEvent = function(event) {
            var evt;
            if (document.createEvent) {
                evt = document.createEvent("MouseEvents");
                evt.initMouseEvent(event);
            }
            (evt) ? this.dispatchEvent(evt) : (el[event] && el[event]());
        };

        //merge objects - result will contain properties of all objects, properties of source will be rewritten by target in order targets are declared
        Object.prototype._mergeWith = function(object, override) {
            //object can be an array of objects or a single object
            //override is a boolean for whether existing parameters in the first object should be overwritten if the same parameters exist in the objects being merged into it.
            var objects = [];
            switch(Object.prototype.toString.call(object)) {
                case '[object Array]':
                    objects = object;
                    break;
                case '[object Object]':
                    objects.push(object);
                    break;
                default:
                    return this;
                    break;
            }

            if (objects.length === 0) {
                return this;
            }

            var merged = {};
            for (var key in this) {
                merged[key] = this[key];
            }
            for (var i = 0; i < objects.length; i++) {
                for (var key in objects[i]) {
                    if (override || !merged[key]) {
                        merged[key] = objects[i][key];
                    }
                }
            }
            return merged;
        };
    };

    //constructor for ajax handler
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
            }

            var config = ajaxConfig._mergeWith(defaultConfig);

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

    var MindReader = {
    	create: function(elem, config) {
    		this.el = elem;
    		this.el.setAttribute(dataAttributes.currentVal, '');
    		this.parent = elem.parentNode;   		
    		this.config = defaultConfig._mergeWith(config, true);
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
    		if (value.length >= self.config.minLength) {
    			self.searchTimeout = setTimeout(function() {
    				//gather any additional data for posting
                    if (self.config.postData != null && typeof self.config.postData == 'function' && typeof self.config.postData() == 'object') var dataObject = JSON.stringify(self.config.postData());
                    else var dataObject = null;

                    var $ajax = new AjaxHandler();

                    $ajax[self.config.actionType.toLowerCase()]({
                    	url: self.config.ajaxUrl + value,
                    	data: dataObject,
                    	callback: function(data) {
                    		if (typeof data == 'string') {
                                data = JSON.parse(data);
                            }
                            if (Object.prototype.toString.call(data) === '[object Array]' && self.config.parseMatches != null) {
                            	self.parseResults(data);
                            }
                    	},
                    	errorCallback: self.config.errorCallback
                    });
    			}, self.config.searchPause);
    		}
            else {
                self.clearResults();
            }
    	},
    	parseResults: function(data) {
    		var self = this;
    		self.clearResults();
    		if (data.length === 0) {
    			if (self.config.noMatchStatus != null) {
    				//create empty element for no matches
    				var noMatch = document.createElement('li');
    				noMatch.className = classes.nomatch;
    				noMatch._text(self.config.noMatchStatus);
    				self.results.appendChild(noMatch);
    				self.statusBox._text(self.config.noMatchStatus);
    			}
    			self.showResults();
    			self.el._addClass(classes.resultsOpen);
    			return false;
    		}

    		self.resultsData = data;

            self.displayData = self.config.parseMatches(data);

            //if result parse is string, set as inner HTML. if result parse is array of elements, add to results box

            switch(Object.prototype.toString.call(self.displayData)) {
                case '[object Array]':
                    var resultCount = self.displayData.length;
                    if (self.displayData.length > 0) {
                        self.displayData.forEach(function(v, i) {
                            if (v.nodeType === 1) {
                                self.results.appendChild(v);
                            }
                        });
                    }
                    break;
                case '[object String]':
                    var resultCount = self.resultsData.length;
                    self.results.innerHTML = self.config.parseMatches(data);
                    break;
            }
    		

    		//update status to result count
    		if (resultCount > 0) {
    			self.statusBox._text(self.config.matchStatus.replace('{0}', resultCount));
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
                        return false;
    				};
    				elem.onmouseover = function(e) {
    					if (self.activeItem.el != null) {
    						self.activeItem.el._removeClass(classes.active);
    					}
    					e.target._addClass(classes.active);
    					self.activeItem.el = e.target;
    					self.activeItem.index = i;
    				};

    				if (self.config.matchSelected != null && self.config.matchEvents && self.config.matchEvents.length > 0) {
    					var events = self.config.matchEvents.split(' ');
    					events.forEach(function(e, i) {
    						elem.addEventListener(e, self.config.matchSelected);
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
                self.el.value = activeItem._text();
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
                self.el.value = nextItem._text();
    			self.statusBox._text(nextItem._text());
    			nextItem._triggerMouseEvent('mouseover');
    		}
    		return false;
    	}
    }

    initDomHelpers();
    MindReader.create(this, mindreaderConfig);
};