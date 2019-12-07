$(document).ready(function() {
	// Setup event handling for the top navigation buttons
	setupNavEventHandling();

	// setup handler for the file submission form
	$("input[type=file]").parse({
		config: {
			header: true,
			dynamicTyping: true,
			skipEmptyLines: true,
			complete: function(results, file) {
				console.log("This file done:", file, results);
			}
		},
		complete: function(results) {
			console.log(results);
		}
	});
});