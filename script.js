let players = [];
let turnQueue = [];
let currentListIndex = 1;
let currentWordIndex = 0;
let currentPlayerIndex = 0;
let sentenceAttempts = 0;

function startGame() {
    const inputs = document.querySelectorAll('.p-input');
    players = [];
    inputs.forEach(input => {
        if (input.value.trim() !== "") {
            players.push({ 
                name: input.value.trim(), 
                score: 0, 
                displayScore: 0 
            });
        }
    });

    if (players.length === 0) return alert("Enter some Hero names!");
    
    document.getElementById('setup-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    document.getElementById('global-scoreboard').classList.remove('hidden');
    
    renderScoreboard();
    animateScores(); 
    nextTurn();
}

function renderScoreboard() {
    const sb = document.getElementById('global-scoreboard');
    sb.innerHTML = players.map((p, idx) => `
        <div id="p-card-${idx}" class="player-score-card">
            <div style="font-size: 12px;">${p.name}</div>
            <div id="p-score-${idx}" class="score-val">0</div>
        </div>
    `).join('');
}

// SUSPENSE LOGIC: Ticks up slowly one by one
function animateScores() {
    players.forEach((p, idx) => {
        if (p.displayScore < p.score) {
            p.displayScore++;
            const el = document.getElementById(`p-score-${idx}`);
            if(el) el.innerText = p.displayScore;
        }
    });
    // Changed to 300ms for much slower, more suspenseful ticking
    setTimeout(animateScores, 900); 
}

function nextTurn() {
    sentenceAttempts = 0;
    
    // Check if we've finished the current list
    const listKey = `list${currentListIndex}`;
    const words = gameData[listKey].words;
    
    if (currentWordIndex >= words.length) {
        showPodium(false);
        return;
    }

    // Refill turn queue if empty
    if (turnQueue.length === 0) {
        turnQueue = [...Array(players.length).keys()].sort(() => Math.random() - 0.5);
    }
    
    currentPlayerIndex = turnQueue.shift();

    // UI Updates
    document.querySelectorAll('.player-score-card').forEach(c => c.classList.remove('active'));
    document.getElementById(`p-card-${currentPlayerIndex}`).classList.add('active');
    document.getElementById('active-player-name').innerText = players[currentPlayerIndex].name;

    document.getElementById('display-word').innerText = words[currentWordIndex].word;
    document.getElementById('current-level-tag').innerText = gameData[listKey].name;
}

function handleWordAnswer(isCorrect) {
    if (!isCorrect) {
        // Move to next word immediately if missed
        currentWordIndex++;
        nextTurn();
    } else {
        showSentenceScreen();
    }
}

function showSentenceScreen() {
    document.getElementById('game-screen').classList.add('hidden');
    document.getElementById('sentence-screen').classList.remove('hidden');
    document.getElementById('post-sentence-controls').classList.add('hidden');
    
    const wordData = gameData[`list${currentListIndex}`].words[currentWordIndex];
    const optionsDiv = document.getElementById('sentence-options');
    optionsDiv.innerHTML = '';

    const shuffledSentences = [...wordData.sentences].sort(() => Math.random() - 0.5);

    shuffledSentences.forEach(s => {
        const btn = document.createElement('button');
        btn.className = 'sentence-option-btn';
        btn.innerText = s.text.replace("___", "_______"); 
        
        btn.onclick = () => {
            if (s.correct) {
                btn.style.background = "var(--accent)";
                btn.style.color = "#000";
                btn.innerText = s.text.replace("___", wordData.word.toUpperCase());
                awardPoints();
            } else {
                sentenceAttempts++;
                btn.style.background = "var(--wrong)";
                btn.disabled = true;
            }
        };
        optionsDiv.appendChild(btn);
    });
}

function awardPoints() {
    const p = players[currentPlayerIndex];
    const basePoints = gameData[`list${currentListIndex}`].points;
    
    let earned = basePoints;
    if (sentenceAttempts === 1) earned = Math.floor(basePoints * 0.5);
    if (sentenceAttempts >= 2) earned = Math.floor(basePoints * 0.2);

    p.score += earned;
    
    const correctSound = document.getElementById('snd-correct');
    if(correctSound) correctSound.play();
    
    document.getElementById('post-sentence-controls').classList.remove('hidden');
}

function finishTurn() {
    currentWordIndex++;
    document.getElementById('sentence-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    nextTurn();
}

function playWordAudio() {
    const word = document.getElementById('display-word').innerText.toLowerCase();
    const audioPath = `audio/list${currentListIndex}_${word}.mp3`;
    new Audio(audioPath).play().catch(() => console.log("Audio not found"));
}

function showPodium(isEarlyExit) {
    // Hide all game areas
    document.getElementById('game-screen').classList.add('hidden');
    document.getElementById('sentence-screen').classList.add('hidden');
    document.getElementById('podium-screen').classList.remove('hidden');

    const sorted = [...players].sort((a, b) => b.score - a.score);
    const winnersDiv = document.getElementById('winners-list');
    winnersDiv.innerHTML = sorted.map((p, i) => `
        <p style="font-size:2rem; margin: 10px 0;">
            ${i === 0 ? '👑' : ''} ${p.name}: ${p.score}
        </p>
    `).join('');

    if (isEarlyExit || currentListIndex >= 9) {
        document.getElementById('podium-title').innerText = "🏆 Grand Champions! 🏆";
        document.getElementById('next-level-btn').classList.add('hidden');
    } else {
        document.getElementById('podium-title').innerText = "World Complete!";
        document.getElementById('next-level-btn').classList.remove('hidden');
    }
}

function nextLevel() {
    // Increment level and reset word counter
    currentListIndex++;
    currentWordIndex = 0;
    
    // Switch screens
    document.getElementById('podium-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    
    // Reset the turn queue for the new level
    turnQueue = [];
    nextTurn();
}

function endGame() {
    // Logic for "Finish Early"
    showPodium(true);
}