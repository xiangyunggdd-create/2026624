document.addEventListener('DOMContentLoaded', () => {
    // --- Nature Background Animation ---
    const bgCanvas = document.getElementById('nature-bg');
    if (!bgCanvas) return;
    const bgCtx = bgCanvas.getContext('2d');
    let bw, bh;
    let natureParticles = [];

    // Debounce utility to prevent excessive redraws during resize
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    function resizeBg() {
        bw = bgCanvas.width = window.innerWidth;
        bh = bgCanvas.height = window.innerHeight;
        initNatureParticles();
    }

    // Use debounced resize
    window.addEventListener('resize', debounce(resizeBg, 250));

    class Bokeh {
        constructor() {
            this.reset();
            this.y = Math.random() * bh; // Start random
        }
        reset() {
            this.x = Math.random() * bw;
            this.y = bh + Math.random() * 100;
            this.size = Math.random() * 20 + 5;
            this.speedY = Math.random() * 0.5 + 0.2;
            this.speedX = (Math.random() - 0.5) * 0.5;
            // Warm nature colors: pale green, soft gold, transparent white
            const colors = [
                'rgba(74, 222, 128, 0.1)', // Light Green
                'rgba(253, 224, 71, 0.1)', // Soft Gold
                'rgba(255, 255, 255, 0.2)' // White
            ];
            this.color = colors[Math.floor(Math.random() * colors.length)];
        }
        update() {
            this.y -= this.speedY; // Float up
            this.x += this.speedX + Math.sin(this.y * 0.01) * 0.2; // Meander

            if (this.y < -50) this.reset();
        }
        draw() {
            bgCtx.fillStyle = this.color;
            bgCtx.beginPath();
            bgCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            bgCtx.fill();
        }
    }

    function initNatureParticles() {
        natureParticles = Array.from({ length: 40 }, () => new Bokeh());
    }

    function animateBg() {
        bgCtx.clearRect(0, 0, bw, bh);
        natureParticles.forEach(p => {
            p.update();
            p.draw();
        });
        requestAnimationFrame(animateBg);
    }

    // Initialize Background
    resizeBg();
    animateBg();

    // Scenario Data & Modal Logic
    const scenarios = {
        'morning': {
            title: '早上起床 - 日照選項',
            event: '鬧鐘響起☀ 植物偵測到您已起床...',
            icon: 'fa-seedling',
            options: [
                { label: 'A', text: '移窗邊曬太陽', feedback: '好溫暖！充滿能量開啟新的一天！☀️', effect: 'sun' },
                { label: 'B', text: '待在原地不動', feedback: '嗯... 有點暗，但我會撐著的。', effect: 'none' },
                { label: 'C', text: '開日照模式 (人工光)', feedback: '全光譜 LED 啟動！模擬完美日照！💡', effect: 'lamp' }
            ]
        },
        'hydration': {
            title: '喝水時刻 - 共感傳遞',
            event: '您喝了一杯水💧 植物也想知道要喝多少？',
            icon: 'fa-plant-wilt',
            options: [
                { label: 'A', text: '澆一點點 (微補水)', feedback: '咕嚕... 稍微解渴了，謝謝！💧', effect: 'drop' },
                { label: 'B', text: '澆正常量 (標準)', feedback: '哇！太暢快了！全身細胞都活過來了！🌊', effect: 'shower' },
                { label: 'C', text: '先不澆水', feedback: '好吧... 我再忍耐一下... (枯萎) 🥀', effect: 'wither' }
            ]
        },
        'lowlight': {
            title: '光線不足 - 應對策略',
            event: '偵測到陰天☁️ 光線強度不足...',
            icon: 'fa-seedling',
            options: [
                { label: 'A', text: '移動位置', feedback: '這裡視野真好！光線充足多了！✨', effect: 'sun' },
                { label: 'B', text: '開補光燈', feedback: '人工光照補充中，恢復生機。💡', effect: 'lamp' },
                { label: 'C', text: '沒做處理', feedback: '好暗喔... 想睡覺了... 🌑', effect: 'dark' }
            ]
        },
        'sleep': {
            title: '晚安睡眠 - 休息儀式',
            event: '時間已晚🌙 準備進入休息模式...',
            icon: 'fa-seedling',
            options: [
                { label: 'A', text: '完全休眠 (關燈)', feedback: 'Zzz... 晚安，明天見。🛌', effect: 'sleep' },
                { label: 'B', text: '陪伴模式 (夜燈)', feedback: '我會發出微光，守護您的夢境。🕯️', effect: 'nightlight' },
                { label: 'C', text: '播放白噪音', feedback: '🎵 享受大自然的聲音，一起放鬆。', effect: 'music' }
            ]
        }
    };

    const modalOverlay = document.getElementById('modalOverlay');
    const fsLayer = document.getElementById('fsLayer');
    const fsBgElements = document.getElementById('fsBgElements');
    const fsPlant = document.getElementById('fsPlant');
    const fsMessage = document.getElementById('fsMessage');
    const optionGrid = document.getElementById('optionGrid');

    // Attach Event Listeners to remove inline HTML event handlers
    document.querySelectorAll('.scenario-card').forEach(card => {
        card.addEventListener('click', () => {
            const scenarioType = card.getAttribute('data-scenario');
            if (scenarioType) {
                openModal(scenarioType);
            }
        });
    });

    const modalClose = document.querySelector('.modal-close');
    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
    }

    const fsCloseHint = document.querySelector('.fs-close-hint');
    if (fsCloseHint) {
        fsCloseHint.addEventListener('click', closeAnimation);
    }

    function openModal(type) {
        const data = scenarios[type];
        if (!data) return;

        document.getElementById('modalTitle').innerText = data.title;
        document.getElementById('modalEvent').innerText = data.event;

        optionGrid.innerHTML = '';
        data.options.forEach(opt => {
            const btn = document.createElement('div');
            btn.className = 'option-btn';
            btn.innerHTML = `<div class="option-badge">${opt.label}</div><div>${opt.text}</div>`;
            btn.addEventListener('click', () => playFullScreenAnim(opt));
            optionGrid.appendChild(btn);
        });
        modalOverlay.classList.add('active');
    }

    function closeModal() {
        modalOverlay.classList.remove('active');
    }

    function closeAnimation() {
        fsLayer.classList.remove('active');
        fsLayer.style.background = 'transparent'; // Reset bg
    }

    function playFullScreenAnim(opt) {
        closeModal(); // Close selection modal
        fsLayer.classList.add('active');
        fsBgElements.innerHTML = ''; // Clear prev
        fsMessage.innerText = opt.feedback;

        // Reset Plant Icon style
        fsPlant.style.transform = 'none';
        fsPlant.style.filter = 'none';
        fsPlant.style.color = 'white';
        fsPlant.innerHTML = '<i class="fa-solid fa-seedling"></i>';

        // --- Effects ---
        if (opt.effect === 'sun') {
            fsLayer.style.background = '#87CEEB';
            const sun = document.createElement('div');
            sun.className = 'fs-sun-rays';
            fsBgElements.appendChild(sun);
            fsPlant.innerHTML = '<i class="fa-solid fa-sun-plant-wilt"></i>';
            // Pop animation
            fsPlant.animate([{ transform: 'scale(0.5)' }, { transform: 'scale(1.2)' }], { duration: 500, fill: 'forwards' });
        }
        else if (opt.effect === 'lamp') {
            fsLayer.style.background = '#333';
            const spot = document.createElement('div');
            spot.className = 'spotlight';
            fsBgElements.appendChild(spot);
            fsPlant.style.color = '#FDCB6E';
        }
        else if (opt.effect === 'shower') {
            fsLayer.style.background = '#2980b9';
            // Generate Heavy Rain
            for (let i = 0; i < 50; i++) {
                const drop = document.createElement('div');
                drop.className = 'rain-drop';
                drop.style.left = Math.random() * 100 + 'vw';
                drop.style.animationDuration = (Math.random() * 0.5 + 0.5) + 's';
                drop.style.animationDelay = Math.random() + 's';
                fsBgElements.appendChild(drop);
            }
            fsPlant.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-20px)' }], { duration: 300, iterations: Infinity, direction: 'alternate' });
        }
        else if (opt.effect === 'drop') {
            fsLayer.style.background = '#a2d9ff';
            // Few drops
            for (let i = 0; i < 10; i++) {
                const drop = document.createElement('div');
                drop.className = 'rain-drop';
                drop.style.left = Math.random() * 100 + 'vw';
                fsBgElements.appendChild(drop);
            }
        }
        else if (opt.effect === 'wither') {
            fsLayer.style.background = '#95a5a6';
            fsPlant.style.filter = 'grayscale(100%)';
            fsPlant.style.transform = 'rotate(10deg) scale(0.8)';
            fsPlant.innerHTML = '<i class="fa-solid fa-plant-wilt"></i>';
        }
        else if (opt.effect === 'dark') {
            fsLayer.style.background = '#2c3e50';
            fsPlant.style.filter = 'brightness(0.3)';
        }
        else if (opt.effect === 'sleep') {
            fsLayer.style.background = '#000';
            fsPlant.style.opacity = '0.5';
            // Stars
            for (let i = 0; i < 20; i++) {
                const star = document.createElement('div');
                star.style.position = 'absolute';
                star.style.width = '3px';
                star.style.height = '3px';
                star.style.background = 'white';
                star.style.left = Math.random() * 100 + 'vw';
                star.style.top = Math.random() * 100 + 'vh';
                fsBgElements.appendChild(star);
            }
        }
        else if (opt.effect === 'nightlight') {
            fsLayer.style.background = '#1a1a1a';
            fsPlant.style.color = '#f1c40f'; // Glow
            fsPlant.style.filter = 'drop-shadow(0 0 50px #f1c40f)';
        }
        else if (opt.effect === 'music') {
            fsLayer.style.background = '#6c5ce7';
            for (let i = 0; i < 10; i++) {
                const note = document.createElement('div');
                note.className = 'music-note';
                note.innerHTML = ['🎵', '🎶', '🎼'][Math.floor(Math.random() * 3)];
                note.style.left = Math.random() * 100 + 'vw';
                note.style.setProperty('--mx', (Math.random() * 200 - 100) + 'px');
                note.style.setProperty('--mr', (Math.random() * 60 - 30) + 'deg');
                note.style.animationDelay = Math.random() + 's';
                fsBgElements.appendChild(note);
            }
        }
        else {
            // None / Normal
            fsLayer.style.background = '#aaa';
        }
    }
});
