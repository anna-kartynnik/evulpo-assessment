// this is a basic connection schema to the corresponding data for the table provided.
// this API KEY will expire after January 2022
// Written by GSoosalu & ndr3svt
const API_KEY = 'AIzaSyCfuQLHd0Aha7KuNvHK0p6V6R_0kKmsRX4';
const DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4"];
const SCOPES = "https://www.googleapis.com/auth/spreadsheets.readonly";
let exerciseIndex;
let exerciseData;
let options;
let states = [];
let correct_answer_index;
let chosen_answer_index;

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
				exerciseData = response.result.values.map(function (row) {
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
				console.log(exerciseData);
				showRandomQuestion();
		}, function(response) {
				console.log('Error: ' + response.result.error.message);
		});
}

function showRandomQuestion() {
	if (exerciseData.length == 0) {
		return; // or show a message?
	}
	let exerciseIndex = Math.floor(Math.random() * exerciseData.length);
	let exercise = exerciseData[exerciseIndex];

	let questionElement = document.querySelector('#question');
	questionElement.innerText = exercise.question;

	let optionsContainer = document.querySelector('#options-wrapper')
	for (let optionIndex = 0; optionIndex < exercise.answerOptions.length; optionIndex++) {
		optionsContainer.innerHTML += "<div class='unchosen option'><p class='text'>" + exercise.answerOptions[optionIndex] + "</p></div>";
	}
}

function toggleChoice(index){
		console.log('toggling choices function place holder')
}


function myEvaluation(){
		console.log('an evaluation function place holder')
}

