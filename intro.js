document.addEventListener('DOMContentLoaded', () => {
    // Load saved love or default to 98
    let loves = parseInt(localStorage.getItem('plantLoves')) || 98;
    const loveDisplay = document.getElementById('loveCount');

    // Init display on load
    if (loveDisplay) {
        loveDisplay.innerText = loves;
    }

    // Attach Event Listeners to remove inline onclick handlers
    const photoCard = document.querySelector('.plant-photo-card');
    if (photoCard) {
        photoCard.addEventListener('click', createHeart);
    }

    const btnWater = document.querySelector('.btn-water');
    if (btnWater) {
        btnWater.addEventListener('click', () => triggerEffect('water'));
    }

    const btnSun = document.querySelector('.btn-sun');
    if (btnSun) {
        btnSun.addEventListener('click', () => triggerEffect('sun'));
    }

    const btnMusic = document.querySelector('.btn-music');
    if (btnMusic) {
        btnMusic.addEventListener('click', () => triggerEffect('music'));
    }

    function createHeart(e) {
        if (typeof window.playSound === 'function') {
            window.playSound('pop');
        }

        loves++;
        localStorage.setItem('plantLoves', loves); // Save forever

        if (loveDisplay) {
            loveDisplay.innerText = loves;
            loveDisplay.style.transform = 'scale(1.5)';
            setTimeout(() => {
                loveDisplay.style.transform = 'scale(1)';
            }, 200);
        }

        const card = e.currentTarget;
        spawnFloatingItem(card, 'fa-heart', '#ff4757', e.clientX, e.clientY);
    }

    function triggerEffect(type) {
        if (typeof window.playSound === 'function') {
            window.playSound(type);
        }

        const card = document.querySelector('.plant-photo-card');
        if (!card) return;
        const rect = card.getBoundingClientRect();

        if (type === 'water') {
            for (let i = 0; i < 10; i++) {
                setTimeout(() => {
                    const randX = rect.left + Math.random() * rect.width;
                    const randY = rect.top + Math.random() * (rect.height / 2);
                    spawnFloatingItem(card, 'fa-droplet', '#4facfe', randX, randY);
                }, i * 100);
            }
        } else if (type === 'sun') {
            card.style.transition = 'filter 0.5s';
            card.style.filter = 'brightness(1.5) drop-shadow(0 0 20px gold)';
            setTimeout(() => {
                card.style.filter = '';
            }, 800);

            for (let i = 0; i < 5; i++) {
                setTimeout(() => {
                    const randX = rect.left + Math.random() * rect.width;
                    const randY = rect.top + Math.random() * rect.height;
                    spawnFloatingItem(card, 'fa-sun', '#ffd700', randX, randY);
                }, i * 200);
            }
        } else if (type === 'music') {
            card.style.animation = 'shake 0.5s ease-in-out';
            setTimeout(() => {
                card.style.animation = '';
            }, 500);

            for (let i = 0; i < 8; i++) {
                setTimeout(() => {
                    const randX = rect.left + Math.random() * rect.width;
                    const randY = rect.top + Math.random() * rect.height;
                    spawnFloatingItem(card, 'fa-music', '#a29bfe', randX, randY);
                }, i * 150);
            }
        }
    }

    function spawnFloatingItem(container, iconClass, color, clientX, clientY) {
        const item = document.createElement('i');
        item.className = `fa-solid ${iconClass} floating-item`;
        item.style.color = color;
        document.body.appendChild(item);

        item.style.left = clientX + 'px';
        item.style.top = clientY + 'px';
        item.style.fontSize = (Math.random() * 1.5 + 1) + 'rem';

        const driftX = (Math.random() * 60) - 30;
        item.animate([
            { transform: 'translateY(0) scale(1)', opacity: 1 },
            { transform: `translateY(-120px) translateX(${driftX}px) scale(1.2)`, opacity: 0 }
        ], {
            duration: 1200,
            easing: 'ease-out'
        }).onfinish = () => item.remove();
    }
});
