// Chart.js Setup
let plantChart;

function initChart() {
    const ctx = document.getElementById('plantChart').getContext('2d');
    plantChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: '濕度 (%)',
                borderColor: '#3F6953', // Primary Green
                backgroundColor: 'rgba(63, 105, 83, 0.1)',
                data: [],
                tension: 0.4,
                fill: true,
                pointRadius: 2
            }, {
                label: '光照 (lux)',
                borderColor: '#E8C060', // Golden Yellow
                backgroundColor: 'rgba(232, 192, 96, 0.0)',
                borderDash: [5, 5],
                data: [],
                tension: 0.4,
                yAxisID: 'y1',
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    position: 'top',
                    align: 'end',
                    labels: {
                        usePointStyle: true,
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false }
                },
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: { color: '#f0f0f0' },
                    title: { display: true, text: '濕度' }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    grid: { drawOnChartArea: false },
                    title: { display: true, text: '光照' }
                }
            }
        }
    });
}

// Data Fetching Loop
async function fetchData() {
    try {
        const response = await fetch('/api/current');
        const data = await response.json();

        if (data.temperature) {
            // Update Text Values
            document.getElementById('val-temp').innerText = data.temperature.toFixed(1) + "°C";
            document.getElementById('val-hum').innerText = data.humidity.toFixed(1) + "%";
            document.getElementById('val-light').innerText = data.light.toFixed(0);

            // Calculate and Update Health & Mood
            updateHealthAndMood(data);

            // Update Mood UI
            updateMoodUI(data.humidity, data.light);
        }

        // Fetch History for Chart
        const histResponse = await fetch('/api/history');
        const histData = await histResponse.json();
        updateChart(histData);

    } catch (error) {
        console.error("Error fetching data:", error);
    }
}

function updateHealthAndMood(data) {
    let health = 100;
    let mood = 100;

    // --- Health Logic (Target Based) ---
    // Instead of a wide "safe zone", we use an "ideal target".
    // Any deviation from the target will slightly reduce the score, ensuring fluctuation.

    const idealHum = 60; // Perfect Humidity
    const idealTemp = 25; // Perfect Temp

    // Humidity Deviation: -0.5 point for every 1% diff
    health -= Math.abs(data.humidity - idealHum) * 0.5;

    // Temp Deviation: -2 points for every 1 degree diff
    health -= Math.abs(data.temperature - idealTemp) * 2.0;

    // Light Penalty
    if (data.light < 100) health -= 10;

    health = Math.max(0, Math.min(100, health));

    // --- Mood Logic ---
    // Mood is based on Health but simpler and reacts to Light more
    mood = health;

    // Bonus for good light
    if (data.light > 300) mood += 5;
    // Penalty for dark
    if (data.light < 50) mood -= 20;
    // Penalty for dry
    if (data.humidity < 30) mood -= 15;


    health = Math.max(0, Math.min(100, health));
    mood = Math.max(0, Math.min(100, mood));

    health = Math.max(0, Math.min(100, health));
    mood = Math.max(0, Math.min(100, mood));

    // Update DOM
    document.getElementById('val-health').innerText = Math.round(health) + "%";
    document.getElementById('bar-health').style.width = health + "%";
    document.getElementById('val-mood').innerText = Math.round(mood) + "%";
    document.getElementById('bar-mood').style.width = mood + "%";
}

function updateMoodUI(hum, light) {
    const icon = document.getElementById('mood-icon');
    const text = document.getElementById('mood-text');
    const container = document.querySelector('.plant-avatar-container'); // Select new container

    let msg = "";
    let iconClass = "";
    let stateClass = "";

    // Clear previous states
    container.classList.remove('state-happy', 'state-sleepy', 'state-thirsty', 'state-scared');

    if (hum < 30) {
        // Thirsty
        stateClass = "state-thirsty";
        iconClass = "fa-solid fa-face-dizzy";
        msg = "咳咳... 好渴... 水...";
    } else if (hum > 90) {
        // Wet
        stateClass = "state-scared";
        iconClass = "fa-solid fa-face-grimace";
        msg = "水太多了！根部快不能呼吸了...";
    } else if (light < 100) {
        // Sleepy
        stateClass = "state-sleepy";
        iconClass = "fa-solid fa-bed"; // Or moon
        msg = "Zzz... 休息中...";
    } else {
        // Happy
        stateClass = "state-happy";
        iconClass = "fa-solid fa-face-smile-wink";
        msg = "感覺很棒！行光合作用中 🌱";
    }

    // Apply new state
    container.classList.add(stateClass);

    if (text.textContent !== msg) {
        text.textContent = msg;
        icon.className = iconClass; // Reset class and set new icon
    }
}

