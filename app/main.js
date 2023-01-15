// this is a basic connection schema to the corresponding data for the table provided.
// this API KEY will expire after January 2022
// Written by GSoosalu & ndr3svt
const API_KEY = 'AIzaSyCfuQLHd0Aha7KuNvHK0p6V6R_0kKmsRX4';
const DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4"];
const SCOPES = "https://www.googleapis.com/auth/spreadsheets.readonly";
let exerciseIndex;
let exerciseIndexInShuffledArray = 0;
let exerciseData;
//let options;
let states = [];
//let correct_answer_index;
//let chosen_answer_index;
let shuffledQuestionIndices = [];
let answerIsEvaluated = false;

const WRONG_ANSWER_MESSAGE = 'Your answer is wrong';
const CORRECT_ANSWER_MESSAGE = 'You are right!';

function handleClientLoad() {
		gapi.load('client', initClient);
}

function initClient() {
	showSpinner();
	hideQuestionContainer();
	gapi.client.init({
		apiKey: API_KEY,
		discoveryDocs: DISCOVERY_DOCS
	}).then(function () {
		getExerciseData();
	}, function(error) {
		console.log(JSON.stringify(error, null, 2));
	});
}

function getExerciseData() {
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

		shuffledQuestionIndices = shuffleArrayIndices(exerciseData.length);

		hideSpinner();
		showQuestionContainer();

		showNextQuestion();
	}, function(response) {
		console.log('Error: ' + response.result.error.message);
	});
}

function hideSpinner() {
	toggleElementVisibility('spinner', false);
}

function showSpinner() {
	toggleElementVisibility('spinner', true);
}

function showQuestionContainer() {
	toggleElementVisibility('question-container', true);
}

function hideQuestionContainer() {
	toggleElementVisibility('question-container', false);
}

function shuffleArrayIndices(length) {
		let indices = [];
		for (let i = 0; i < length; i++) {
				indices.push(i);
		}
		return indices.sort(function () {
				return Math.random() - 0.5;
		});
}

function showNextQuestion() {
		answerIsEvaluated = false;
		hideNextQuestionButton();
		hideEvaluationMessage();
		showEvaluationButton();
		if (exerciseData.length == 0) {
				return; // or show a message?
		}
		exerciseIndex = shuffledQuestionIndices[exerciseIndexInShuffledArray];
		exerciseIndexInShuffledArray += 1;
		// [TODO] check if there are still questions to show.
		let exercise = exerciseData[exerciseIndex];

		let questionElement = document.querySelector('#question');
		questionElement.innerText = exercise.question;

		let optionsContainer = document.querySelector('#options-wrapper');
		optionsContainer.innerHTML = '';
		for (let optionIndex = 0; optionIndex < exercise.answerOptions.length; optionIndex++) {
				optionsContainer.innerHTML += 
						`<span id='option-${optionIndex}' class='unchosen option' onclick='toggleChoice(${optionIndex})'>
								${exercise.answerOptions[optionIndex]}
						</span>`;
		}
}

function toggleChoice(index) {
		if (answerIsEvaluated) {
			// Don't allow to change answer if it has been already evaluated.
			return;
		}
		let oldChosenElement = document.querySelector('.option.chosen');
		if (oldChosenElement !== null) {
				oldChosenElement.classList.remove('chosen');
				oldChosenElement.classList.add('unchosen');
		}

		let optionElement = document.querySelector(`#option-${index}`);
		optionElement.classList.remove('unchosen');
		optionElement.classList.add('chosen');
}

function toggleElementVisibility(elementId, isVisible) {
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

function showNextQuestionButton() {
		toggleElementVisibility('next-container', true);
}

function hideNextQuestionButton() {
		toggleElementVisibility('next-container', false);
}

function myEvaluation() {
		let chosenOptionElement = document.querySelector('.chosen');
		if (chosenOptionElement == null) {
				// Ignore click if no answer has been chosen.
				return;
		}

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
		chosenOptionElement.classList.add(isAnswerCorrect ? 'correct' : 'wrong');
		answerIsEvaluated = true;
		hideEvaluationButton();
		showEvaluationMessage(isAnswerCorrect);
		showNextQuestionButton();
}

function hideEvaluationButton() {
	toggleElementVisibility('evaluate', false);
}

function showEvaluationButton() {
	toggleElementVisibility('evaluate', true);
}

function showEvaluationMessage(isAnswerCorrect) {
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
		correctAnswerElement.innerHTML = `Correct answer is: <strong>${exercise.answerOptions[exercise.answerIndex]}</strong>`;
	}
}

function hideEvaluationMessage() {
	collapseEvaluationContainer();
	let evaluationContainerElement = document.getElementById('evaluation-container');
	if (evaluationContainerElement !== null) {
		evaluationContainerElement.setAttribute('class', '');
	}
	toggleElementVisibility('evaluation-container', false);
}
function expandEvaluationContainer() {
	toggleElementVisibility('expand', false);
	toggleElementVisibility('collapse', true);
	let evaluationContainerElement = document.getElementById('evaluation-container');
	evaluationContainerElement.classList.add('expanded');
}
function collapseEvaluationContainer() {
	toggleElementVisibility('expand', true);
	toggleElementVisibility('collapse', false);
	let evaluationContainerElement = document.getElementById('evaluation-container');
	evaluationContainerElement.classList.remove('expanded');
}



