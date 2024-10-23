// play-quiz.js
console.log("Quiz script loaded"); // Add this to the top of play-quiz.js

const startButton = document.getElementById('start-btn');
const nextButton = document.getElementById('next-btn');
const questionContainer = document.getElementById('que-block');
const questionElement = document.getElementById('que');
const answerButtonsElement = document.getElementById('ans-options');
const result = document.getElementById('display-result');

let shuffledQ, currQIndex;
let score = 0;

startButton.addEventListener('click', startGame);
nextButton.addEventListener('click', () => {
    currQIndex++;
    setNextQuestion();
});

function startGame() {
    startButton.classList.add('hide');
    shuffledQ = questions.sort(() => Math.random() - 0.5);
    currQIndex = 0;
    score = 0;
    questionContainer.classList.remove('hide');
    setNextQuestion();
}

function setNextQuestion() {
    resetState();
    showQues(shuffledQ[currQIndex]);
}

function showQues(questions) {
    questionElement.innerText = questions.question;
    questions.answers.forEach(answers => {
        const button = document.createElement('button');
        button.innerText = answers.text;
        button.classList.add('btn');
        if (answers.right) {
            button.dataset.right = answers.right;
        }
        button.addEventListener('click', selectAnswer);
        answerButtonsElement.appendChild(button);
    });
}

function resetState() {
    clearStatusClass(document.body);
    nextButton.classList.add('hide');
    result.classList.add('hide');
    while (answerButtonsElement.firstChild) {
        answerButtonsElement.removeChild(answerButtonsElement.firstChild);
    }
}

function selectAnswer(e) {
    const selectedBtn = e.target;
    const right = selectedBtn.dataset.right;
    setStatusClass(document.body, right);
    if (right) {
        score++;
    }
    Array.from(answerButtonsElement.children).forEach(button => {
        setStatusClass(button, button.dataset.right);
    });
    if (currQIndex < shuffledQ.length - 1) {
        nextButton.classList.remove('hide');
    } else {
        startButton.innerText = 'Restart';
        startButton.classList.remove('hide');
        questionContainer.classList.add('hide');
        result.classList.remove('hide');
        if (score === shuffledQ.length) {
            result.innerText = `That's a perfect score! ${score}/${score}`;
        } else if (score >= shuffledQ.length / 2) {
            result.innerText = `Outstanding! Your score: ${score}/${shuffledQ.length}`;
        } else {
            result.innerText = `Oh no! It looks like this quiz was a bit tricky. Your score: ${score}/${shuffledQ.length}`;
        }
    }
}

function setStatusClass(element, right) {
    clearStatusClass(element);
    if (right) {
        element.classList.add('right');
    } else {
        element.classList.add('wrong');
    }
}

function clearStatusClass(element) {
    element.classList.remove('right');
    element.classList.remove('wrong');
}

const questions = [
    {
        question: "What is 2 + 2?",
        answers: [
            { text: '4', right: true },
            { text: '5', right: false },
            { text: '2', right: false },
            { text: '1', right: false }
        ]
    },
    {
        question: "What is 2 + 3?",
        answers: [
            { text: '4', right: false },
            { text: '5', right: true },
            { text: '2', right: false },
            { text: '1', right: false }
        ]
    }
];
