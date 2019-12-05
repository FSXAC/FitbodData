
// Global object to keep track of all the data
let g_FitDataLines = undefined;		// Data sorted as list of objects
let g_FitHistoryData = undefined;	// Data sorted as list of days of objects

// Load csv
// FIXME: HACK: currently hardcoded path
// At the start, load the csv file
$(document).ready(function() {
	$.ajax({
		type: 'GET',
		url: 'data/fitbod_workout.csv',
		dataType: 'text',
		success: main
	});

	// Setup event handling for the top navigation buttons
	setupNavEventHandling();
});

function main(data) {

	// Preprocess csv into usable data
	processWorkoutCSV(data);

	// Process data into (by day) and (by exercise)
	processHistory();
	populateHistory();

	// Populate exercise page
	populateExercisesToSidebar();
}

function setupNavEventHandling() {
	$('#nav-overview-button').on('click', handleNavOverview);
	$('#nav-history-button').on('click', handleNavHistory);
	$('#nav-exercises-button').on('click', handleNavExercises);
}

function handleNavClear() {
	$('.nav-item').removeClass('active');
	$('.content-page').hide();
}

function handleNavOverview() {
	handleNavClear()
	$('#nav-overview-button').parent().addClass('active');
	$('.overview-content').show();
}

function handleNavHistory() {
	handleNavClear()
	$('#nav-history-button').parent().addClass('active');
	$('.history-content').show();
}

function handleNavExercises() {
	handleNavClear()
	$('#nav-exercises-button').parent().addClass('active');
	$('.exercises-content').show();
}

function stripQuotes(str) {
	// Helper function to strip the quotation marks
	if (str) {
		return str.replace(/['"]+/g, '');
	} else {
		return ''
	}
}

// This function takes in file of csv data
// and then populates the global variable g_FitDataLines
// which is simply JSON form of the original data with no organization
function processWorkoutCSV(csvData) {
	// Process the CSV file and put it in the global g_FitDataLines variable
	// The header for each CSV file is:
	// Date, exercise, Sets, Reps, Weight (kg), Is warm up, Notes

	// Split CSV into individual lines
	const ALL_DATA_LINES = csvData.split(/\n/);

	let dataLines = []
	for (let i = 1; i < ALL_DATA_LINES.length; i++) {
		let data = ALL_DATA_LINES[i].split(',');

		date = stripQuotes(data[0]);
		exercise = stripQuotes(data[1]);
		// Since sets is always 1, we can skip it (data is not useful)
		reps = parseFloat(data[3]);
		weightKg = parseFloat(data[4]);
		isWarmUp = data[5] === 'true';
		notes = data[6];

		dataLines.push({
			'date': date,
			'exercise': exercise,
			'reps': reps,
			'weightKg': weightKg,
			'isWarmUp': isWarmUp,
			'notes': notes
		});
	}

	g_FitDataLines = dataLines;
}

function processHistory() {
	// Assuming g_FitDataLines is valid
	if (g_FitDataLines === undefined)
		console.error("FitDataLines still undefined");

	// Use date to determine when exercise happened
	let history = {};

	// First pass: separate them into dates
	for (let i = 0; i < g_FitDataLines.length; i++) {
		let thisdate = g_FitDataLines[i].date;

		if (!(thisdate in history)) {
			history[thisdate] = [];
		}
		
		history[thisdate].push(g_FitDataLines[i]);
	}

	// Second pass: calculate aux stuff
	g_FitHistoryData = {
		'data': []
	}

	// Iterate history (dict) with workoutDate as key
	for (let workoutDate in history) {

		// get workout exercises as an array
		let workoutExercises = history[workoutDate];

		// calculate some things
		let exs = [];
		let volume = 0;

		if (workoutExercises.length === undefined) {
			console.log(history);
			console.log(workoutExercises);
			console.log(workoutDate);
		}

		for (let i = 0; i < workoutExercises.length; i++) {
			let ex = workoutExercises[i];

			// Add to list of exercises performed
			if (!exs.includes(ex.exercise)) {
				exs.push(ex.exercise);
			}

			// Add volume if not warmup
			if (!ex.isWarmUp)
				volume += ex.reps * ex.weightKg;
		}

		// Push data into the global data container
		let workoutData = {
			'date': workoutDate,
			'exercises': exs,
			'volume': volume
		};
		g_FitHistoryData.data.push(workoutData);
	}
}

function populateHistory() {	
	for (let i = 0; i < g_FitHistoryData.data.length; i++) {
		let workout = g_FitHistoryData.data[i];
		let itemHtml = '<h3>{date}</h3><p>{n} exercies: {exs}</p><p>Volume: {v}</p>'
		$('#history-list').append(
			itemHtml
			.replace('{date}', workout.date)
			.replace('{n}', workout.exercises.length)
			.replace('{exs}', workout.exercises.join(', '))
			.replace('{v}', workout.volume)
		);
		$('#history-list').append('<hr/>')
	}
}

function populateExercisesToSidebar() {
	// Make a list of exercises and populate sidebar
	let exercises = [];
	
	for (let i = 0; i < g_FitDataLines.length; i++) {
		const dataEntry = g_FitDataLines[i];
		if (!exercises.includes(dataEntry['exercise'])) {
			exercises.push(dataEntry['exercise'])
		}
	}

	exercises.sort()

	for (let i = 0; i < exercises.length; i++) {
		const exerciseName = exercises[i];
		const listItemId = '#li-' + exerciseName.replace(/[ ]/g, '-');

		$('#exercise-list').append('<li class="nav-item"><a href="#" id="' + listItemId + '">' + exercises[i] + '</a></li>')
	}

	// Assign event listeners
	$('.nav-item a').on('click', function () {
		populateExerciseSummary($(this).text());
	});
}

function populateExerciseSummary(exerciseName) {
	let entries = [];

	for (let i = 0; i < g_FitDataLines.length; i++) {
		const dataEntry = g_FitDataLines[i];
		if (dataEntry['exercise'] === exerciseName) {
			entries.push(dataEntry)
		}
	}

	if (entries.length < 1) {
		return;
	}

	$('#exercise-summary-heading').html(exerciseName)
	$('#exercise-summary-data').html('');
	
	for (let i = 0; i < entries.length; i++) {
		entry = entries[i]
		if (entry['isWarmUp']) {
			$('#exercise-summary-data').append(`<p class="text-light">${entry['date']} reps: ${entry['reps']} weight: ${(entry['weightKg'] * 2.204).toFixed(1)}lb</p>`);
		} else {
			$('#exercise-summary-data').append(`<p>${entry['date']} reps: ${entry['reps']} weight: ${(entry['weightKg'] * 2.204).toFixed(1)}lb</p>`);
		}
	}
}