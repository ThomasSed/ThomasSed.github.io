// HTML injécté dynamiquement pour garder index.html propre
const guitarHtml = `
    <div class="tuners-wrapper">
        <div class="manual-tuner-section">
            <h2 class="guitar-title">Accordeur standard</h2>
            <p class="guitar-subtitle">Accordez votre guitare à l'oreille (Mi, La, Ré, Sol, Si, Mi)</p>
            
            <div class="strings-grid">
                <!-- E2: 82.41 Hz -->
                <button class="string-btn" onclick="playTone(82.41, this)">
                    <span class="string-name">E</span>
                    <span class="string-note">Grave (6)</span>
                </button>
                <!-- A2: 110.00 Hz -->
                <button class="string-btn" onclick="playTone(110.00, this)">
                    <span class="string-name">A</span>
                    <span class="string-note">(5)</span>
                </button>
                <!-- D3: 146.83 Hz -->
                <button class="string-btn" onclick="playTone(146.83, this)">
                    <span class="string-name">D</span>
                    <span class="string-note">(4)</span>
                </button>
                <!-- G3: 196.00 Hz -->
                <button class="string-btn" onclick="playTone(196.00, this)">
                    <span class="string-name">G</span>
                    <span class="string-note">(3)</span>
                </button>
                <!-- B3: 246.94 Hz -->
                <button class="string-btn" onclick="playTone(246.94, this)">
                    <span class="string-name">B</span>
                    <span class="string-note">(2)</span>
                </button>
                <!-- E4: 329.63 Hz -->
                <button class="string-btn" onclick="playTone(329.63, this)">
                    <span class="string-name">E</span>
                    <span class="string-note">Aigu (1)</span>
                </button>
            </div>
            
            <button id="stop-audio" class="stop-btn" onclick="stopAudio()">
                <span class="material-symbols-outlined">stop_circle</span>
                Arrêter le son
            </button>
        </div>
        
        <div class="auto-tuner-section">
            <h2 class="guitar-title">Accordeur automatique</h2>
            <p class="guitar-subtitle">Utilisez le microphone pour détecter la note jouée</p>
            
            <button id="mic-toggle-btn" class="mic-btn" onclick="toggleMicrophone()">
                <span class="material-symbols-outlined" id="mic-icon">mic</span>
                <span id="mic-btn-text">Activer le microphone</span>
            </button>
            
            <div id="tuner-display" class="tuner-display">
                <div class="frequency-display"><span id="freq-val">--</span> Hz</div>
                <div class="note-display">
                    <span id="note-eng">--</span>
                    <span id="note-fr" class="note-french">--</span>
                </div>
                
                <div class="pitch-gauge-container">
                    <div class="pitch-gauge-center"></div>
                    <div id="pitch-indicator" class="pitch-gauge-indicator" style="left: 50%;"></div>
                </div>
                <div id="pitch-status" class="pitch-status">En attente d'un son...</div>
            </div>
        </div>
    </div>
`;

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('guitar-container');
    if (container) {
        container.innerHTML = guitarHtml;
    }
});

// Guitar Tuner Audio Logic
let audioCtx = null;
let oscillator = null;
let gainNode = null;
let activeBtn = null;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playTone(frequency, btnElement) {
    initAudio();
    
    stopAudio();

    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    oscillator = audioCtx.createOscillator();
    gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);

    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.1);

    oscillator.start();

    btnElement.classList.add('playing');
    activeBtn = btnElement;
    document.getElementById('stop-audio').classList.add('visible');
}

function stopAudio() {
    if (oscillator && gainNode) {
        gainNode.gain.setValueAtTime(gainNode.gain.value, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
        
        try {
            oscillator.stop(audioCtx.currentTime + 0.1);
        } catch (e) {}

        oscillator = null;
        gainNode = null;
    }

    if (activeBtn) {
        activeBtn.classList.remove('playing');
        activeBtn = null;
    }
    const stopButton = document.getElementById('stop-audio');
    if (stopButton) {
        stopButton.classList.remove('visible');
    }
}

// ==========================================
// Microphone Auto Tuner Logic
// ==========================================

const noteStringsEng = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const noteStringsFr = ["Do", "Do#", "Ré", "Ré#", "Mi", "Fa", "Fa#", "Sol", "Sol#", "La", "La#", "Si"];

let audioContextForMic = null;
let analyser = null;
let micStreamSource = null;
let animationId = null;
let isMicActive = false;
let buffer = new Float32Array(2048);
let lastUpdate = 0;

function toggleMicrophone() {
    if (isMicActive) {
        stopMicrophone();
    } else {
        startMicrophone();
    }
}

async function startMicrophone() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        if (!audioContextForMic) {
            audioContextForMic = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        if (audioContextForMic.state === 'suspended') {
            await audioContextForMic.resume();
        }
        
        analyser = audioContextForMic.createAnalyser();
        analyser.fftSize = 2048;
        
        micStreamSource = audioContextForMic.createMediaStreamSource(stream);
        micStreamSource.connect(analyser);
        
        isMicActive = true;
        updateMicUI(true);
        document.getElementById('tuner-display').classList.add('active');
        
        detectPitch();
    } catch (err) {
        alert("Impossible d'accéder au microphone: " + err.message);
    }
}

