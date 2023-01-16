// this is a basic connection schema to the corresponding data for the table provided.
// this API KEY will expire
// Written by GSoosalu & ndr3svt
const API_KEY = 'AIzaSyCfuQLHd0Aha7KuNvHK0p6V6R_0kKmsRX4';
const DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4"];
const SCOPES = "https://www.googleapis.com/auth/spreadsheets.readonly";

// An array of exercise data fetched from the Google Sheet table.
let exerciseData;
// An index (in the `exerciseData` array) of the currently showing exercise.
let exerciseIndex;
// An order number of the exercise (or a current index in a shuffled indices array).
let exerciseIndexInShuffledArray = 0;
// Indices of the exercises array in a shuffled order (to provide randomness).
let shuffledQuestionIndices = [];
// Indicates whether the given answer has been already evaluated.
let answerIsEvaluated = false;
// Indicates whether the Evaluation results panel has been expanded.
let isEvaluationExpanded = false;
// Stores the results for each answer (in the order of exercise appearance).
let results = [];

const WRONG_ANSWER_MESSAGE = 'Your answer is wrong';
const CORRECT_ANSWER_MESSAGE = 'You are right!';
const NO_EXERCISE_DATA_MESSAGE = 'There are no exercises to show. Please, reload the page.';

function handleClientLoad() {
	// Callback after Google api.js is loaded.

	gapi.load('client', initClient);
}

function initClient() {
	// Callback after the API client is loaded. Loads the discovery doc to
	// initialize the API.

	showSpinner();
	hideQuestionContainer();

	gapi.client.init({
		apiKey: API_KEY,
		discoveryDocs: DISCOVERY_DOCS
	}).then(function () {
		getExerciseData();
	}, function(response) {
		console.log(JSON.stringify(response, null, 2));
		hideSpinner();
		handleError(response?.error?.message ?? 'An error occurred while initializing gapi client.');
	});
}

function getExerciseData() {
	// Fetches the exercise data from the Google Sheet table, stores it in memory,
	// initiates the first question rendering.

	gapi.client.sheets.spreadsheets.values.get({
		spreadsheetId: '1hzA42BEzt2lPvOAePP6RLLRZKggbg0RWuxSaEwd5xLc',
		range: 'Learning!A1:F10',
	}).then(function(response) {
		console.log(response);
		console.log(response.result.values);
		// Used the `slice` function here to ignore the table header.
		exerciseData = response.result.values.slice(1).map(function (row) {
			// labels: ['topic', 'id', 'question', 'answerOptions', 'answerIndex', 'score']
			return {
				topic: row[0],
				id: row[1],
				question: row[2],
				answerOptions: row[3].split(';'),
				answerIndex: parseInt(row[4]),
				score: parseInt(row[5])
			};
		});

		// Shuffle exercise array indices to provide randomness.
		shuffledQuestionIndices = shuffleArrayIndices(exerciseData.length);

		hideSpinner();
		showQuestionContainer();

		showNextQuestion();
	}, function(response) {
		console.log('Error: ' + response.result.error.message);
		hideSpinner();
		handleError(response?.result?.error?.message ?? 'An error occurred while retrieving the data.');
	});
}

function shuffleArrayIndices(length) {
	// Given the `length` of an array, returns the indices in the range
	// from 0 to `length - 1` in some random order.

	let indices = [];
	for (let i = 0; i < length; i++) {
		indices.push(i);
	}
	return indices.sort(function () {
		return Math.random() - 0.5;
	});
}

function showNextQuestion() {
	// Changes the current exercise to the next one (in the shuffled order) and
	// updates all the related components.

	if (exerciseData.length === 0) {
		handleError(NO_EXERCISE_DATA_MESSAGE);
		return;
	}

	// Restore the page state for a new question.
	answerIsEvaluated = false;
	hideNextQuestionButton();
	hideEvaluationMessage();
	showEvaluationButton();

	// Update the current exercise.
	exerciseIndex = shuffledQuestionIndices[exerciseIndexInShuffledArray];
	exerciseIndexInShuffledArray += 1;
	let exercise = exerciseData[exerciseIndex];

	// Update the question text.
	let questionElement = document.getElementById('question');
	questionElement.innerText = exercise.question;

	// Update the answer options.
	let optionsContainer = document.getElementById('options-wrapper');
	optionsContainer.innerHTML = '';
	for (let optionIndex = 0; optionIndex < exercise.answerOptions.length; optionIndex++) {
		optionsContainer.innerHTML += 
			`<span id='option-${optionIndex}' class='unchosen option' onclick='toggleChoice(${optionIndex})'>
				${exercise.answerOptions[optionIndex]}
			</span>`;
	}

	// Add a new unanswered exercise to the results.
	results.push(null);
	updateProgressBar();
}

