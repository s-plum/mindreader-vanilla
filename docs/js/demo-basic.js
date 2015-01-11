require(["mindreader-vanilla"], function() {
	var demoInput = document.getElementById('mindreader-demo-input');
	demoInput.mindreader({
		ajaxUrl: 'docs/js/fruits.json?q=',
		parseMatches: function(data) {
		    var results = [];
		    //fake string parse matching to mimic ajax service that would return JSON results
		    data.forEach(function (result, index) {
		    	if (result.toLowerCase().indexOf(demoInput.getAttribute('data-current-val').toLowerCase()) >= 0) {
		    		var li = document.createElement('li');
		    		var a = document.createElement('a');
		    		a.href = "#";
		    		a.innerHTML = result;
		    		li.appendChild(a);
		    		results.push(li);
		    	}
		    });
		    return results;
		},
		actionType: 'GET',
		minLength: 2
	});
});