function stopMicrophone() {
    isMicActive = false;
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    if (micStreamSource) {
        micStreamSource.mediaStream.getTracks().forEach(track => track.stop());
        micStreamSource.disconnect();
        micStreamSource = null;
    }
    updateMicUI(false);
    
    // Default UI state
    document.getElementById('freq-val').innerText = "--";
    document.getElementById('note-eng').innerText = "--";
    document.getElementById('note-fr').innerText = "--";
    document.getElementById('pitch-indicator').style.left = "50%";
    document.getElementById('pitch-indicator').classList.remove('in-tune');
    document.getElementById('pitch-status').classList.remove('in-tune');
    document.getElementById('pitch-status').innerText = "En attente d'un son...";
    
    document.getElementById('tuner-display').classList.remove('active');
}

function updateMicUI(active) {
    const btnText = document.getElementById('mic-btn-text');
    const icon = document.getElementById('mic-icon');
    const btn = document.getElementById('mic-toggle-btn');
    
    if (active) {
        btnText.innerText = "Désactiver le microphone";
        icon.innerText = "mic_off";
        btn.classList.add('listening');
    } else {
        btnText.innerText = "Activer le microphone";
        icon.innerText = "mic";
        btn.classList.remove('listening');
    }
}

function noteFromPitch(frequency) {
    const noteNum = 12 * (Math.log(frequency / 440) / Math.log(2));
    return Math.round(noteNum) + 69;
}

function frequencyFromNoteNumber(note) {
    return 440 * Math.pow(2, (note - 69) / 12);
}

function centsOffFromPitch(frequency, note) {
    return Math.floor(1200 * Math.log(frequency / frequencyFromNoteNumber(note)) / Math.log(2));
}

// Simple Auto-correlation algorithm
function autoCorrelate(buf, sampleRate) {
    let SIZE = buf.length;
    let rms = 0;

    for (let i = 0; i < SIZE; i++) {
        let val = buf[i];
        rms += val * val;
    }
    rms = Math.sqrt(rms / SIZE);
    if (rms < 0.01) // Not enough signal
        return -1;

    let r1 = 0, r2 = SIZE - 1, thres = 0.2;
    for (let i = 0; i < SIZE / 2; i++)
        if (Math.abs(buf[i]) < thres) { r1 = i; break; }
    for (let i = 1; i < SIZE / 2; i++)
        if (Math.abs(buf[SIZE - i]) < thres) { r2 = SIZE - i; break; }

    buf = buf.slice(r1, r2);
    SIZE = buf.length;

    let c = new Array(SIZE).fill(0);
    for (let i = 0; i < SIZE; i++) {
        for (let j = 0; j < SIZE - i; j++) {
            c[i] = c[i] + buf[j] * buf[j + i];
        }
    }

    let d = 0;
    while (c[d] > c[d + 1] && d < SIZE - 2) d++;
    let maxval = -1, maxpos = -1;
    for (let i = d; i < SIZE; i++) {
        if (c[i] > maxval) {
            maxval = c[i];
            maxpos = i;
        }
    }
    let T0 = maxpos;

    // parabolic interpolation
    let x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
    let a = (x1 + x3 - 2 * x2) / 2;
    let b = (x3 - x1) / 2;
    if (a) T0 = T0 - b / (2 * a);

    return sampleRate / T0;
}

function detectPitch() {
    if (!isMicActive) return;

    analyser.getFloatTimeDomainData(buffer);
    let pitch = autoCorrelate(buffer, audioContextForMic.sampleRate);
    
    // Throttling UI updates to keep it readable, but calculate every frame
    const now = performance.now();
    if (pitch !== -1 && now - lastUpdate > 50) {
        lastUpdate = now;
        
        let note = noteFromPitch(pitch);
        let noteEng = noteStringsEng[note % 12];
        let noteFr = noteStringsFr[note % 12];
        let octave = Math.floor(note / 12) - 1;
        
        let cents = centsOffFromPitch(pitch, note);
        
        document.getElementById('freq-val').innerText = pitch.toFixed(1);
        document.getElementById('note-eng').innerText = noteEng + octave;
        document.getElementById('note-fr').innerText = "(" + noteFr + ")";
        
        let indicator = document.getElementById('pitch-indicator');
        let status = document.getElementById('pitch-status');
        
        // [-50, 50] mapped to [0%, 100%] => 50% + cents
        let pos = Math.max(0, Math.min(100, 50 + cents));
        indicator.style.left = pos + "%";
        
        if (Math.abs(cents) < 10) {
            indicator.classList.add('in-tune');
            status.classList.add('in-tune');
            status.innerText = "Parfait";
        } else {
            indicator.classList.remove('in-tune');
            status.classList.remove('in-tune');
            if (cents < 0) {
                status.innerText = "Trop grave";
            } else {
                status.innerText = "Trop aigu";
            }
        }
    }

    if (isMicActive) {
        animationId = requestAnimationFrame(detectPitch);
    }
}