function toggleTask(btn) {
    btn.classList.toggle('task-done');
    const icon = btn.querySelector('i');

    if (btn.classList.contains('task-done')) {
        icon.className = "fa-solid fa-circle-check";
        // Optional: Add a subtle confetti or sound effect here
    } else {
        icon.className = "fa-regular fa-circle";
    }
}

function updateChart(data) {
    if (!plantChart) return;
    const labels = data.map(d => {
        const date = new Date(d.timestamp);
        return date.getHours() + ':' + date.getMinutes().toString().padStart(2, '0');
    });
    const humidity = data.map(d => d.humidity);
    const light = data.map(d => d.light);

    plantChart.data.labels = labels;
    plantChart.data.datasets[0].data = humidity;
    plantChart.data.datasets[1].data = light;
    plantChart.update();
}

function testDiscord(alert_type, btnElement) {
    // 1. Play Sound
    if (alert_type === 'water_low') playSound('water');
    else if (alert_type === 'light_low') playSound('night');
    else if (alert_type === 'water_high') playSound('rain');
    else playSound('pop');

    // 2. Trigger Animation
    if (btnElement) {
        btnElement.classList.add('anim-active');
        setTimeout(() => {
            btnElement.classList.remove('anim-active');
        }, 400); // Match CSS duration
    }

    // 3. User Feedback & API Call
    alert('正在發送警報並連結到情境模擬...');

    fetch(`/api/test_alert?type=${alert_type}`)
        .then(response => response.json())
        .then(data => console.log('Alert sent:', data))
        .catch(error => console.error('Error:', error));
}

// --- Weather Canvas Animation ---
const canvas = document.getElementById('weather-bg');
const ctx = canvas ? canvas.getContext('2d') : null;
let particles = [];
let weatherType = 'clear'; // clear, rain, cloud
let w, h;

function resizeCanvas() {
    const card = document.querySelector('.weather-card');
    if (card && canvas) {
        w = canvas.width = card.offsetWidth;
        h = canvas.height = card.offsetHeight;
    }
}
window.addEventListener('resize', resizeCanvas);

// --- Mood Background Animation (God Rays & Dust) ---
const moodCanvas = document.getElementById('mood-bg');
const moodCtx = moodCanvas ? moodCanvas.getContext('2d') : null;
let mw, mh;
let rays = [];
let dustParticles = [];

class GodRay {
    constructor() {
        this.reset();
    }
    reset() {
        this.angle = Math.PI / 3 + (Math.random() - 0.5) * 0.5; // Angled down-right
        this.width = Math.random() * 100 + 50;
        this.speed = Math.random() * 0.002 + 0.001;
        this.opacity = Math.random() * 0.3 + 0.1;
        this.offset = Math.random() * Math.PI * 2; // Phase
    }
    update() {
        this.offset += this.speed;
    }
    draw() {
        if (!moodCtx) return;
        moodCtx.save();
        moodCtx.translate(mw / 2, -100); // Light source above
        moodCtx.rotate(this.angle + Math.sin(this.offset) * 0.1);

        const grad = moodCtx.createLinearGradient(0, 0, 0, mh * 1.5);
        grad.addColorStop(0, `rgba(255, 255, 230, ${this.opacity})`);
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

        moodCtx.fillStyle = grad;
        moodCtx.fillRect(-this.width / 2, 0, this.width, mh * 1.5);
        moodCtx.restore();
    }
}

// Parallax Variables
let mouseX = 0;
let mouseY = 0;
let targetX = 0;
let targetY = 0;

let fireflies = [];

class Firefly {
    constructor() {
        this.reset();
        this.x = Math.random() * mw;
        this.y = Math.random() * mh;
    }
    reset() {
        this.x = Math.random() * mw;
        this.y = Math.random() * mh;
        this.size = Math.random() * 3 + 1; // 1px to 4px
        this.speedX = (Math.random() - 0.5) * 1.5;
        this.speedY = (Math.random() - 0.5) * 1.5;
        this.life = 0;
        this.maxLife = Math.random() * 200 + 100;
        this.opacity = 0;
        this.fadeIn = true;
        this.color = Math.random() > 0.5 ? '200, 255, 100' : '255, 230, 100'; // Lime or Gold
    }
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life++;

        // Pulse opacity
        if (this.fadeIn) {
            this.opacity += 0.02;
            if (this.opacity >= 1) this.fadeIn = false;
        } else {
            this.opacity -= 0.01;
            if (this.opacity <= 0) this.reset();
        }

