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

let g_chart1RM = document.getElementById('chart-1rm').getContext('2d');
let g_chart1RMConfig;
let g_chart1RMChart;

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
		complete: function() {
			console.log('File processing complete.');

			// postProcessFitData();

			// handleNavOverview();
			handleNavExercises();
			populateView();
		}
	});

	setupCharts();
});

// Use the parsed results to populate g_FitHistory
function processFitData(data) {
	startLoadingUI();
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
				incline: (incline !== null) ? incline : -1,
				resistance: (resistance !== null) ? resistance : -1,
				distance: (distance !== null) ? distance : -1,
				duration: (duration !== null) ? duration : -1,
			};
		}

		// Otherwise
		else {

			// Get exercise data
			let reps = entry['Reps'];
			let warmup = entry['isWarmup'];
			let weight = entry['Weight(kg)'];
			
			// Add data to exercise history

			// If exercise doesn't exist
			if (!(exercise in g_FitExercises.data)) {

				// We use a object here because we want to group it by sets
				g_FitExercises.data[exercise] = {};
			}

			if (!(date in g_FitExercises.data[exercise])) {
				g_FitExercises.data[exercise][date] = [];
			}

			g_FitExercises.data[exercise][date].push({
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
}

// This function adds some statistics to the data
// function postProcessFitData() {
// 	for (let [key, value] of Object.entries(g_FitExercises.data)) {
// 		for (let [key_p, value_p] of Object.entries(value)) {

			
			

// 			// Apply the 1rm value to the set object
// 			// g_FitExercises.data[key][key_p]['1rm'] = max_1rm
// 		}
// 	}

// 	console.log(g_FitExercises.data);
// }

// Populate webpage with data
function populateView() {
	populateFitHistoryView();
	populateExerciseView();

	setTimeout(stopLoadingUI, 500);
}

function populateFitHistoryView() {
	const sorted_keys = Object.keys(g_FitHistory.data).sort()

	// Going in reverse order (since we want most recent on top)
	for (let keyIndex = sorted_keys.length - 1; keyIndex >= 0; keyIndex--)
	{
		let key = sorted_keys[keyIndex];
		let date = new Date(key.substring(0, 19)).toDateString();
		let workout = g_FitHistory.data[key];

		if (workout.exercises !== undefined) {
				let itemHtml = '<div class="history-item"><p>{date}</p><p class="htitle">{exs}</p><div class="stat"><p>Exercises</p><p class="lead">{n}</p></div><div class="stat"><p>Volume</p><p class="lead">{v}</p></div></div>'
			$('#history-list').append(
				itemHtml
				.replace('{date}', date)
				.replace('{n}', workout.exercises.length)
				.replace('{exs}', workout.exercises.join(', '))
				.replace('{v}', Math.round(kgToPound(workout.volume)))
			);
		} else {
			let itemHtml = '<div class="history-item"><p>{date}</p><p class="htitle">{ex}</p><div class="stat"><p>Distance</p><p class="lead">{d}</p></div><div class="stat"><p>Duration</p><p class="lead">{dur}</p></div><div class="stat"><p>Inclination</p><p class="lead">{i}&deg;</p></div><div class="stat"><p>Resistance</p><p class="lead">{r}</p></div></div>';
			$('#history-list').append(
				itemHtml
				.replace('{date}', date)
				.replace('{ex}', workout.exercise)
				.replace('{d}', Math.round(workout.distance))
				.replace('{dur}', Math.round(workout.duration))
				.replace('{i}', Math.round(workout.incline))
				.replace('{r}', Math.round(workout.resistance, 1))
			);
		}
	}
}

function populateExerciseView() {
	const sorted_keys = Object.keys(g_FitExercises.data).sort()
	for (let keyIndex = 0; keyIndex < sorted_keys.length; keyIndex++)
	{
		let key = sorted_keys[keyIndex];
		let exercise = g_FitExercises.data[key];

		$('#exercise-list').append('<li class="nav-item"><a class="exercise-item" href="#" style="float:left">' + key + '</a><span style="float: right">' + Object.keys(exercise).length + '</span></li>')
	}

	// Assign event listeners
	$('.nav-item a.exercise-item').on('click', function () {
		populateExerciseSummary($(this).text());
	});
}

function populateExerciseSummary(exercise) {

	// Clear chart
	g_chart1RMConfig.data.labels = [];
	g_chart1RMConfig.data.datasets.forEach(function(dataset) {
		dataset.data = [];
	});
	g_chart1RMChart.update();

	$('#exercise-summary-heading').html(exercise)
	const exerciseData = g_FitExercises.data[exercise];

	const sorted_keys = Object.keys(exerciseData).sort();


	let innerHtml = ''

	for (let keyIndex = sorted_keys.length - 1; keyIndex >= 0; keyIndex--) {

		let key = sorted_keys[keyIndex];
		let date = new Date(key.substring(0, 19)).toDateString();

		innerHtml += '<p class="mb-1">';
		innerHtml += date;
		innerHtml += '</p>';

		innerHtml += '<div class="workout-sets">';

		// Iterate through each set
		for (let i = 0; i < exerciseData[key].length; i++) {

			let set = exerciseData[key][i];

			let reps = set.reps;
			let weightLb = Math.round(kgToPound(set.weight));
			
			if (set.isWarmup) {
				innerHtml += '<p class="text-gray">';
			} else {
				innerHtml += '<p>';
			}
			innerHtml += reps;
			
			if (weightLb >= 1) {
				innerHtml += '&nbsp;&times;&nbsp;';
				innerHtml += weightLb;
				innerHtml += ' lb.';
			}

			if (exerciseData[key][i].isWarmup) {
				innerHtml += ' (warm-up)';
			}

			innerHtml += '</p>';
		}
		innerHtml += '</div>';

		// Find the maximum 1rm of that session
		let max_1rm = 0;
		for (let i = 0; i < exerciseData[key].length; i++) {
			let set = exerciseData[key][i];

			if (set.isWarmup) {
				continue;
			}

			let set1rm = get1rm(set.weight, set.reps);
			if (set1rm > max_1rm) {
				max_1rm = set1rm;
			}
		}

		g_chart1RMConfig.data.labels.unshift(date);
		g_chart1RMConfig.data.datasets.forEach(function(dataset) {
			dataset.data.unshift(Math.round(kgToPound(max_1rm), 1));
		});
	}

	$('#exercise-summary-data').html(innerHtml);

	// Update chart
	g_chart1RMChart.update();
}

function setupCharts() {
	Chart.defaults.global.defaultFontColor = 'white';
	Chart.defaults.global.defaultFontFamily = "'futura-pt', sans-serif";
	Chart.defaults.global.defaultFontSize = 16;
	Chart.defaults.global.animation.duration = 300;
	Chart.defaults.global.title.fontSize = 20;

	g_chart1RMConfig = {
		type: 'line',
		label: '1-Rep-Max',
		data: {
			labels: [],
			datasets: [{
				label: '1RM',
				backgroundColor: '#4cb67d16',
				borderColor: '#4cb67d',
				data: [],
				fill: true
			}]
		},
		options: {
			title: {
				display: true,
				text: '1RM'
			},
			scales: {
				x: {
					display: true,
					scaleLabel: {
						display: true,
						labelString: 'Date'
					},
					// ticks: {
					// 	callback: function(dataLabel, index) {
					// 		// Hide the label of every 2nd dataset. return null to hide the grid line too
					// 		return index % 3 === 0 ? dataLabel : '';
					// 	}
					// }
				},
				y: {
					display: true,
					scaleLabel: {
						display: true,
						labelString: 'Value'
					}
				}
			},
			legend: {
				display: false
			}
		}
	};
	
	g_chart1RMChart = new Chart(g_chart1RM, g_chart1RMConfig);
}