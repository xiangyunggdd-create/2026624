/* Global Audio Manager using Web Audio API */
/* Synthesizes sounds to avoid external file dependencies */

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let bgmNodes = [];
let isBgmPlaying = false;
let masterGain = null;
let bgmTimer = null;

// "Sunny Walk" - Extended High-Register Melody (Loop)
// Key: C Major (High Octave only for brightness, no low freqs)
const melody = [
    // Phrase 1: Cheerful Opening
    { freq: 523.25, dur: 0.3 }, { freq: 659.25, dur: 0.3 }, { freq: 783.99, dur: 0.6 }, // C5 E5 G5
    { freq: 880.00, dur: 0.3 }, { freq: 783.99, dur: 0.3 }, { freq: 659.25, dur: 0.6 }, // A5 G5 E5
    { freq: 698.46, dur: 0.3 }, { freq: 880.00, dur: 0.3 }, { freq: 1046.50, dur: 0.6 }, // F5 A5 C6
    { freq: 987.77, dur: 0.6 }, { freq: 783.99, dur: 0.6 }, // B5 G5

    // Phrase 2: Playful Answer (Higher)
    { freq: 523.25, dur: 0.3 }, { freq: 659.25, dur: 0.3 }, { freq: 783.99, dur: 0.6 }, // C5 E5 G5
    { freq: 880.00, dur: 0.3 }, { freq: 1046.50, dur: 0.3 }, { freq: 1174.66, dur: 0.6 }, // A5 C6 D6
    { freq: 1318.51, dur: 0.3 }, { freq: 1174.66, dur: 0.3 }, { freq: 1046.50, dur: 0.3 }, { freq: 880.00, dur: 0.3 }, // E6 D6 C6 A5
    { freq: 1046.50, dur: 1.2 }, // C6 (Resolve)

    // Phrase 3: Bridge
    { freq: 0, dur: 0.6 },
    { freq: 783.99, dur: 0.3 }, { freq: 659.25, dur: 0.3 }, { freq: 587.33, dur: 0.6 }, // G5 E5 D5
    { freq: 523.25, dur: 0.3 }, { freq: 587.33, dur: 0.3 }, { freq: 659.25, dur: 0.6 }, // C5 D5 E5
    { freq: 698.46, dur: 0.3 }, { freq: 659.25, dur: 0.3 }, { freq: 587.33, dur: 0.6 }, // F5 E5 D5
    { freq: 783.99, dur: 1.2 }, // G5

    // Phrase 4: Loop Turnaround
    { freq: 523.25, dur: 0.3 }, { freq: 659.25, dur: 0.3 }, { freq: 783.99, dur: 0.3 }, { freq: 1046.50, dur: 0.3 }, // C5 E5 G5 C6
    { freq: 1174.66, dur: 0.6 }, { freq: 987.77, dur: 0.6 }, // D6 B5
    { freq: 1046.50, dur: 1.2 }, // C6
    { freq: 0, dur: 2.0 } // Rest before loop
];

let noteIndex = 0;

function initAudio() {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    if (!masterGain) {
        masterGain = audioCtx.createGain();
        masterGain.connect(audioCtx.destination);
        masterGain.gain.value = 0.8; // Master volume (Doubled from 0.4)
    }
}

document.addEventListener('click', () => {
    initAudio();
    if (!isBgmPlaying) startBGM();
}, { once: true });

document.addEventListener('scroll', () => {
    initAudio();
    playScrollWithThrottling();
});

let lastScrollTime = 0;
function playScrollWithThrottling() {
    const now = Date.now();
    if (now - lastScrollTime > 150) {
        playSound('scroll');
        lastScrollTime = now;
    }
}

function startBGM() {
    if (isBgmPlaying) return;
    isBgmPlaying = true;
    initAudio();
    noteIndex = 0;
    playNextNote();
}

