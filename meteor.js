let meteorGameActive = false;
let meteorScore = 0;
let meteorLives = 3;
let meteors = [];
let meteorInterval;
let gameLoopInterval;
let wordsPool = ['python', 'javascript', 'html', 'css', 'react', 'angular', 'vue', 'node', 'express', 'django', 'flask', 'ruby', 'rails', 'java', 'spring', 'go', 'rust', 'csharp', 'swift', 'kotlin', 'dart', 'flutter', 'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'linux', 'unix', 'bash', 'powershell', 'git', 'github', 'gitlab', 'bitbucket', 'jira', 'confluence', 'trello', 'asana', 'slack', 'discord', 'zoom', 'teams', 'meet', 'skype', 'webex', 'figma', 'sketch', 'adobe', 'photoshop', 'illustrator', 'xd', 'invision', 'zeplin', 'marvel', 'framer', 'proto', 'balsamiq', 'axure', 'justinmind', 'uxpin', 'mockplus', 'fluid'];
let spawnRate = 2000;
let fallSpeed = 1.5; // pixels per frame

function openMeteorGame() {
    document.getElementById('meteor-defense-modal').classList.remove('hidden');
    document.getElementById('meteor-overlay').style.display = 'flex';
    document.getElementById('meteor-score').innerText = '0';
    document.getElementById('meteor-lives').innerText = '3';
    document.getElementById('meteor-input').value = '';
    document.getElementById('meteor-input').disabled = true;
}

function closeMeteorGame() {
    document.getElementById('meteor-defense-modal').classList.add('hidden');
    endMeteorGame();
}

function startMeteorGame() {
    document.getElementById('meteor-overlay').style.display = 'none';
    const input = document.getElementById('meteor-input');
    input.disabled = false;
    input.focus();
    input.value = '';
    
    meteorScore = 0;
    meteorLives = 3;
    document.getElementById('meteor-score').innerText = meteorScore;
    document.getElementById('meteor-lives').innerText = meteorLives;
    
    meteors.forEach(m => m.element.remove());
    meteors = [];
    spawnRate = 2000;
    fallSpeed = 1.5;
    
    meteorGameActive = true;
    
    meteorInterval = setInterval(spawnMeteor, spawnRate);
    gameLoopInterval = setInterval(updateMeteors, 16); // ~60fps
}

function spawnMeteor() {
    if (!meteorGameActive) return;
    
    const word = wordsPool[Math.floor(Math.random() * wordsPool.length)];
    const gameArea = document.getElementById('meteor-game-area');
    const areaWidth = gameArea.clientWidth;
    
    const meteorEl = document.createElement('div');
    meteorEl.style.position = 'absolute';
    meteorEl.style.top = '-50px';
    meteorEl.style.left = Math.random() * (areaWidth - 100) + 'px';
    meteorEl.style.padding = '10px 20px';
    meteorEl.style.background = 'linear-gradient(135deg, #ff9800, #ff1744)';
    meteorEl.style.color = '#fff';
    meteorEl.style.borderRadius = '50px';
    meteorEl.style.fontWeight = 'bold';
    meteorEl.style.fontFamily = 'monospace';
    meteorEl.style.fontSize = '1.2rem';
    meteorEl.style.boxShadow = '0 0 20px rgba(255, 152, 0, 0.8)';
    meteorEl.innerText = word;
    
    gameArea.appendChild(meteorEl);
    
    meteors.push({
        element: meteorEl,
        word: word,
        y: -50
    });
    
    // Increase difficulty slowly
    if (spawnRate > 500) spawnRate -= 20;
    fallSpeed += 0.01;
    
    clearInterval(meteorInterval);
    meteorInterval = setInterval(spawnMeteor, spawnRate);
}

function updateMeteors() {
    if (!meteorGameActive) return;
    
    const gameArea = document.getElementById('meteor-game-area');
    const areaHeight = gameArea.clientHeight;
    const groundHeight = 30; // height of DANGER ZONE
    
    for (let i = meteors.length - 1; i >= 0; i--) {
        let m = meteors[i];
        m.y += fallSpeed;
        m.element.style.top = m.y + 'px';
        
        // Check collision with ground
        if (m.y + m.element.clientHeight >= areaHeight - groundHeight) {
            m.element.remove();
            meteors.splice(i, 1);
            loseLife();
        }
    }
}

function loseLife() {
    meteorLives--;
    document.getElementById('meteor-lives').innerText = meteorLives;
    
    const gameArea = document.getElementById('meteor-game-area');
    gameArea.style.background = 'linear-gradient(to bottom, #330000 0%, #1a0000 100%)';
    setTimeout(() => {
        gameArea.style.background = 'linear-gradient(to bottom, #000000 0%, #1a001a 100%)';
    }, 200);
    
    if (meteorLives <= 0) {
        endMeteorGame();
        alert('Game Over! Your score: ' + meteorScore);
        document.getElementById('meteor-overlay').style.display = 'flex';
        document.getElementById('meteor-input').disabled = true;
    }
}

function endMeteorGame() {
    meteorGameActive = false;
    clearInterval(meteorInterval);
    clearInterval(gameLoopInterval);
}

// Hook up input
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('open-minigame-btn')?.addEventListener('click', openMeteorGame);
    
    const input = document.getElementById('meteor-input');
    if (input) {
        input.addEventListener('input', (e) => {
            if (!meteorGameActive) return;
            const typed = e.target.value.trim().toLowerCase();
            
            // Check if matches any meteor
            for (let i = 0; i < meteors.length; i++) {
                if (meteors[i].word === typed) {
                    // Destroy meteor
                    meteors[i].element.remove();
                    meteors.splice(i, 1);
                    
                    // Add score
                    meteorScore += 10;
                    document.getElementById('meteor-score').innerText = meteorScore;
                    
                    // Clear input
                    input.value = '';
                    
                    // Visual feedback
                    const gameArea = document.getElementById('meteor-game-area');
                    gameArea.style.boxShadow = 'inset 0 0 50px rgba(0, 255, 100, 0.3)';
                    setTimeout(() => gameArea.style.boxShadow = 'none', 100);
                    break;
                }
            }
        });
    }
});
