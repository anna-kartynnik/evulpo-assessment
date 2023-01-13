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

const WRONG_ANSWER_MESSAGE = 'Unfortunately, your answer is wrong';
const CORRECT_ANSWER_MESSAGE = 'You are right!';

function handleClientLoad() {
		gapi.load('client', initClient);
}

function initClient() {
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

				showNextQuestion();
		}, function(response) {
				console.log('Error: ' + response.result.error.message);
		});
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
	hideNextQuestionButton();
	showEvaluationMessage('');
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
			`<div id='option-${optionIndex}' class='unchosen option' onclick='toggleChoice(${optionIndex})'>
				<p class='text'>${exercise.answerOptions[optionIndex]}</p>
			</div>`;
	}
}

function toggleChoice(index) {
	let oldChosenElement = document.querySelector('.option.chosen');
	if (oldChosenElement !== null) {
		oldChosenElement.classList.remove('chosen');
		oldChosenElement.classList.add('unchosen');
	}

	let optionElement = document.querySelector(`#option-${index}`);
	optionElement.classList.remove('unchosen');
	optionElement.classList.add('chosen');
}

function toggleNextQuestionButtonVisibility(isVisible) {
	let styleDisplayValue = '';
	if (isVisible) {
		styleDisplayValue = 'block';
	} else {
		styleDisplayValue = 'none';
	}
	const nextQuestionBtnElement = document.querySelector('#next');
	nextQuestionBtnElement.style = `display: ${styleDisplayValue};`;
}

function showNextQuestionButton() {
	toggleNextQuestionButtonVisibility(true);
}

function hideNextQuestionButton() {
	toggleNextQuestionButtonVisibility(false);
}

function myEvaluation() {
	console.log('an evaluation function place holder');
	let chosenOptionElement = document.querySelector('.chosen');
	if (chosenOptionElement == null) {
		// Ignore click if no answer has been chosen.
		return;
	}

	let chosenAnswerIndex = parseInt(chosenOptionElement.id.split('-')[1]);
	let exercise = exerciseData[exerciseIndex];
	let correctAnswerIndex = exercise.answerIndex;
	let evaluationMessage = '';
	if (chosenAnswerIndex != correctAnswerIndex) {
		evaluationMessage = WRONG_ANSWER_MESSAGE;
	} else {
		evaluationMessage = CORRECT_ANSWER_MESSAGE;
	}
	showEvaluationMessage(evaluationMessage);
	showNextQuestionButton();
}

function showEvaluationMessage(message) {
	let evaluationMessageElement = document.querySelector('#evaluation-message');
	evaluationMessageElement.innerHTML = `
		<p>${message}</p>
	`;
}