function toggleChoice(index) {
	// Updates the selected answer option (by the given `index`) for the current exercise.

	if (answerIsEvaluated) {
		// Don't allow to change answer if it has been already evaluated.
		return;
	}

	// Remove the old selection.
	let oldChosenElement = document.querySelector('.option.chosen');
	if (oldChosenElement !== null) {
		oldChosenElement.classList.remove('chosen');
		oldChosenElement.classList.add('unchosen');
	}

	// Update the new selection.
	let optionElement = document.querySelector(`#option-${index}`);
	optionElement.classList.remove('unchosen');
	optionElement.classList.add('chosen');
}

function myEvaluation() {
	// Evaluates the chosen answer.

	let chosenOptionElement = document.querySelector('.chosen');
	if (chosenOptionElement == null) {
		// Ignore click if no answer has been chosen.
		return;
	}

	// Compare the chosen answer index with the correct answer index.
	let chosenAnswerIndex = parseInt(chosenOptionElement.id.split('-')[1]);
	let exercise = exerciseData[exerciseIndex];
	let correctAnswerIndex = exercise.answerIndex;
	let evaluationMessage = '';
	let isAnswerCorrect = null;
	if (chosenAnswerIndex != correctAnswerIndex) {
		isAnswerCorrect = false;
	} else {
		isAnswerCorrect = true;
	}

	// Update the results, the progress bar and show the evaluation panel.
	results[results.length - 1] = isAnswerCorrect;
	chosenOptionElement.classList.add(isAnswerCorrect ? 'correct' : 'wrong');
	answerIsEvaluated = true;
	hideEvaluationButton();
	showEvaluationMessage(isAnswerCorrect);
	updateProgressBar();

	// Determine which button to show: for the next question or for the final result.
	if (exerciseIndexInShuffledArray === exerciseData.length) {
		showFinalResultButton();
	} else {
		showNextQuestionButton();
	}
}

function updateProgressBar() {
	// Renders the progress bar according to the `results` array.

	const progressBarElement = document.getElementById('progress-bar');
	if (progressBarElement !== null) {
		const progressBarSegmentWidth = 100 / shuffledQuestionIndices.length;
		progressBarElement.innerHTML = '';
		for (let i = 0; i < results.length; i++) {
			let resultClass = 'in-progress';
			if (results[i] === true) {
				resultClass = 'correct';
			} else if (results[i] === false) {
				resultClass = 'wrong';
			}
			progressBarElement.innerHTML += `
				<div class="progress" role="progressbar" aria-label="Question ${i + 1}"
				     aria-valuenow="${progressBarSegmentWidth}" aria-valuemin="0"
				     aria-valuemax="100" style="width: ${progressBarSegmentWidth}%">
					<div class="progress-bar ${resultClass}"></div>
				</div>`;
		}
	}
}

function showFinalResult() {
	// Renders the final score.

	hideQuestionContainer();
	hideFinalResultButton();

	// Calculate the final and total scores.
	let finalResult = 0;
	let totalResult = 0;
	for (let i = 0; i < results.length; i++) {
		finalResult += results[i] ? exerciseData[i].score : 0;
		totalResult += exerciseData[i].score;
	}

	toggleElementVisibility('final-result', true);
	let finalResultElement = document.getElementById('final-result');
	if (finalResultElement !== null) {
		finalResultElement.innerHTML = `
			Your final result is: <strong>${finalResult} / ${totalResult} 
			(${Math.round(finalResult * 100 / totalResult)}%)</strong>.
		`
	}
}