        // Boundary wrap
        if (this.x < 0) this.x = mw;
        if (this.x > mw) this.x = 0;
        if (this.y < 0) this.y = mh;
        if (this.y > mh) this.y = 0;
    }
    draw() {
        if (!moodCtx) return;
        moodCtx.fillStyle = `rgba(${this.color}, ${this.opacity})`;
        moodCtx.shadowBlur = 10;
        moodCtx.shadowColor = `rgba(${this.color}, 1)`; // Glow
        moodCtx.beginPath();
        moodCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        moodCtx.fill();
        moodCtx.shadowBlur = 0; // Reset
    }
}


function initMoodBg() {
    if (!moodCanvas) return;
    const resizeMood = () => {
        const parent = moodCanvas.parentElement;
        mw = moodCanvas.width = parent.offsetWidth;
        mh = moodCanvas.height = parent.offsetHeight;
        rays = Array.from({ length: 5 }, () => new GodRay());
        fireflies = Array.from({ length: 30 }, () => new Firefly());
    };
    window.addEventListener('resize', resizeMood);
    resizeMood();

    // Mouse Parallax Interaction
    const card = document.querySelector('.interaction-card');

    if (card) {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            // Calculate mouse position relative to card center
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;

            // Smooth target
            targetX = x * 0.05; // Max shift approx 15px
            targetY = y * 0.05;
        });
    }

    animateMood();
}

function animateMood() {
    if (!moodCtx) return;
    moodCtx.clearRect(0, 0, mw, mh);

    // Smooth Lerp for Parallax
    mouseX += (targetX - mouseX) * 0.1;
    mouseY += (targetY - mouseY) * 0.1;

    // Apply Parallax to Background Image
    const bgImg = document.getElementById('mood-bg-img');
    if (bgImg) {
        bgImg.style.animation = 'none';
        bgImg.style.transform = `scale(1.15) translate(${-mouseX}px, ${-mouseY}px)`;
    }

    // Beams (Overlay) - Move opposite for depth
    moodCtx.save();
    moodCtx.translate(mouseX * 0.5, mouseY * 0.5);
    moodCtx.globalCompositeOperation = 'overlay';
    rays.forEach(r => { r.update(); r.draw(); });
    moodCtx.restore();

    // Fireflies (Normal) - Foreground
    moodCtx.globalCompositeOperation = 'source-over';
    fireflies.forEach(d => { d.update(); d.draw(); });

    requestAnimationFrame(animateMood);
}

if (moodCanvas) {
    console.log("Starting Mood Animation...");
    initMoodBg();
}

class Particle {
    constructor(type) {
        this.reset(type);
    }

    reset(type) {
        this.type = type;
        this.x = Math.random() * w;

        if (type === 'rain') {
            this.y = Math.random() * -h;
            this.vy = Math.random() * 5 + 5;
            this.len = Math.random() * 20 + 10;
        } else if (type === 'cloud') {
            this.y = Math.random() * (h / 2);
            this.vx = Math.random() * 0.5 + 0.1;
            this.size = Math.random() * 50 + 20;
        } else { // clear
            this.y = Math.random() * h;
            this.vx = Math.random() * 0.5 - 0.25;
            this.vy = Math.random() * 0.5 - 0.25;
            this.size = Math.random() * 2 + 1;
            this.alpha = Math.random();
            this.dAlpha = Math.random() * 0.02 - 0.01;
        }
    }

    update() {
        if (this.type === 'rain') {
            this.y += this.vy;
            if (this.y > h) this.reset('rain');
        } else if (this.type === 'cloud') {
            this.x += this.vx;
            if (this.x > w + 50) this.x = -50;
        } else { // clear
            this.x += this.vx;
            this.y += this.vy;
            this.alpha += this.dAlpha;
            if (this.alpha <= 0 || this.alpha >= 1) this.dAlpha *= -1;
            if (this.x < 0 || this.x > w || this.y < 0 || this.y > h) this.reset('clear');
        }
    }

    draw() {
        if (!ctx) return;
        if (this.type === 'rain') {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x, this.y + this.len);
            ctx.stroke();
        } else if (this.type === 'cloud') {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha * 0.5})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

function initParticles(type, count) {
    if (!canvas) return;
    weatherType = type;
    particles = [];
    resizeCanvas();
    for (let i = 0; i < count; i++) {
        particles.push(new Particle(type));
    }
}

function animateWeather() {
    if (!ctx) return;
    ctx.clearRect(0, 0, w, h);
    particles.forEach(p => {
        p.update();
        p.draw();
    });
    requestAnimationFrame(animateWeather);
}

// Start Animation
if (canvas) animateWeather();

