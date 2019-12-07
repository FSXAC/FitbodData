function stripQuotes(str) {
	// Helper function to strip the quotation marks
	if (str) {
		return str.replace(/['"]+/g, '');
	} else {
		return ''
	}
}

function kgToPound(kg) {
	return kg * 2.204;
}

function get1rm(weight, reps) {
	return weight * (1 + reps / 30.0);
}