const questionBank = {
  Math: [
    ["What is 8 × 7?", "56", "54", "64", "48"],
    ["What is 15% of 200?", "30", "15", "20", "35"],
    ["Solve: x + 9 = 17.", "8", "7", "9", "26"],
    ["What is 12 squared?", "144", "124", "24", "121"],
    ["What is 3/4 as a decimal?", "0.75", "0.25", "0.34", "0.8"],
    ["What is the perimeter of a square with sides of 5?", "20", "10", "25", "15"],
    ["What is 48 ÷ 6?", "8", "6", "7", "9"],
    ["Which number is prime?", "13", "15", "21", "27"],
    ["What is 2³?", "8", "6", "9", "12"],
    ["What is the mean of 2, 4, and 6?", "4", "3", "5", "6"]
  ],
  Science: [
    ["Which planet is known as the Red Planet?", "Mars", "Venus", "Jupiter", "Saturn"],
    ["What gas do plants absorb for photosynthesis?", "Carbon dioxide", "Oxygen", "Nitrogen", "Hydrogen"],
    ["What is the chemical symbol for water?", "H₂O", "CO₂", "O₂", "NaCl"],
    ["What force keeps planets in orbit?", "Gravity", "Friction", "Magnetism", "Heat"],
    ["What part of a cell contains its DNA?", "Nucleus", "Membrane", "Cytoplasm", "Ribosome"],
    ["What is the boiling point of water at sea level in °C?", "100°C", "0°C", "50°C", "200°C"],
    ["Which organ pumps blood through the body?", "Heart", "Lung", "Liver", "Kidney"],
    ["What is Earth's outermost solid layer called?", "Crust", "Mantle", "Core", "Atmosphere"],
    ["What energy comes from the Sun?", "Solar energy", "Geothermal energy", "Chemical energy", "Nuclear fusion in batteries"],
    ["Which state of matter has a fixed volume but no fixed shape?", "Liquid", "Solid", "Gas", "Plasma"]
  ],
  Programming: [
    ["What does HTML structure?", "Web page content", "Database indexes", "Computer memory", "Network cables"],
    ["Which language is used to style a web page?", "CSS", "SQL", "Java", "Python"],
    ["Which JavaScript value represents true or false?", "Boolean", "String", "Array", "Object"],
    ["What does a loop do?", "Repeats instructions", "Deletes a file", "Creates a database", "Styles text"],
    ["What does SQL mainly work with?", "Databases", "Images", "Animations", "Audio files"],
    ["Which symbol begins a JavaScript single-line comment?", "//", "<!--", "##", "**"],
    ["What is a function?", "A reusable block of code", "A web color", "A database row", "A file extension"],
    ["What does an array store?", "A list of values", "Only one character", "Only a password", "A web address"],
    ["Which HTML tag creates a link?", "<a>", "<p>", "<img>", "<div>"],
    ["What is debugging?", "Finding and fixing errors", "Publishing a website", "Changing the font", "Installing hardware"]
  ],
  English: [
    ["Which word is a noun?", "Teacher", "Quickly", "Blueish", "Run"],
    ["What is the plural of 'child'?", "Children", "Childs", "Childes", "Childrens"],
    ["Which sentence uses the correct punctuation?", "Where are you going?", "Where are you going.", "Where are you going,", "Where are you going!"],
    ["Which word means the opposite of 'ancient'?", "Modern", "Old", "Historic", "Early"],
    ["Which word is a verb?", "Jump", "Chair", "Bright", "Careful"],
    ["Complete: She ___ to school yesterday.", "went", "go", "going", "goes"],
    ["Which word is a synonym for 'happy'?", "Joyful", "Angry", "Tired", "Afraid"],
    ["Which word is an adjective in 'The tall tree grew'?", "tall", "tree", "grew", "The"],
    ["Which sentence is grammatically correct?", "They are going home.", "They is going home.", "They am going home.", "They be going home."],
    ["What does a period usually mark?", "The end of a statement", "A question", "A quotation", "A list item"]
  ]
};

let selectedCategory = "Math";
let round = [];
let questionIndex = 0;
let score = 0;
let streak = 0;
let bestStreak = 0;
let secondsLeft = 20;
let timerId = null;
let answered = false;

