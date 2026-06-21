/**
 * MATRIX THEME ENGINE
 * Handles: Rain, Language, Nav, Character Selection, Guide Widget, Spotlight, Audio Effects
 */

(function () {
    // ─── AUDIO ENGINE ───────────────────────────────────────────────────
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    let audioCtx;
    let isMuted = localStorage.getItem('matrixMuted') === 'true';

    function initAudio() {
        if (!audioCtx) audioCtx = new AudioContext();
        if (audioCtx.state === 'suspended') audioCtx.resume();
    }

    // Attempt to initialize on any user interaction
    ['click', 'keydown', 'touchstart'].forEach(evt =>
        window.addEventListener(evt, initAudio, { once: true })
    );

    function playScrambleSound() {
        if (isMuted || !audioCtx || audioCtx.state !== 'running') return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        // Random glitchy frequency
        osc.frequency.setValueAtTime(150 + Math.random() * 400, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.05);

        gain.gain.setValueAtTime(0.05, audioCtx.currentTime); // Subtle volume
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.05);
    }

    function playTypingSound() {
        if (isMuted || !audioCtx || audioCtx.state !== 'running') return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'square';
        // High click frequency
        osc.frequency.setValueAtTime(800 + Math.random() * 200, audioCtx.currentTime);

        gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.02);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.02);
    }

    function playLoadingSound() {
        if (isMuted || !audioCtx || audioCtx.state !== 'running') return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(100, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 1.0);
        gain.gain.setValueAtTime(0, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.5);
        gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1.2);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 1.2);
    }

    function playCharSelectSound() {
        if (isMuted || !audioCtx || audioCtx.state !== 'running') return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(600, audioCtx.currentTime);
        osc.frequency.setValueAtTime(900, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
    }
    // ─── CONFIG & DATA ──────────────────────────────────────────────────
    const SPRITE_NEO = 'images/neo.jpeg';
    const SPRITE_MORPH = 'images/morpheus.jpeg';
    const SPRITE_TRIN = 'images/trinity.jpeg';
    const SPRITE_SMITH = 'images/smith.jpeg';

    // All message entries: { en, ar, spotlight? }
    // spotlight: CSS selector of element to highlight (optional)
    // autoClose: milliseconds before guide auto-minimises (optional)
    const PAGE_GUIDE = {};

    const CHARS = {};

    // ─── INJECTED HTML ──────────────────────────────────────────────────
    const INJECT_HTML = `
        <canvas id="canvas-rain"></canvas>
        <div id="loading-screen" aria-label="Loading" role="alert" aria-busy="true">
            <div class="loader">
                <div class="ring ring1"></div><div class="ring ring2"></div><div class="ring ring3"></div><div class="ring ring4"></div>
            </div>
            <div class="loading-text" data-en="LOADING MATRIX...." data-ar="جاري تحميل ماتريكس....">LOADING MATRIX....</div>
        </div>
        <div id="scan-flash"></div>

        <div id="spotlight-overlay"></div>
        <div class="overlay" id="overlay"></div>
    `;

    document.body.insertAdjacentHTML('afterbegin', INJECT_HTML);

    // ─── MATRIX RAIN ────────────────────────────────────────────────────
    const canvas = document.getElementById('canvas-rain');
    const ctx = canvas.getContext('2d');
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$+-*/=%\\"\'#&_(),.;:?!\\|{}<>[]^~';
    const fontSize = 16;
    let drops = [];

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        drops = Array(Math.floor(canvas.width / fontSize)).fill(1);
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    function drawRain() {
        ctx.fillStyle = 'rgba(0,0,0,0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#00ff41';
        ctx.font = fontSize + 'px monospace';
        for (let i = 0; i < drops.length; i++) {
            const text = letters[Math.floor(Math.random() * letters.length)];
            ctx.fillText(text, i * fontSize, drops[i] * fontSize);
            if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
            drops[i]++;
        }
    }
    setInterval(drawRain, 33);

    // ─── LANGUAGE ENGINE ────────────────────────────────────────────────
    let lang = localStorage.getItem('siteLang') || 'en';

    function applyTranslation() {
        document.documentElement.lang = lang;
        const isAr = lang === 'ar';
        document.body.classList.toggle('ar', isAr);
        const toggleBtn = document.getElementById('languageToggle');
        const mobileToggleBtn = document.getElementById('mobileLanguageToggle');
        if (toggleBtn) toggleBtn.textContent = isAr ? 'English' : 'Arabic';

        document.querySelectorAll('[data-en]').forEach(el => {
            const enVal = el.getAttribute('data-en');
            const targetVal = el.getAttribute('data-' + lang);
            if (!enVal || !targetVal) return;
            
            if (el.tagName === 'TITLE') { 
                document.title = targetVal; 
                return; 
            }
            
            // Recursive function to safely replace text while preserving all HTML tags (like <i> icons)
            function replaceTextInNode(node, searchTxt, replaceTxt) {
                if (node.nodeType === Node.TEXT_NODE) {
                    if (node.nodeValue.includes(searchTxt)) {
                        node.nodeValue = node.nodeValue.replace(searchTxt, replaceTxt);
                    }
                } else if (node.nodeType === Node.ELEMENT_NODE) {
                    node.childNodes.forEach(child => replaceTextInNode(child, searchTxt, replaceTxt));
                }
            }
            
            // We search for either the English value (if translating to Arabic) 
            // or the Arabic value (if translating back to English) to swap them.
            const searchVal = lang === 'ar' ? enVal : el.getAttribute('data-ar');
            
            // Only run the replacer if the element actually contains the text we need to swap
            if (el.textContent.includes(searchVal)) {
                replaceTextInNode(el, searchVal, targetVal);
            } else if (el.children.length === 0) {
                // Fallback for completely empty elements (buttons/links with no icons)
                el.textContent = targetVal;
            }
        });



        localStorage.setItem('siteLang', lang);
    }

    const langBtn = document.getElementById('languageToggle');
    if (langBtn) langBtn.addEventListener('click', () => { lang = lang === 'en' ? 'ar' : 'en'; applyTranslation(); });
    const mobileLangBtn = document.getElementById('mobileLanguageToggle');
    if (mobileLangBtn) mobileLangBtn.addEventListener('click', () => { lang = lang === 'en' ? 'ar' : 'en'; applyTranslation(); closeMobileMenu(); });

    // ─── LOADING SCREEN ─────────────────────────────────────────────────
    window.addEventListener('load', () => {
        const savedChar = sessionStorage.getItem('matrixChar');
        const ls = document.getElementById('loading-screen');
        const lsText = document.querySelector('.loading-text');

        function doLoad() {
            initAudio(); // Unlocks context if this was triggered by a click
            playLoadingSound();
            if (lsText) {
                const ar = lsText.getAttribute('data-ar') || 'جاري تحميل ماتريكس....';
                const en = lsText.getAttribute('data-en') || 'LOADING MATRIX....';
                lsText.textContent = lang === 'ar' ? ar : en;
            }
            setTimeout(() => {
                if (ls) ls.classList.add('fade-out');
                setTimeout(() => {
                }, 400);
            }, 1000); // 1s visual loading time to match the sound
        }

        // Auto-load regardless of first visit
        doLoad();
    });

    // ─── MOBILE MENU ────────────────────────────────────────────────────
    const hamburger = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobileMenu');
    const overlay = document.getElementById('overlay');

    function openMobileMenu() { hamburger.classList.add('active'); mobileMenu.classList.add('active'); overlay.classList.add('active'); document.body.style.overflow = 'hidden'; }
    function closeMobileMenu() { hamburger.classList.remove('active'); mobileMenu.classList.remove('active'); overlay.classList.remove('active'); document.body.style.overflow = ''; }

    if (hamburger) hamburger.addEventListener('click', () => mobileMenu.classList.contains('active') ? closeMobileMenu() : openMobileMenu());
    if (overlay) overlay.addEventListener('click', closeMobileMenu);

    // ─── DROP-DOWNS ─────────────────────────────────────────────────────
    const dds = document.querySelectorAll('.dropdown');
    dds.forEach(dd => {
        const trigger = dd.querySelector('.dropdown-toggle');
        if (trigger) trigger.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); dd.classList.toggle('active'); });
    });
    const mdds = document.querySelectorAll('.mobile-dropdown');
    mdds.forEach(dd => {
        const trigger = dd.querySelector('.mobile-dropdown-header');
        if (trigger) trigger.addEventListener('click', () => dd.classList.toggle('active'));
    });
    document.addEventListener('click', () => dds.forEach(d => d.classList.remove('active')));

    // ─── SPOTLIGHT SYSTEM ───────────────────────────────────────────────
    const spotlightOverlay = document.getElementById('spotlight-overlay');
    let currentSpotlightEl = null;
    let autoCloseTimer = null;

    function activateSpotlight(selector) {
        clearSpotlight();
        if (!selector) return;
        const target = document.querySelector(selector);
        if (!target) return;

        currentSpotlightEl = target;
        target.classList.add('spotlight-target');
        spotlightOverlay.classList.add('active');

        // Position the spotlight cutout
        positionSpotlight(target);

        // Scroll the element into view smoothly
        setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
    }

    function positionSpotlight(el) {
        const rect = el.getBoundingClientRect();
        const pad = 16;
        const t = rect.top - pad;
        const l = rect.left - pad;
        const b = rect.bottom + pad;
        const r = rect.right + pad;
        const W = window.innerWidth;
        const H = window.innerHeight;
        // Polygon that covers viewport EXCEPT the target rectangle
        spotlightOverlay.style.clipPath =
            `polygon(0px 0px, ${W}px 0px, ${W}px ${H}px, 0px ${H}px, ` +
            `0px ${t}px, ${l}px ${t}px, ${l}px ${b}px, ${r}px ${b}px, ${r}px ${t}px, 0px ${t}px)`;
    }

    function clearSpotlight() {
        spotlightOverlay.classList.remove('active');
        if (currentSpotlightEl) {
            currentSpotlightEl.classList.remove('spotlight-target');
            currentSpotlightEl = null;
        }
    }

    window.addEventListener('scroll', () => {
        if (currentSpotlightEl) positionSpotlight(currentSpotlightEl);
    }, { passive: true });

    // ─── CHARACTER SYSTEM ───────────────────────────────────────────────
    const charSelectEl = document.getElementById('char-select');
    const scanFlashEl = document.getElementById('scan-flash');


    // ─── AUTO-INIT ──────────────────────────────────────────────────────
    document.addEventListener('DOMContentLoaded', () => {
        applyTranslation();
    });

    // ─── NAV INTERCEPTION ───────────────────────────────────────────────


    // ─── RESET ──────────────────────────────────────────────────────────
    window.resetMatrixAgent = function () {
        sessionStorage.removeItem('matrixChar');
        location.reload();
    };

    // ─── GLITCH SCRAMBLE EFFECT ─────────────────────────────────────────
    function initScrambleEffect() {
        const titleEl = document.getElementById('heroTitle');
        if (!titleEl) return;

        // Dynamic characters based on language
        const latinChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        const arabicChars = 'أبتثجحخدذرزسشصضطظعغفقكلمنهوي';

        let isHovered = false;
        let frameRequest = null;
        let solveAnimation = null;

        function scramble() {
            if (!isHovered) return;
            const targetText = titleEl.getAttribute('data-' + lang) || titleEl.textContent;
            const currentChars = lang === 'ar' ? arabicChars : latinChars;
            let scrambled = '';
            for (let i = 0; i < targetText.length; i++) {
                if (targetText[i] === ' ' || targetText[i] === '[' || targetText[i] === ']') {
                    scrambled += targetText[i];
                } else {
                    scrambled += currentChars[Math.floor(Math.random() * currentChars.length)];
                }
            }
            titleEl.textContent = scrambled;
            playScrambleSound(); // Play matrix glitch
            setTimeout(() => { frameRequest = requestAnimationFrame(scramble); }, 50);
        }

        function resolve() {
            const targetText = titleEl.getAttribute('data-' + lang) || titleEl.textContent;
            let iterations = 0;

            if (solveAnimation) clearInterval(solveAnimation);

            solveAnimation = setInterval(() => {
                if (isHovered) { clearInterval(solveAnimation); return; }

                const currentChars = lang === 'ar' ? arabicChars : latinChars;
                let result = '';
                let solvedCount = 0;

                for (let i = 0; i < targetText.length; i++) {
                    if (targetText[i] === ' ' || targetText[i] === '[' || targetText[i] === ']') {
                        result += targetText[i];
                        solvedCount++;
                    } else if (iterations > i * 4) {
                        result += targetText[i];
                        solvedCount++;
                    } else {
                        result += currentChars[Math.floor(Math.random() * currentChars.length)];
                    }
                }

                titleEl.textContent = result;
                iterations++;

                if (solvedCount >= targetText.length) {
                    titleEl.textContent = targetText;
                    clearInterval(solveAnimation);
                }
            }, 30);
        }

        titleEl.addEventListener('mouseenter', () => {
            if (solveAnimation) clearInterval(solveAnimation);
            isHovered = true;
            scramble();
        });

        titleEl.addEventListener('mouseleave', () => {
            isHovered = false;
            if (frameRequest) cancelAnimationFrame(frameRequest);
            resolve();
        });
    }

    // ─── CAD FORM SECURITY ──────────────────────────────────────────────
    function initCADForm() {
        const form = document.getElementById('cadRequestForm');
        if (!form) return;

        // Obfuscated email to prevent scrapers (m4506959[at]gmail.com)
        const secret = 'bTQ1MDY5NTlAZ21haWwuY29t';
        form.action = 'https://formsubmit.co/' + atob(secret);
    }

    // ─── MEETING FORM SECURITY ──────────────────────────────────────────
    function initMeetingForm() {
        const form = document.getElementById('meetingRequestForm');
        if (!form) return;

        const secret = 'bTQ1MDY5NTlAZ21haWwuY29t';
        form.action = 'https://formsubmit.co/' + atob(secret);
    }

    // Initialize scramble and forms after a short delay
    document.addEventListener('DOMContentLoaded', () => {
        initCADForm();
        initMeetingForm();
        setTimeout(initScrambleEffect, 500);
    });

})();