function playNextNote() {
    if (!isBgmPlaying) return;

    const note = melody[noteIndex];
    noteIndex = (noteIndex + 1) % melody.length;

    if (note.freq > 0) {
        const now = audioCtx.currentTime;

        // "Celesta" Sound: Pure Sine + Twinkle
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.value = note.freq;
        osc.connect(gain);
        gain.connect(masterGain);

        // Percussive Bell Envelope
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.06, now + 0.02); // 2x gain (was 0.03)
        gain.gain.exponentialRampToValueAtTime(0.001, now + (note.dur * 1.2)); // Decay

        osc.start(now);
        osc.stop(now + note.dur + 1.0); // Allow tail

        // Twinkle Harmonic (Octave up)
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.type = 'sine';
        osc2.frequency.value = note.freq * 2;
        osc2.connect(gain2);
        gain2.connect(masterGain);

        gain2.gain.setValueAtTime(0, now);
        gain2.gain.linearRampToValueAtTime(0.02, now + 0.02); // 2x gain (was 0.01)
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.3); // Short tick

        osc2.start(now);
        osc2.stop(now + 0.3);
    }

    bgmTimer = setTimeout(playNextNote, note.dur * 1000);
}

function stopBGM() {
    isBgmPlaying = false;
    if (bgmTimer) clearTimeout(bgmTimer);
    // Cleanup nodes if needed, generally auto-collected
}

function playSound(type) {
    initAudio();
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.connect(gainNode);
    gainNode.connect(masterGain);

    if (type === 'click' || type === 'pop') {
        // High Woodblock
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
        gainNode.gain.setValueAtTime(0.3, now); // Boosted (was 0.1)
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
    }
    else if (type === 'hover') {
        // High Glass Tick
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1500, now);
        gainNode.gain.setValueAtTime(0.06, now); // 4x boost (was 0.015)
        gainNode.gain.linearRampToValueAtTime(0, now + 0.04);
        osc.start(now);
        osc.stop(now + 0.04);
    }
    else if (type === 'scroll') {
        // New: "Crystal Droplet" - High Pitch Sweep Down
        // Replaces the "Thump" (Heartbeat) and "Pop" (Up-Sweep)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, now); // Start High
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.1); // Drop down

        gainNode.gain.setValueAtTime(0.08, now); // Boosted (was 0.025)
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

        osc.start(now);
        osc.stop(now + 0.1);
    }
    else if (type === 'water' || type === 'rain') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800 + Math.random() * 200, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.15);
        gainNode.gain.setValueAtTime(0.3, now); // Boosted (was 0.08)
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
    }
    else if (type === 'sun' || type === 'morning') {
        playNote(880.00, 0.1, 0.3, 0); // A5 - VOL UP
        setTimeout(() => playNote(1174.66, 0.1, 0.4, 0), 50); // D6 - VOL UP
    }
    else if (type === 'music' || type === 'note') {
        playNote(1046.50, 0.1, 0.2, 0); // C6 - VOL UP
    }
    else if (type === 'night' || type === 'sleep') {
        playNote(440.00, 0.1, 1.0, 0); // A4 - VOL UP
    }
}

function playNote(freq, vol, duration, delay) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.connect(gainNode);
    gainNode.connect(masterGain);

    osc.type = 'sine';
    osc.frequency.value = freq;

    const startTime = audioCtx.currentTime + (delay || 0);
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(vol, startTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.start(startTime);
    osc.stop(startTime + duration);
}

// Auto-attach sound to buttons when DOM loads
document.addEventListener('DOMContentLoaded', () => {
    document.body.addEventListener('click', (e) => {
        if (!isBgmPlaying) startBGM();
        if (e.target.closest('button') || e.target.closest('a') || e.target.closest('.interactive-card')) {
            playSound('click');
        }
    });

    document.querySelectorAll('button, a, .card, .scenario-card').forEach(el => {
        el.addEventListener('mouseenter', () => playSound('hover'));
    });
});
