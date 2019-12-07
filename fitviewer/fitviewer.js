// Global variables fitness data
let g_FitHistory = {
	// data contains: date -> fit overview summary
	data: {}
};

let g_FitCardio = {
	// data contains: exercise name -> exercise data
	data: {}
};

let g_FitExercises = {
	// data contains: exercise name -> exercise data
	data: {}
};

$(document).ready(function() {
	// Setup event handling for the top navigation buttons (ui.js)
	setupNavEventHandling();

	// setup handler for the file submission form (papaparse.js)
	$("input[type=file]").parse({
		config: {
			header: true,
			dynamicTyping: true,
			skipEmptyLines: true,
			complete: function(results, file) {
				// console.log("CSV processing done:", results);
				processFitData(results.data)
			}
		},
		complete: function(results) {
			console.log('File loading complete.');
		}
	});
});

// Use the parsed results to populate g_FitHistory
function processFitData(data) {
	// 'data' parameter is a list of objects
	for (let entryIndex = 0; entryIndex < data.length; entryIndex++) {
		let entry = data[entryIndex];

		let date = entry['Date'];
		let exercise = entry['Exercise']

		// If the exercise is a cardio
		if (CARDIOS.includes(exercise)) {

			let incline = entry['Incline'];
			let resistance = entry['Resistance'];
			let distance = entry['Distance(m)'];
			let duration = entry['Duration(s)'];

			if (!(exercise in g_FitCardio.data)) {
				g_FitCardio.data[exercise] = [];
			}

			g_FitCardio.data[exercise].push({
				date: date,
				incline: incline,
				resistance: resistance,
				distance: distance,
				duration: duration,
				note: entry['Note'],
			});

			// Add to fit history
			g_FitHistory.data[date + '(C)'] = {
				exercise: exercise,
				distance: (incline !== null) ? incline : -1,
				duration: (resistance !== null) ? resistance : -1,
				incline: (distance !== null) ? distance : -1,
				resistance: (duration !== null) ? duration : -1,
			};
		}

		// Otherwise
		else {

			// Get exercise data
			let reps = entry['Reps'];
			let warmup = entry['isWarmup'];
			let weight = entry['Weight(kg)'];
			
			// Add data to exercise history
			if (!(exercise in g_FitExercises.data)) {
				g_FitExercises.data[exercise] = [];
			}

			g_FitExercises.data[exercise].push({
				date: date,
				reps: reps,
				weight: weight,
				isWarmup: warmup,
				note: entry['Note']
			});

			// Add to fit history
			if (!(date in g_FitHistory.data)) {
				g_FitHistory.data[date] = {
					exercises: [],
					volume: 0,
				};
			}

			if (!g_FitHistory.data[date].exercises.includes(exercise)) {
				g_FitHistory.data[date].exercises.push(exercise);
			}

			// Add to that workout's volume if it's not a warmup set
			if (!entry['isWarmup']) {
				g_FitHistory.data[date].volume += reps * weight;
			}
		}
	}

	console.log(g_FitHistory);
	console.log(g_FitCardio);
	console.log(g_FitExercises);
}