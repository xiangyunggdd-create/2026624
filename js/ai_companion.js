document.addEventListener('DOMContentLoaded', () => {
    const aiVideo = document.getElementById('ai-video');
    const aiCanvas = document.getElementById('ai-canvas');
    const aiCtx = aiCanvas.getContext('2d', { willReadFrequently: true });
    const aiText = document.getElementById('ai-text');

    // --- Assets ---
    // Expanded idle list with more variety to satisfy the "random & min 3 gap" rule
    // Expanded idle list with all 14 videos correctly mapped
    // Idle deck now includes calm actions to increase variety
    const videos = {
        idle: [
            '/static/video/maid/%E5%B0%8F%E5%B9%AB%E6%89%8B%20%E5%BE%85%E6%A9%9F1.mp4',       // Idle 1
            '/static/video/maid/idle_2.mp4',                                            // Idle 2
            '/static/video/maid/%E5%B0%8F%E5%B9%AB%E6%89%8B%E6%8F%AE%E6%89%8B.mp4',         // Wave
            '/static/video/maid/action_generic.mp4',                                    // Generic 1
            '/static/video/maid/action_generic_2.mp4',                                  // Generic 2
            '/static/video/maid/action_generic_3.mp4',                                  // Generic 3
            '/static/video/maid/action_joy.mp4',                                        // Joy 1
            '/static/video/maid/action_joy_2.mp4',                                      // Joy 2
            '/static/video/maid/action_shy.mp4',                                        // Shy 1
            '/static/video/maid/action_shy_2.mp4',                                      // Shy 2
            '/static/video/maid/action_surprised.mp4',                                  // Surprised 1
            '/static/video/maid/action_surprised_2.mp4',                                // Surprised 2
            '/static/video/maid/action_think.mp4',                                      // Think 1
            '/static/video/maid/action_think_2.mp4'                                     // Think 2
        ],
        action: {
            generic: [
                '/static/video/maid/action_generic.mp4',
                '/static/video/maid/action_generic_2.mp4',
                '/static/video/maid/action_generic_3.mp4'
            ],
            joy: [
                '/static/video/maid/action_joy.mp4',
                '/static/video/maid/action_joy_2.mp4'
            ],
            shy: [
                '/static/video/maid/action_shy.mp4',
                '/static/video/maid/action_shy_2.mp4'
            ],
            surprised: [
                '/static/video/maid/action_surprised.mp4',
                '/static/video/maid/action_surprised_2.mp4'
            ],
            think: [
                '/static/video/maid/action_think.mp4',
                '/static/video/maid/action_think_2.mp4'
            ]
        }
    };

    // --- Audio Assets (19 files) ---
    const audioFiles = [
        '今天感覺不錯呢。',
        '做得很棒！植物現在狀態很好喔。',
        '只要維持這樣的節奏，它就能慢慢長得更好。',
        '哇，它今天看起來特別有精神呢！',
        '嗨！今天也一起關心一下你的植物吧。',
        '它現在需要一點照顧，我們一起來幫幫它吧。',
        '很好！這樣的照顧對它真的很有幫助。',
        '怎麼了？想看看什麼嗎？',
        '我一直都在這裡。',
        '我在看看它現在的狀態。',
        '我在這裡喔，隨時都可以一起照顧植物。 - 複製',
        '我就在這裡陪你。',
        '我是你的植物AI小助手!有什麼問題都可以詢問我!',
        '我會一直在這裡，陪你一起照顧它。',
        '早安我的主人!',
        '最近的環境有點變化，我們一起注意看看吧。',
        '準備好了，我們繼續吧。',
        '這樣看著它，也是一種陪伴。',
        '隨時都可以開始喔。'
    ];

    const audios = {};
    audioFiles.forEach((name, index) => {
        // Use index + 1 for filename (1.mp3, 2.mp3...) to avoid encoding issues
        audios[name] = new Audio(`/static/audio/maid/${index + 1}.mp3`);
    });

    // Keys for legacy support
    const legacyAudioMap = {
        'greeting': '早安我的主人!',
        'sunny': '今天感覺不錯呢。',
        'compliment': '做得很棒！植物現在狀態很好喔。',
        'ask_plan': '怎麼了？想看看什麼嗎？',
        'rest': '這樣看著它，也是一種陪伴。',
        'intro_long': '我在這裡喔，隨時都可以一起照顧植物。 - 複製',
        'intro_new': '我是你的植物AI小助手!有什麼問題都可以詢問我!'
    };

    // Preload
    Object.values(audios).forEach(a => a.load());

    let isSpeaking = false;

    // --- Persistence & History V3 ---
    const STORAGE_KEY = 'PLANTMATE_AI_STATE_V3';

    // Strict History Queues (Memory of last 5 items to prevent repeat)
    let strictVideoHistory = [];
    let strictAudioHistory = [];
    const MAX_HISTORY = 5;

    // Deck State
    let idleDeck = [];
    let audioDeck = [];

    function saveCompanionState() {
        const state = {
            idleDeck,
            audioDeck,
            strictVideoHistory,
            strictAudioHistory
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }

    function loadCompanionState() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const state = JSON.parse(saved);
                if (Array.isArray(state.idleDeck)) idleDeck = state.idleDeck;
                if (Array.isArray(state.audioDeck)) audioDeck = state.audioDeck;
                if (Array.isArray(state.strictVideoHistory)) strictVideoHistory = state.strictVideoHistory;
                if (Array.isArray(state.strictAudioHistory)) strictAudioHistory = state.strictAudioHistory;
                console.log("Restored AI State (V3):", state);
            }
        } catch (e) {
            console.error("Failed to load AI state", e);
        }
    }

    // Load state immediately
    loadCompanionState();

    // --- Mobile Audio Unlock ---
    let audioUnlocked = false;
    function unlockAudio() {
        if (audioUnlocked) return;

        // Silent dummy audio to unlock context
        const dummy = new Audio();
        dummy.src = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAABIADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMD//////////////////////////////////////////////////////////////////wAAAP//OEAAAAAAAAAAAAAAAAAAAAAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//OEAAABAAAAAgAAAAAABAAAA';

        dummy.play().then(() => {
            audioUnlocked = true;
            console.log("Audio Context Unlocked");

            // Nudge all real audios
            Object.values(audios).forEach(a => {
                a.muted = false;
                a.load();
            });

            showBubble("聲音已開啟 🔊", 2000);

            document.removeEventListener('click', unlockAudio);
            document.removeEventListener('touchstart', unlockAudio);
        }).catch(e => {
            // Wait for next interaction
        });
    }
    document.addEventListener('click', unlockAudio);
    document.addEventListener('touchstart', unlockAudio);

    // Helper: Fisher-Yates
    function shuffle(array) {
        let currentIndex = array.length, randomIndex;
        while (currentIndex !== 0) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
            [array[currentIndex], array[randomIndex]] = [
                array[randomIndex], array[currentIndex]];
        }
        return array;
    }

    // --- Video Logic ---
    let lastPlayedIdle = null;

    // Helper: Get next idle from Shuffled Deck
    function getNextIdleSrc() {
        if (idleDeck.length === 0) {
            idleDeck = shuffle([...videos.idle]);
            console.log("Refilled Idle Deck:", idleDeck);
        }

        // Find a candidate that is NOT in strict history
        let candidateIndex = idleDeck.length - 1;
        let selected = idleDeck[candidateIndex];
        let attempts = 0;

        // Try to swap if in history
        while (strictVideoHistory.includes(selected) && attempts < idleDeck.length) {
            const swapIdx = Math.floor(Math.random() * idleDeck.length);
            [idleDeck[candidateIndex], idleDeck[swapIdx]] = [idleDeck[swapIdx], idleDeck[candidateIndex]];
            selected = idleDeck[candidateIndex];
            attempts++;
        }

        // If still in history after attempts, just accept it (avoid empty display)
        // But logging it
        if (strictVideoHistory.includes(selected)) {
            console.warn("Could not find unique video, clearing strict history.");
            strictVideoHistory = [];
        }

        selected = idleDeck.pop();
        lastPlayedIdle = selected;

        // Update Strict History
        strictVideoHistory.push(selected);
        if (strictVideoHistory.length > MAX_HISTORY) strictVideoHistory.shift();

        saveCompanionState();

        console.log(`Picking Idle. Deck remaining: ${idleDeck.length}. Selected: ${selected}`);
        return selected;
    }

    let animationFrameId;

    // --- Dual-Video Double Buffering & Preload Logic ---
    let activeVideo = aiVideo;
    let bufferVideo = document.getElementById('ai-video-buffer');
    let nextActionPending = null;
    let isTransitioning = false;

    // Init buffer
    bufferVideo.muted = true;
    activeVideo.muted = true;

    // Transition State
    let transitionState = {
        isFading: false,
        startTime: 0,
        duration: 500, // 500ms cross-fade
        outgoingVideo: null,
        incomingVideo: null
    };

    // New Core Logic: Seamless Switching & Error Handling
    function prepareNextIdle() {
        if (isSpeaking || nextActionPending) return;

        // Recursive retry helper
        const tryLoad = (attempts = 0) => {
            if (attempts > 10) { // Increased attempts for larger pool
                console.warn("Too many load failures, falling back to simple loop");
                return;
            }

            const nextSrc = getNextIdleSrc();
            console.log("Preloading idle:", nextSrc);

            // Clean up previous listeners
            bufferVideo.onerror = null;

            bufferVideo.src = nextSrc;
            bufferVideo.loop = false;
            bufferVideo.muted = true;
            bufferVideo.defaultPlaybackRate = 1.2;
            bufferVideo.playbackRate = 1.2;

            bufferVideo.onerror = (e) => {
                console.error("Buffer video failed to load:", nextSrc, e);
                // Important: If it failed, remove it from history so we don't count it as "played"
                // Actually, if we keep it in history, we won't pick it again for 5 turns.
                // That is GOOD behavior for a broken video.
                // So let's keep it in history.
                tryLoad(attempts + 1);
            };

            bufferVideo.load();
        };

        tryLoad();
    }

    // Triggered when Active Video Ends
    function handleVideoEnd() {
        if (isSpeaking) {
            activeVideo.play();
            return;
        }

        // Normal Idle Flow
        if (bufferVideo.readyState >= 3) {
            performSwap();
        } else {
            console.warn("Buffer not ready (State: " + bufferVideo.readyState + "), looping current video...");
            activeVideo.play();

            // Listen for readiness to swap ASAP
            const onBufferCanPlay = () => {
                if (!isSpeaking && activeVideo.paused === false) {
                    performSwap();
                }
                bufferVideo.removeEventListener('canplay', onBufferCanPlay);
            };
            bufferVideo.addEventListener('canplay', onBufferCanPlay);
        }
    }

    function performSwap() {
        if (isTransitioning) return;
        isTransitioning = true;

        const input = bufferVideo;

        input.play().then(() => {
            input.playbackRate = 1.2;

            // Start Visual Transition
            transitionState.isFading = true;
            transitionState.startTime = performance.now();
            transitionState.outgoingVideo = activeVideo;
            transitionState.incomingVideo = input;

            // Swap logical pointers immediately
            const oldVideo = activeVideo;
            oldVideo.onended = null; // Unbind old listener

            activeVideo = input;
            bufferVideo = oldVideo;

            // Bind listener to new active
            activeVideo.onended = handleVideoEnd;

            // Important: Clear pending flag so new preloads can happen
            nextActionPending = null;

            // Start preloading NEXT idle immediately (unless action)
            if (!isSpeaking) {
                setTimeout(prepareNextIdle, 100);
            }

            isTransitioning = false;

        }).catch(e => {
            console.error("Swap play failed", e);
            isTransitioning = false;
            activeVideo.play(); // Fallback
        });
    }

    // Action/Interaction Entry Point
    // Forces a transition to a specific video
    async function transitionToAction(src, isLoop) {
        // Interrupt preloading
        nextActionPending = src;

        // Clear error handlers
        bufferVideo.onerror = null;

        // Load target into buffer
        bufferVideo.src = src;
        bufferVideo.loop = isLoop;
        bufferVideo.muted = true;
        bufferVideo.defaultPlaybackRate = 1.2;
        bufferVideo.load();

        return new Promise((resolve) => {
            const onCanPlay = () => {
                bufferVideo.removeEventListener('canplay', onCanPlay);
                bufferVideo.onerror = null;
                performSwap();
                resolve();
            };

            const onError = (e) => {
                // If action fails, gracefully return to idle
                console.error("Action video failed:", src);
                nextActionPending = null; // Clear lock
                prepareNextIdle();
                resolve();
            };

            bufferVideo.onerror = onError;

            if (bufferVideo.readyState >= 3) {
                onCanPlay();
            } else {
                bufferVideo.addEventListener('canplay', onCanPlay);
            }
        });
    }


    // --- Chroma Key Render Loop (Blue Key) ---
    aiCanvas.width = 300;
    aiCanvas.height = 400;

    // Optimization: Pre-calculate constants
    const LOWER_THRESH = 15;
    const UPPER_THRESH = 40;
    const THRESH_DIFF = UPPER_THRESH - LOWER_THRESH;
    const INV_THRESH_DIFF = 1.0 / THRESH_DIFF;

    // Helper to process a frame from video -> imageData
    function processFrame(video, tempCtx, width, height) {
        if (video.readyState < 2 || video.paused || video.ended) return null;

        // Draw video to local context
        tempCtx.drawImage(video, 0, 0, width, height);
        const frame = tempCtx.getImageData(0, 0, width, height);
        const data = frame.data;
        const l = data.length / 4;

        for (let i = 0; i < l; i++) {
            const idx = i * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];

            // Optimization: Simple Math.max replacement
            const maxRG = (r > g) ? r : g;
            const diff = b - maxRG;

            if (diff > LOWER_THRESH) {
                let alpha = 1.0 - ((diff - LOWER_THRESH) * INV_THRESH_DIFF);
                if (alpha <= 0) {
                    data[idx + 3] = 0;
                } else {
                    data[idx + 3] = (alpha * 255) | 0;
                    data[idx + 2] = (maxRG + 20 < b) ? (maxRG + 20) : b;
                }
            }
        }
        return frame;
    }

    // Contexts for mixing
    const offscreenCanvas = document.createElement('canvas');
    const offCtx = offscreenCanvas.getContext('2d', { willReadFrequently: true });
    offscreenCanvas.width = 300;
    offscreenCanvas.height = 400;

    function renderChromaKey() {
        animationFrameId = requestAnimationFrame(renderChromaKey);

        // Ensure size
        if (activeVideo.videoWidth > 0 && aiCanvas.width !== activeVideo.videoWidth) {
            aiCanvas.width = activeVideo.videoWidth;
            aiCanvas.height = activeVideo.videoHeight;
            offscreenCanvas.width = activeVideo.videoWidth;
            offscreenCanvas.height = activeVideo.videoHeight;
        }

        // Logic
        if (transitionState.isFading) {
            const now = performance.now();
            const elapsed = now - transitionState.startTime;
            const progress = Math.min(elapsed / transitionState.duration, 1.0); // 0.0 to 1.0

            // 1. Process Incoming (Main Active)
            aiCtx.globalAlpha = 1.0;
            aiCtx.drawImage(transitionState.incomingVideo, 0, 0, aiCanvas.width, aiCanvas.height);
            const inFrame = aiCtx.getImageData(0, 0, aiCanvas.width, aiCanvas.height);
            keyFrameData(inFrame.data);
            aiCtx.putImageData(inFrame, 0, 0);

            // 2. Process Outgoing.
            offCtx.drawImage(transitionState.outgoingVideo, 0, 0, offscreenCanvas.width, offscreenCanvas.height);
            const outFrame = offCtx.getImageData(0, 0, offscreenCanvas.width, offscreenCanvas.height);
            keyFrameData(outFrame.data);
            offCtx.putImageData(outFrame, 0, 0);

            // 3. Blending
            aiCtx.globalAlpha = 1.0 - progress; // Fade out
            aiCtx.drawImage(offscreenCanvas, 0, 0);
            aiCtx.globalAlpha = 1.0; // Reset

            // Check end
            if (progress >= 1.0) {
                transitionState.isFading = false;
                transitionState.outgoingVideo.pause();
                transitionState.outgoingVideo.style.opacity = '0';
                // Restore outgoing video source to empty to free memory? Optional.
            }

        } else {
            // Normal Render (Single Video)
            if (activeVideo.readyState < 2) return;
            aiCtx.drawImage(activeVideo, 0, 0, aiCanvas.width, aiCanvas.height);
            const frame = aiCtx.getImageData(0, 0, aiCanvas.width, aiCanvas.height);
            keyFrameData(frame.data);
            aiCtx.putImageData(frame, 0, 0);
        }
    }

    // Extracted Keying Logic for reuse
    function keyFrameData(data) {
        const l = data.length / 4;
        for (let i = 0; i < l; i++) {
            const idx = i * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];

            const maxRG = (r > g) ? r : g;
            const diff = b - maxRG;

            if (diff > LOWER_THRESH) {
                let alpha = 1.0 - ((diff - LOWER_THRESH) * INV_THRESH_DIFF);
                if (alpha <= 0) {
                    data[idx + 3] = 0;
                } else {
                    data[idx + 3] = (alpha * 255) | 0;
                    data[idx + 2] = (maxRG + 20 < b) ? (maxRG + 20) : b;
                }
            }
        }
    }

    renderChromaKey();

    // --- State Management ---

    // Initial Start
    function playIdle() {
        if (isSpeaking) return;
        // This is only called for initial startup now, or resets
        const src = getNextIdleSrc();
        transitionToAction(src, false).then(() => {
            // After first play, trigger preload cycle
            prepareNextIdle();
        });
    }

    async function playAction(type, audioKey, text) {
        if (isSpeaking) return;
        isSpeaking = true;
        nextActionPending = true; // Block idle preload

        let videoList = videos.action.generic;
        if (videos.action[type]) {
            videoList = videos.action[type];
        }

        const videoFile = Array.isArray(videoList)
            ? videoList[Math.floor(Math.random() * videoList.length)]
            : videoList;

        // Update strict history
        strictVideoHistory.push(videoFile);
        if (strictVideoHistory.length > MAX_HISTORY) strictVideoHistory.shift();
        saveCompanionState();

        await transitionToAction(videoFile, false);

        // Use legacyAudioMap for compatibility if audioKey is a legacy key
        const actualAudioKey = legacyAudioMap[audioKey] || audioKey;
        const audio = audios[actualAudioKey];
        if (audio) {
            audio.currentTime = 0;
            audio.volume = 1.0;

            // Mobile Safari/Chrome check
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    // Success
                }).catch(error => {
                    console.warn(`Audio Auto-Play Blocked (${actualAudioKey}):`, error);
                    if (!audioUnlocked) showBubble("(點擊螢幕開啟聲音 🔊)", 2000);

                    // CRITICAL FIX: If audio fails to play, we MUST end the action logic
                    // otherwise isSpeaking stays true forever.
                    setTimeout(finishAction, 3000);
                });
            }

            audio.onended = () => {
                finishAction();
            };
        } else {
            console.warn(`Audio not found for key: ${actualAudioKey}. Playing for 3 seconds.`);
            setTimeout(finishAction, 3000);
        }

        if (text) showBubble(text);
    }

    function finishAction() {
        if (!isSpeaking) return;
        isSpeaking = false;
        nextActionPending = false;

        const aiText = document.getElementById('ai-text');
        if (aiText) aiText.classList.remove('show');

        // Immediately jump back to idle flow
        // The current action video might have ended or be looping.
        // We trigger an immediate idle transition.
        const src = getNextIdleSrc();
        transitionToAction(src, false).then(() => {
            prepareNextIdle();
        });
    }

    function showBubble(text, autoHideMs = 0) {
        aiText.innerText = text;
        aiText.classList.add('show');
        if (autoHideMs > 0) {
            setTimeout(() => aiText.classList.remove('show'), autoHideMs);
        }
    }

    // --- Init ---

    // Bind initial listener
    activeVideo.onended = handleVideoEnd;

    // Initial Video Settings
    aiVideo.defaultPlaybackRate = 1.2;
    aiVideo.playbackRate = 1.2;

    setTimeout(() => {
        if (Math.random() > 0.5)
            playAction('joy', 'greeting', '嗨！今天也一起關心一下你的植物吧。');
        else
            playAction('generic', 'intro_long', '我在這裡喔，隨時都可以一起照顧植物。');
    }, 1500);

    // --- Interaction ---
    window.interactWithAI = function () {
        const rand = Math.random();
        if (rand < 0.25) {
            playAction('joy', 'compliment', '主人今天也超級耀眼呢！✨');
        } else if (rand < 0.5) {
            playAction('shy', 'sunny', '今天天氣真好～感覺要融化了～☀️');
        } else if (rand < 0.75) {
            playAction('generic', 'rest', '如果您累了，休息一下也不錯喔 🍵');
        } else {
            playAction('think', 'ask_plan', '您接下來想做什麼呢？');
        }
    };

    // --- Independent Behavior ---
    // ... (rest is same)

    // --- Watchdog for Stuck Videos ---
    // If active video time doesn't change for 2 seconds, force a reset
    let lastTime = 0;
    let stuckCount = 0;

    setInterval(() => {
        if (!activeVideo || activeVideo.paused || activeVideo.ended) return;

        if (Math.abs(activeVideo.currentTime - lastTime) < 0.1) {
            stuckCount++;
            if (stuckCount > 4) { // ~2 seconds (check every 500ms?) No, let's verify interval
                console.warn("Video appears stuck, forcing play...");
                activeVideo.play().catch(e => console.error("Force play failed", e));
                stuckCount = 0;
            }
        } else {
            stuckCount = 0;
            lastTime = activeVideo.currentTime;
        }
    }, 500);

    // Ensure initial play works even if autoplay blocked initially
    function robustStart() {
        if (activeVideo.paused) {
            activeVideo.play().then(() => {
                activeVideo.playbackRate = 1.2;
            }).catch(e => console.log("Waiting for interaction"));
        }
    }

    // Retry start periodically until successful
    const startInterval = setInterval(() => {
        if (!activeVideo.paused) {
            clearInterval(startInterval);
            renderChromaKey(); // Ensure render loop is running
        } else {
            robustStart();
        }
    }, 1000);

    // --- Interaction ---
    // --- Interaction ---
    window.interactWithAI = function () {
        const rand = Math.random();
        if (rand < 0.25) {
            playAction('joy', 'compliment', '做得很棒！植物現在狀態很好喔。');
        } else if (rand < 0.5) {
            playAction('shy', 'sunny', '今天感覺不錯呢。');
        } else if (rand < 0.75) {
            playAction('generic', 'rest', '這樣看著它，也是一種陪伴。');
        } else {
            playAction('think', 'ask_plan', '怎麼了？想看看什麼嗎？');
        }
    };

    function scheduleIndependentSpeech() {
        // Frequency: 3000ms to 5000ms
        const delay = 3000 + Math.random() * 2000;

        setTimeout(() => {
            const isListening = micBtn.classList.contains('listening');

            // Probability: 1.0 (Always speak if not busy)
            if (!isSpeaking && !isListening) {

                // --- Audio Shuffled Deck Logic ---
                if (audioDeck.length === 0) {
                    // Refill from main list
                    audioDeck = shuffle([...audioFiles]);
                    console.log("Refilled Audio Deck:", audioDeck);
                }

                // Strict History Check for Audio
                let candidateIndex = audioDeck.length - 1;
                let selectedConfigName = audioDeck[candidateIndex];
                let attempts = 0;

                while (strictAudioHistory.includes(selectedConfigName) && attempts < audioDeck.length) {
                    const swapIdx = Math.floor(Math.random() * audioDeck.length);
                    [audioDeck[candidateIndex], audioDeck[swapIdx]] = [audioDeck[swapIdx], audioDeck[candidateIndex]];
                    selectedConfigName = audioDeck[candidateIndex];
                    attempts++;
                }

                selectedConfigName = audioDeck.pop();

                // Update History
                strictAudioHistory.push(selectedConfigName);
                if (strictAudioHistory.length > MAX_HISTORY) strictAudioHistory.shift();
                saveCompanionState();

                // Text Logic: Just use the filename as text (cleanup suffix if any)
                const text = selectedConfigName.replace(' - 複製', '');

                // Random gesture
                const allGestures = ['think', 'surprised', 'joy', 'shy'];
                const gesture = allGestures[Math.floor(Math.random() * allGestures.length)];

                console.log("Auto-Speech:", text, "(Gesture:", gesture, ")");

                // Play
                playAction(gesture, selectedConfigName, text);
            }

            // Schedule next check
            scheduleIndependentSpeech();
        }, delay);
    }
    // Start the loop
    scheduleIndependentSpeech();
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition;
    const micBtn = document.getElementById('mic-btn');

    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.lang = 'zh-TW';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => {
            if (isSpeaking) {
                isSpeaking = false;
                Object.values(audios).forEach(a => {
                    a.pause();
                    a.currentTime = 0;
                });
                playIdle();
            }

            micBtn.classList.add('listening');
            showBubble("我在聽...", 0);
        };

        recognition.onend = () => {
            micBtn.classList.remove('listening');
            const aiText = document.getElementById('ai-text');
            if (aiText && aiText.innerText === "我在聽...") {
                aiText.classList.remove('show');
            }
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            console.log("Voice recognized:", transcript);
            handleVoiceCommand(transcript);
        };

        recognition.onerror = (event) => {
            console.error("Speech recognition error", event.error);
            micBtn.classList.remove('listening');
            showBubble("聽不清楚，請再說一次 ><", 3000);
        };

        window.toggleVoice = function (event) {
            event.stopPropagation();
            if (!recognition) return;

            if (micBtn.classList.contains('listening')) {
                recognition.stop();
            } else {
                if (isSpeaking) {
                    isSpeaking = false;
                    Object.values(audios).forEach(a => {
                        a.pause();
                        a.currentTime = 0;
                    });
                    playIdle();
                }
                recognition.start();
            }

        };
    }

    function handleVoiceCommand(text) {
        const t = text.toLowerCase();
        if (t.includes('你好') || t.includes('早安') || t.includes('哈囉')) {
            playAction('joy', 'greeting', '早安我的主人!');
        }
        else if (t.includes('天氣') || t.includes('外面')) {
            playAction('shy', 'sunny', '今天感覺不錯呢。');
        }
        else if (t.includes('狀態') || t.includes('植物') || t.includes('健康')) {
            playAction('think', 'compliment', '做得很棒！植物現在狀態很好喔。');
        }
        else if (t.includes('休息') || t.includes('累')) {
            playAction('generic', 'rest', '這樣看著它，也是一種陪伴。');
        }
        else if (t.includes('名字') || t.includes('是誰')) {
            playAction('generic', 'intro_new', '我是你的植物AI小助手!有什麼問題都可以詢問我!');
        }
        else {
            playAction('think', 'ask_plan', '怎麼了？想看看什麼嗎？');
        }
    }

    // --- Autoplay Policy Handling ---
    let hasInteracted = false;

    function startExperience() {
        if (hasInteracted) return;
        hasInteracted = true;

        console.log("User interaction detected, starting experience...");

        if (typeof voiceContext !== 'undefined' && voiceContext.state === 'suspended') {
            voiceContext.resume().then(() => {
                console.log("AudioContext resumed");
            }).catch(e => console.error("AudioContext resume failed", e));
        }

        if (activeVideo && activeVideo.paused) {
            activeVideo.play().then(() => {
                activeVideo.playbackRate = 1.2;
            }).catch(e => console.warn("Start play failed", e));
        }
    }

    ['click', 'touchstart', 'keydown', 'scroll'].forEach(evt => {
        window.addEventListener(evt, startExperience, { once: true });
    });

    // Bind click event listener to AI companion container to avoid inline onclick
    const aiContainerEl = document.getElementById('ai-companion');
    if (aiContainerEl) {
        aiContainerEl.addEventListener('click', (event) => {
            // Prevent triggering if clicking the mic button
            if (event.target.closest('#mic-btn')) return;
            if (typeof window.interactWithAI === 'function') {
                window.interactWithAI();
            }
        });
    }

    // Bind click event listener to Microphone button to avoid inline onclick
    const micBtnEl = document.getElementById('mic-btn');
    if (micBtnEl) {
        micBtnEl.addEventListener('click', (event) => {
            if (typeof window.toggleVoice === 'function') {
                window.toggleVoice(event);
            }
        });
    }
});