// Weather Function
function fetchWeather() {
    const locElem = document.getElementById('weather-location');

    if (!navigator.geolocation) {
        locElem.innerHTML = "您的瀏覽器不支援定位";
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            locElem.innerHTML = `<i class="fa-solid fa-location-dot"></i> 已定位 (${lat.toFixed(2)}, ${lon.toFixed(2)})`;
            getWeatherData(lat, lon);
        },
        () => {
            locElem.innerHTML = "無法獲取位置 (預設: 台北)";
            getWeatherData(25.03, 121.56); // Default Taipei
        }
    );
}

async function getWeatherData(lat, lon) {
    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,wind_speed_10m&timezone=auto`;
        const res = await fetch(url);
        const data = await res.json();
        const current = data.current;

        document.getElementById('weather-temp').innerText = `${current.temperature_2m}°C`;
        document.getElementById('weather-wind').innerText = `${current.wind_speed_10m} km/h`;
        document.getElementById('weather-code').innerText = getWeatherDesc(current.weather_code);

        // Update Icon
        const code = current.weather_code;
        const icon = document.getElementById('weather-icon');
        icon.className = "weather-icon-large";

        if (code <= 1) { // Sun
            icon.className = "fa-solid fa-sun weather-icon-large anim-spin-slow";
            if (weatherType !== 'clear') initParticles('clear', 50);
        } else if (code <= 3) { // Cloud
            icon.className = "fa-solid fa-cloud-sun weather-icon-large anim-float";
            if (weatherType !== 'cloud') initParticles('cloud', 20);
        } else if (code <= 65) { // Rain
            icon.className = "fa-solid fa-cloud-rain weather-icon-large anim-float";
            if (weatherType !== 'rain') initParticles('rain', 100);
        } else if (code >= 95) { // Storm
            icon.className = "fa-solid fa-bolt weather-icon-large anim-shake";
            if (weatherType !== 'rain') initParticles('rain', 150);
        } else {
            icon.className = "fa-solid fa-snowflake weather-icon-large anim-float";
            if (weatherType !== 'clear') initParticles('clear', 50);
        }

    } catch (e) {
        console.error("Weather API Error:", e);
    }
}

function getWeatherDesc(code) {
    const table = {
        0: "晴朗", 1: "多雲", 2: "多雲", 3: "陰天",
        45: "霧", 48: "霧凇",
        51: "毛毛雨", 53: "毛毛雨", 55: "毛毛雨",
        61: "小雨", 63: "中雨", 65: "大雨",
        80: "陣雨", 81: "強陣雨", 82: "暴雨",
        95: "雷雨"
    };
    return table[code] || "未知";
}

// Init
// Init
document.addEventListener('DOMContentLoaded', () => {
    initChart();
    resizeCanvas();
    fetchWeather();
    // initParticles();
    setInterval(fetchData, 200); // Faster updates for liveliness
    fetchData();

    // Bind event listeners for alert buttons to avoid inline onclick
    document.querySelectorAll('.alert-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const alertType = this.getAttribute('data-alert');
            testDiscord(alertType, this);
        });
    });

    // Bind event listeners for daily task buttons to avoid inline onclick
    document.querySelectorAll('.task-action-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            toggleTask(this);
        });
    });
});

// Update Health & Mood with Jitter
function updateHealthAndMood(data) {
    let health = 100;
    let mood = 100;

    // --- Health Logic (Target Based) ---
    const idealHum = 60; // Perfect Humidity
    const idealTemp = 25; // Perfect Temp

    // Humidity Deviation
    health -= Math.abs(data.humidity - idealHum) * 0.5;
    // Temp Deviation
    health -= Math.abs(data.temperature - idealTemp) * 2.0;
    // Light Penalty
    if (data.light < 100) health -= 10;

    health = Math.max(0, Math.min(100, health));

    // --- Mood Logic ---
    mood = health;
    if (data.light > 300) mood += 5;
    if (data.light < 50) mood -= 20;
    if (data.humidity < 30) mood -= 15;

    // Add Live Jitter (fluctuation)
    // Random float between -2.0 and +2.0 to make numbers "dance"
    const jitterH = (Math.random() - 0.5) * 4;
    const jitterM = (Math.random() - 0.5) * 4;

    health += jitterH;
    mood += jitterM;

    health = Math.max(0, Math.min(100, health));
    mood = Math.max(0, Math.min(100, mood));

    // Update DOM
    document.getElementById('val-health').innerText = Math.round(health) + "%";
    document.getElementById('bar-health').style.width = health + "%";
    document.getElementById('val-mood').innerText = Math.round(mood) + "%";
    document.getElementById('bar-mood').style.width = mood + "%";
}

// Textures removed
