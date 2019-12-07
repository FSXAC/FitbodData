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

function startLoadingUI() {
    $('.loading').show();
}

function stopLoadingUI() {
    $('.loading').fadeOut();
}