function showEvaluationMessage(isAnswerCorrect) {
	// Prepares the evaluation panel with the result for the current question
	// and makes it visible.

	toggleElementVisibility('evaluation-container', true);
	let evaluationContainerElement = document.getElementById('evaluation-container');
	if (evaluationContainerElement !== null) {
		evaluationContainerElement.classList.add(isAnswerCorrect ? 'correct' : 'wrong');

		let evaluationMessageElement = document.getElementById('evaluation-message');
		evaluationMessageElement.innerHTML = isAnswerCorrect ? CORRECT_ANSWER_MESSAGE : WRONG_ANSWER_MESSAGE;

		const exercise = exerciseData[exerciseIndex];
		const exerciseScore = exercise.score;
		const visibleScore = isAnswerCorrect ? exerciseScore : 0;
		let scoreElement = document.getElementById('score');
		scoreElement.innerHTML = `Score: <strong>${visibleScore} / ${exerciseScore}</strong>`;

		let correctAnswerElement = document.getElementById('correct-answer');
		correctAnswerElement.innerHTML = `Correct answer is: 
			<strong>${exercise.answerOptions[exercise.answerIndex]}</strong>`;
	}
}

function hideEvaluationMessage() {
	// Hides the evaluation panel.

	collapseEvaluationContainer();
	let evaluationContainerElement = document.getElementById('evaluation-container');
	if (evaluationContainerElement !== null) {
		// Updates the `class` attribute to remove `correct`/`wrong` and/or `expanded` classes.
		evaluationContainerElement.setAttribute('class', '');
	}
	toggleElementVisibility('evaluation-container', false);
}

function toggleEvaluationExpansion() {
	// Expands or collapses the evaluation panel.

	if (isEvaluationExpanded) {
		collapseEvaluationContainer();
	} else {
		expandEvaluationContainer();
	}
}

function expandEvaluationContainer() {
	// Expands the evaluation container.

	toggleElementVisibility('expand', false);
	toggleElementVisibility('collapse', true);
	let evaluationContainerElement = document.getElementById('evaluation-container');
	evaluationContainerElement.classList.add('expanded');
	isEvaluationExpanded = true;
}

function collapseEvaluationContainer() {
	// Collapses the evaluation container.

	toggleElementVisibility('expand', true);
	toggleElementVisibility('collapse', false);
	let evaluationContainerElement = document.getElementById('evaluation-container');
	evaluationContainerElement.classList.remove('expanded');
	isEvaluationExpanded = false;
}

function handleError(errorMessage) {
	// Renders the given error message.

	toggleElementVisibility('error-container', true);
	let errorContainerElement = document.getElementById('error-container');
	if (errorContainerElement !== null) {
		errorContainerElement.innerHTML = `Something went wrong (${errorMessage}).`;
	}
}

function toggleElementVisibility(elementId, isVisible) {
	// Toggles the visibility of the element with id `elementId`.

	let styleDisplayValue = '';
	if (isVisible) {
		styleDisplayValue = 'block';
	} else {
		styleDisplayValue = 'none !important';
	}
	const element = document.getElementById(elementId);
	if (element !== null) {
		element.style = `display: ${styleDisplayValue};`;
	}
}

function hideSpinner() {
	// Hides the spinner element.
	toggleElementVisibility('spinner', false);
}

function showSpinner() {
	// Makes the spinner element visible.
	toggleElementVisibility('spinner', true);
}

function showQuestionContainer() {
	// Makes the question container visible.
	toggleElementVisibility('question-container', true);
}

function hideQuestionContainer() {
	// Hides the question container.
	toggleElementVisibility('question-container', false);
}

function showNextQuestionButton() {
	// Makes the 'Next Question' button visible.
	toggleElementVisibility('next-container', true);
}

function hideNextQuestionButton() {
	// Hides the 'Next Question' button.
	toggleElementVisibility('next-container', false);
}

function showFinalResultButton() {
	// Makes the 'Final Result' button visible.
	toggleElementVisibility('final-result-btn-container', true);
}

function hideFinalResultButton() {
	// Hides the 'Final Result' button.
	toggleElementVisibility('final-result-btn-container', false);
}

function hideEvaluationButton() {
	// Hides the 'Evaluate!' button.
	toggleElementVisibility('evaluate', false);
}

function showEvaluationButton() {
	// Makes the 'Evaluate!' button visible.
	toggleElementVisibility('evaluate', true);
}
