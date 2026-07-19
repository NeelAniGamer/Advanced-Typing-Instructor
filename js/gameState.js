// Game State Module
// Game Engine State
let isGameActive = false; 
let timer; let maxTime = 60; let timeLeft = maxTime; 
let charIndex = 0; let mistakes = 0; let isTyping = false; 
let currentCategory = "Literature"; 
let currentLevel = 1; let currentMode = "Words"; let currentDiff = "Normal"; 
let mistakesForgiven = 0; let pearlsLeft = 0; let wordsArray = []; 
let currentWordIndex = 0; let gameWpmHistory = []; let testWpmHistory = [];
let currentStreak = 0; let maxStreakInGame = 0; let isOnFire = false; let isBossLevel = false; 
let bossHP = 100; let currentWeatherMult = 1;

// Optimized Key Tracking
let totalKeystrokes = 0; let perfectWords = 0; let imperfectWords = 0;

// Expose to window
window.isGameActive = isGameActive;
window.timer = timer;
window.maxTime = maxTime;
window.timeLeft = timeLeft;
window.charIndex = charIndex;
window.mistakes = mistakes;
window.isTyping = isTyping;
window.currentCategory = currentCategory;
window.currentLevel = currentLevel;
window.currentMode = currentMode;
window.currentDiff = currentDiff;
window.mistakesForgiven = mistakesForgiven;
window.pearlsLeft = pearlsLeft;
window.wordsArray = wordsArray;
window.currentWordIndex = currentWordIndex;
window.gameWpmHistory = gameWpmHistory;
window.testWpmHistory = testWpmHistory;
window.currentStreak = currentStreak;
window.maxStreakInGame = maxStreakInGame;
window.isOnFire = isOnFire;
window.isBossLevel = isBossLevel;
window.bossHP = bossHP;
window.currentWeatherMult = currentWeatherMult;
window.totalKeystrokes = totalKeystrokes;
window.perfectWords = perfectWords;
window.imperfectWords = imperfectWords;
