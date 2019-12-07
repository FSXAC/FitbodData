// This file contains code for parsing the export csv file
// Date,Exercise,Reps,Weight(kg),Duration(s),Distance(m),Incline,Resistance,isWarmup,Note

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