function shuffle(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function stopTimer() {
  if (timerId !== null) clearInterval(timerId);
  timerId = null;
}

function showGamePanel(panel) {
  for (const id of ["gameSetup", "gamePlay", "gameResult"]) $(id).classList.toggle("hidden", id !== panel);
}

function selectCategory(category) {
  selectedCategory = category;
  document.querySelectorAll(".subject-card").forEach(card => {
    const selected = card.dataset.category === category;
    card.classList.toggle("selected", selected);
    card.setAttribute("aria-pressed", String(selected));
  });
  $("startGameBtn").textContent = `Start ${category} Quest`;
}

function startGame() {
  stopTimer();
  round = shuffle(questionBank[selectedCategory]);
  questionIndex = 0;
  score = 0;
  streak = 0;
  bestStreak = 0;
  showGamePanel("gamePlay");
  renderQuestion();
}

function renderQuestion() {
  answered = false;
  const [prompt, correct, ...incorrect] = round[questionIndex];
  $("questionCount").textContent = `Question ${questionIndex + 1} of ${round.length}`;
  $("scoreCount").textContent = score;
  $("streakCount").textContent = streak;
  $("gameProgress").style.width = `${questionIndex / round.length * 100}%`;
  $("gameCategoryLabel").textContent = `${selectedCategory} Quest`;
  $("questionText").textContent = prompt;
  $("answerFeedback").classList.add("hidden");
  $("nextQuestionBtn").classList.add("hidden");
  $("answerOptions").replaceChildren();
  shuffle([correct, ...incorrect]).forEach((option, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "answer-option";
    button.dataset.answer = option;
    const letter = document.createElement("span");
    letter.textContent = "ABCD"[index];
    const label = document.createElement("strong");
    label.textContent = option;
    button.append(letter, label);
    button.addEventListener("click", () => submitAnswer(option));
    $("answerOptions").append(button);
  });
  secondsLeft = 20;
  updateTimer();
  stopTimer();
  timerId = setInterval(() => {
    secondsLeft--;
    updateTimer();
    if (secondsLeft <= 0) submitAnswer(null);
  }, 1000);
}

function updateTimer() {
  $("timerText").textContent = `${secondsLeft} second${secondsLeft === 1 ? "" : "s"}`;
  $("timerText").classList.toggle("timer-warning", secondsLeft <= 5);
}

function submitAnswer(choice) {
  if (answered) return;
  answered = true;
  stopTimer();
  const correct = round[questionIndex][1];
  const isCorrect = choice === correct;
  if (isCorrect) {
    score++;
    streak++;
    bestStreak = Math.max(bestStreak, streak);
  } else streak = 0;
  $("scoreCount").textContent = score;
  $("streakCount").textContent = streak;
  document.querySelectorAll(".answer-option").forEach(button => {
    button.disabled = true;
    if (button.dataset.answer === correct) button.classList.add("correct");
    else if (button.dataset.answer === choice) button.classList.add("wrong");
  });
  const feedback = $("answerFeedback");
  feedback.textContent = isCorrect ? "Correct! Nice work." : `${choice === null ? "Time is up!" : "Not quite."} The answer is ${correct}.`;
  feedback.className = `answer-feedback ${isCorrect ? "feedback-correct" : "feedback-wrong"}`;
  $("nextQuestionBtn").textContent = questionIndex === round.length - 1 ? "See Results" : "Next Question";
  $("nextQuestionBtn").classList.remove("hidden");
}

async function finishGame() {
  stopTimer();
  showGamePanel("gameResult");
  $("gameProgress").style.width = "100%";
  $("resultEmoji").textContent = score >= 8 ? "🏆" : score >= 5 ? "⭐" : "📚";
  $("resultTitle").textContent = score >= 8 ? "Great work!" : "Quest complete!";
  $("resultMessage").textContent = `You finished the ${selectedCategory} Quest. ${score < 8 ? "Play again to improve your score!" : "You know your stuff!"}`;
  $("finalScore").textContent = `${score} / ${round.length}`;
  $("finalPercent").textContent = `${Math.round(score / round.length * 100)}%`;
  $("finalStreak").textContent = bestStreak;
  $("finalPoints").textContent = score * 10;
  $("saveStatus").textContent = "Saving your score...";
  try {
    if (!currentUser || !db) throw new Error("Sign in to save your score.");
    const { error } = await db.from("quiz_results").insert({
      user_id: currentUser.id, category: selectedCategory, score,
      total: round.length, best_streak: bestStreak
    });
    if (error) throw error;
    $("saveStatus").textContent = "Score saved to your account.";
    await loadGameBest();
  } catch (error) {
    $("saveStatus").textContent = `Score could not be saved: ${error.message}`;
  }
}

async function loadGameBest() {
  if (!db || !currentUser) return;
  const { data: results, error } = await db.from("quiz_results")
    .select("score").eq("user_id", currentUser.id).order("score", { ascending: false }).limit(1);
  if (!error) $("gameBestScore").textContent = `${results?.[0]?.score ?? 0} / 10`;
}

document.querySelectorAll(".subject-card").forEach(card => {
  card.addEventListener("click", () => selectCategory(card.dataset.category));
});
selectCategory(selectedCategory);
$("startGameBtn").addEventListener("click", startGame);
$("nextQuestionBtn").addEventListener("click", () => {
  if (!answered) return;
  questionIndex++;
  if (questionIndex >= round.length) finishGame();
  else renderQuestion();
});
$("playAgainBtn").addEventListener("click", startGame);
$("changeSubjectBtn").addEventListener("click", () => { stopTimer(); showGamePanel("gameSetup"); });
