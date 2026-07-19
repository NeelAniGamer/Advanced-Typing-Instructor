// Cinematic Sound Engine
export const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
export let activeAudioProfile = 'default';

export const SFX = {
    resume: () => { if(audioCtx.state === 'suspended') audioCtx.resume(); },
    playType: () => { 
        SFX.resume(); let osc = audioCtx.createOscillator(); let gain = audioCtx.createGain(); 
        if (activeAudioProfile === 'alien') { osc.type = 'sawtooth'; osc.frequency.setValueAtTime(800, audioCtx.currentTime); osc.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.1); gain.gain.setValueAtTime(0.08, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1); } 
        else if (activeAudioProfile === 'arcade') { osc.type = 'square'; osc.frequency.setValueAtTime(600, audioCtx.currentTime); gain.gain.setValueAtTime(0.05, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08); } 
        else if (activeAudioProfile === 'cherry') { osc.type = 'highpass'; osc.frequency.setValueAtTime(1200, audioCtx.currentTime); gain.gain.setValueAtTime(0.1, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.03); } 
        else { osc.type = 'sine'; osc.frequency.setValueAtTime(400, audioCtx.currentTime); gain.gain.setValueAtTime(0.05, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05); }
        osc.connect(gain); gain.connect(audioCtx.destination); osc.start(); osc.stop(audioCtx.currentTime + 0.1);
    },
    playError: () => { SFX.resume(); let osc = audioCtx.createOscillator(); let gain = audioCtx.createGain(); osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, audioCtx.currentTime); gain.gain.setValueAtTime(0.1, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2); osc.connect(gain); gain.connect(audioCtx.destination); osc.start(); osc.stop(audioCtx.currentTime + 0.2); },
    playWin: () => { SFX.resume(); let osc = audioCtx.createOscillator(); let gain = audioCtx.createGain(); osc.type = 'sine'; osc.frequency.setValueAtTime(600, audioCtx.currentTime); osc.frequency.setValueAtTime(800, audioCtx.currentTime + 0.1); gain.gain.setValueAtTime(0.1, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3); osc.connect(gain); gain.connect(audioCtx.destination); osc.start(); osc.stop(audioCtx.currentTime + 0.3); },
    playRankUpCharge: () => { SFX.resume(); let osc = audioCtx.createOscillator(); let gain = audioCtx.createGain(); osc.type = 'sawtooth'; osc.frequency.setValueAtTime(100, audioCtx.currentTime); osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 1.2); gain.gain.setValueAtTime(0, audioCtx.currentTime); gain.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + 1.0); gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1.2); osc.connect(gain); gain.connect(audioCtx.destination); osc.start(); osc.stop(audioCtx.currentTime + 1.2); },
    playEpicFlash: () => { SFX.resume(); let osc = audioCtx.createOscillator(); let gain = audioCtx.createGain(); osc.type = 'sine'; osc.frequency.setValueAtTime(150, audioCtx.currentTime); osc.frequency.exponentialRampToValueAtTime(20, audioCtx.currentTime + 2.5); gain.gain.setValueAtTime(0.6, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 2.5); osc.connect(gain); gain.connect(audioCtx.destination); osc.start(); osc.stop(audioCtx.currentTime + 2.5); let bufferSize = audioCtx.sampleRate * 2.0; let buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate); let data = buffer.getChannelData(0); for (let i = 0; i < bufferSize; i++) { data[i] = Math.random() * 2 - 1; } let noise = audioCtx.createBufferSource(); noise.buffer = buffer; let noiseFilter = audioCtx.createBiquadFilter(); noiseFilter.type = 'lowpass'; noiseFilter.frequency.setValueAtTime(2000, audioCtx.currentTime); noiseFilter.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 1.5); let noiseGain = audioCtx.createGain(); noiseGain.gain.setValueAtTime(0.7, audioCtx.currentTime); noiseGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1.5); noise.connect(noiseFilter); noiseFilter.connect(noiseGain); noiseGain.connect(audioCtx.destination); noise.start(); },
    playBlast: () => { SFX.resume(); let osc = audioCtx.createOscillator(); let gain = audioCtx.createGain(); osc.type = 'sawtooth'; osc.frequency.setValueAtTime(300, audioCtx.currentTime); osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.15); gain.gain.setValueAtTime(0.3, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15); osc.connect(gain); gain.connect(audioCtx.destination); osc.start(); osc.stop(audioCtx.currentTime + 0.15); }
};

export function setActiveAudioProfile(profile) {
    activeAudioProfile = profile;
}

// Attach to window so inline handlers and other scripts can use them
window.audioCtx = audioCtx;
window.activeAudioProfile = activeAudioProfile;
window.SFX = SFX;
window.setActiveAudioProfile = setActiveAudioProfile;
