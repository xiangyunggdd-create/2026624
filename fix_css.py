
import os

path = r'c:\Users\user\Desktop\InteractiveDesign\static\css\style.css'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Keep lines 1 to 1145 (index 0 to 1144)
# Line 1146 (index 1145) is where corruption starts: }/ * M i c...
valid_lines = lines[:1145]

fixed_css = r'''
}

/* Microphone Button */
.mic-btn {
    position: absolute;
    top: -15px;
    left: -15px;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: white;
    border: none;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
    color: var(--primary-color);
    font-size: 1.1rem;
    cursor: pointer;
    z-index: 2001;
    /* Above video */
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s;
}

.mic-btn:hover {
    transform: scale(1.1);
    background: #f0f0f0;
}

.mic-btn.listening {
    background: #E74C3C;
    color: white;
    animation: pulseMic 1.5s infinite;
}

@keyframes pulseMic {
    0% {
        box-shadow: 0 0 0 0 rgba(231, 76, 60, 0.7);
    }

    70% {
        box-shadow: 0 0 0 10px rgba(231, 76, 60, 0);
    }

    100% {
        box-shadow: 0 0 0 0 rgba(231, 76, 60, 0);
    }
}

/* Voice Hints */
.voice-hints {
    position: absolute;
    bottom: 100%;
    /* Above the container */
    right: 0;
    margin-bottom: 60px;
    /* Above the bubble if possible, or adjust position */
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: flex-end;
    pointer-events: none;
    opacity: 0;
    transform: translateY(10px);
    transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    z-index: 2000;
}

.ai-container:hover .voice-hints,
.mic-btn.listening + .voice-hints {
    /* Show when hovering container OR when listening */
    opacity: 1;
    transform: translateY(0);
}

.voice-hints span {
    background: rgba(255, 255, 255, 0.9);
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 0.85rem;
    color: var(--primary-color);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
    white-space: nowrap;
    backdrop-filter: blur(4px);
    font-weight: 500;
}

/* Adjust position if mobile */
@media (max-width: 768px) {
    .voice-hints {
        margin-bottom: 80px;
        /* More space */
    }
}

/* Update Voice Hints with Background */
.voice-hints {
    /* Override overlapping background styles if needed, or simply append */
    background: rgba(255, 255, 255, 0.6) !important;
    padding: 15px !important;
    border-radius: 12px !important;
    backdrop-filter: blur(5px) !important;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05) !important;
}

/* --- Refined Voice UI (Final) --- */

/* 1. Message Bubble: Lowered position */
.ai-bubble {
    bottom: 85% !important;
    /* Closer to head */
    right: 15% !important;
    border-radius: 20px 20px 0 20px !important;
    padding: 12px 18px !important;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1) !important;
}

/* 2. Voice Hints: Move to LEFT side & Solid Background */
.voice-hints {
    right: 120% !important;
    /* Move to left of avatar */
    bottom: 10px !important;
    align-items: flex-end !important;
    background: none !important;
    /* Remove container bg */
    padding: 0 !important;
    box-shadow: none !important;
    width: 150px;
    /* Ensure space */
}

/* 3. Hint Pills: High Contrast */
.voice-hints span {
    background: #FFFFFF !important;
    /* Solid White */
    color: #2c3e50 !important;
    /* Dark Text */
    border: 1px solid #e0e0e0 !important;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
    font-weight: 700 !important;
    /* Bolder */
    padding: 8px 14px !important;
    border-radius: 50px !important;
    opacity: 0.95;
    transition: transform 0.2s;
}

.voice-hints span:hover {
    transform: scale(1.05);
    background: #FFD700 !important;
    /* Highlight on hover */
}

/* Mobile: Keep above (no space on left) */
@media (max-width: 768px) {
    .voice-hints {
        right: 0 !important;
        bottom: 110% !important;
        align-items: flex-end !important;
        width: auto !important;
    }

    .ai-bubble {
        bottom: 150% !important;
        /* Move higher to make room for hints on mobile */
    }
}

/* FIX MOBILE LAYOUT */
@media (max-width: 768px) {

    /* Force Hints to Left on Mobile too */
    .voice-hints {
        right: 100px !important;
        /* To the left of the 90px avatar + margin */
        bottom: 10px !important;
        /* Low down */
        width: auto !important;
        align-items: flex-end !important;
        margin-bottom: 0 !important;
        transform: translateX(0) !important;
        /* Ensure visible */
    }

    /* Lower the bubble on mobile */
    .ai-bubble {
        bottom: 95% !important;
        /* Just above head */
        right: 10px !important;
        max-width: 200px !important;
    }
}

/* MOBILE FONT SIZE ADJUSTMENT */
@media (max-width: 768px) {
    .voice-hints span {
        font-size: 0.75rem !important;
        /* Smaller text (was 0.9rem) */
        padding: 6px 12px !important;
        /* Smaller padding */
        gap: 5px !important;
    }

    .voice-hints {
        gap: 6px !important;
        /* Tighter spacing */
        right: 90px !important;
        /* Adjust position slightly if needed */
    }
}

/* --- DEFINITIVE MOBILE FIXES --- */
@media screen and (max-width: 768px) {

    /* 1. Force smaller hint text */
    .voice-hints span {
        font-size: 0.7rem !important;
        /* Extremely small/crisp */
        padding: 5px 10px !important;
        line-height: 1.2 !important;
    }

    .voice-hints {
        right: 85px !important;
        /* Tight to avatar */
        gap: 4px !important;
    }

    /* 2. Shrink Message Bubble */
    .ai-bubble {
        bottom: 92% !important;
        /* Adjust position */
        padding: 8px 12px !important;
        /* Less padding */
        font-size: 0.8rem !important;
        /* Smaller text */
        max-width: 160px !important;
        /* Force narrow width */
        border-radius: 15px 15px 0 15px !important;
        right: 10px !important;
    }
}
'''

# Write logic
with open(path, 'w', encoding='utf-8') as f:
    f.writelines(valid_lines)
    f.write(fixed_css)

print("Successfully fixed style.css")
