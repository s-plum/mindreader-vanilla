require(["mindreader-vanilla"], function() {
	var demoInput = document.getElementById('mindreader-demo-input');
	demoInput.mindreader({
		ajaxUrl: 'docs/js/fruits.json?q=',
		parseMatches: function(data) {
		    var htmlString = '';
		    //fake string parse matching to mimic ajax service that would return JSON results
		    data.forEach(function (result, index) {
		    	if (result.toLowerCase().indexOf(demoInput.getAttribute('data-current-val').toLowerCase()) >= 0) htmlString += '<li><a href="#">' + result + '</a></li>';
		    });
		    return htmlString;
		},
		actionType: 'GET',
		minLength: 2
	});
});

