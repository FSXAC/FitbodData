
// Global object to keep track of all the data
let g_FitData = undefined;

// Load csv
// FIXME: HACK: currently hardcoded path
// At the start, load the csv file
$(document).ready(function() {
	$.ajax({
		type: 'GET',
		url: 'data/fitbod_workout.csv',
		dataType: 'text',
		success: function(data) {
			processWorkoutCSV(data);
			populateExercisesToSidebar();
		}
	});

	// Setup event handling for the top navigation buttons
	setupNavEventHandling();
});

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
// and then populates the global variable g_FitData
// which is simply JSON form of the original data with no organization
function processWorkoutCSV(csvData) {
	// Process the CSV file and put it in the global g_FitData variable
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

	g_FitData = dataLines;
}

function populateExercisesToSidebar() {
	// Make a list of exercises and populate sidebar
	let exercises = [];
	
	for (let i = 0; i < g_FitData.length; i++) {
		const dataEntry = g_FitData[i];
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

	for (let i = 0; i < g_FitData.length; i++) {
		const dataEntry = g_FitData[i];
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