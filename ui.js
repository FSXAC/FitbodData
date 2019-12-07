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

/* https://www.w3schools.com/howto/howto_js_filter_lists.asp */
function exerciseListSearch() {
	let input = document.getElementById("exercise-list-search");
	let filter = input.value.toUpperCase();

    let exerciseList = document.getElementById("exercise-list");
	let exerciseItems = exerciseList.getElementsByTagName("li");
	
    for (i = 0; i < exerciseItems.length; i++) {
		let innerA = exerciseItems[i].getElementsByTagName("a")[0];
		let text = innerA.textContent || innerA.innerText;
		
        if (text.toUpperCase().indexOf(filter) > -1) {
            exerciseItems[i].style.display = "";
        } else {
            exerciseItems[i].style.display = "none";
        }
    }
}