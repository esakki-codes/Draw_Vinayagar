/* ==========================================================================
   Vinayagar Connect & Colour - JavaScript Logic & Engine
   ========================================================================== */

(function () {
  'use strict';

  // State Management
  const state = {
    soundEnabled: false,
    currentStep: 1, // 1-indexed target number
    totalPoints: 32,
    isPlaying: false,
    hintsShown: false
  };

  // 32 Precision SVG Points forming Vinayagar's complete outline on clean canvas
  const VINAYAGAR_POINTS = [
    // --- MUKUT CROWN (1 - 5) ---
    { id: 1, x: 300, y: 90, label: "Crown Top" },
    { id: 2, x: 370, y: 130, label: "Crown Mid Right" },
    { id: 3, x: 420, y: 190, label: "Crown Base Right" },
    { id: 4, x: 460, y: 250, label: "Right Crown Ornament" },
    { id: 5, x: 480, y: 310, label: "Right Ear Upper" },

    // --- RIGHT FLAME WEAPON & BACK ARM (6 - 10) ---
    { id: 6, x: 535, y: 240, label: "Right Back Arm Flame Tip" },
    { id: 7, x: 545, y: 490, label: "Right Back Hand" },
    { id: 8, x: 490, y: 410, label: "Right Ear Outer" },
    { id: 9, x: 410, y: 430, label: "Right Ear Base" },
    { id: 10, x: 390, y: 620, label: "Right Blessing Hand" },

    // --- SEATED BASE & FEET (11 - 16) ---
    { id: 11, x: 470, y: 720, label: "Right Seated Knee" },
    { id: 12, x: 500, y: 810, label: "Right Leg Outer" },
    { id: 13, x: 410, y: 870, label: "Base Bottom Right" },
    { id: 14, x: 300, y: 880, label: "Base Center" },
    { id: 15, x: 190, y: 870, label: "Base Bottom Left" },
    { id: 16, x: 100, y: 810, label: "Left Leg Outer" },

    // --- LEFT KNEE & HAND WITH BOWL (17 - 21) ---
    { id: 17, x: 130, y: 720, label: "Left Seated Knee" },
    { id: 18, x: 210, y: 620, label: "Left Hand Bowl" },
    { id: 19, x: 190, y: 430, label: "Left Ear Base" },
    { id: 20, x: 110, y: 410, label: "Left Ear Outer" },
    { id: 21, x: 55, y: 490, label: "Left Back Hand" },

    // --- LEFT FLAME WEAPON & LEFT CROWN (22 - 26) ---
    { id: 22, x: 65, y: 240, label: "Left Back Arm Flame Tip" },
    { id: 23, x: 120, y: 310, label: "Left Ear Upper" },
    { id: 24, x: 140, y: 250, label: "Left Crown Ornament" },
    { id: 25, x: 180, y: 190, label: "Crown Base Left" },
    { id: 26, x: 230, y: 130, label: "Crown Mid Left" },

    // --- FOREHEAD, EYES & TRUNK (27 - 32) ---
    { id: 27, x: 300, y: 300, label: "Forehead Tilak Mark" },
    { id: 28, x: 270, y: 380, label: "Left Eye" },
    { id: 29, x: 330, y: 380, label: "Right Eye" },
    { id: 30, x: 270, y: 480, label: "Trunk Swoop Left" },
    { id: 31, x: 300, y: 570, label: "Trunk Tip Bottom" },
    { id: 32, x: 335, y: 510, label: "Trunk Curve Right (Modak)" }
  ];

  // DOM Elements
  const DOM = {
    soundToggleBtn: document.getElementById('soundToggleBtn'),
    soundIcon: document.getElementById('soundIcon'),
    homeScreen: document.getElementById('homeScreen'),
    gameScreen: document.getElementById('gameScreen'),
    rewardScreen: document.getElementById('rewardScreen'),
    celebrationOverlay: document.getElementById('celebrationOverlay'),
    rewardModal: document.getElementById('rewardModal'),
    startBtn: document.getElementById('startBtn'),
    resetGameBtn: document.getElementById('resetGameBtn'),
    hintBtn: document.getElementById('hintBtn'),
    proceedToRewardBtn: document.getElementById('proceedToRewardBtn'),
    openGiftBtn: document.getElementById('openGiftBtn'),
    playAgainBtn: document.getElementById('playAgainBtn'),
    giftBox: document.getElementById('giftBox'),
    progressText: document.getElementById('progressText'),
    feedbackToast: document.getElementById('feedbackToast'),
    gameSvg: document.getElementById('gameSvg'),
    dotsGroup: document.getElementById('dotsGroup'),
    connectedLinesGroup: document.getElementById('connectedLinesGroup'),
    guidePath: document.getElementById('guidePath'),
    colorIllustrationGroup: document.getElementById('colorIllustrationGroup'),
    bgAura: document.getElementById('bgAura'),
    sparkleGroup: document.getElementById('sparkleGroup')
  };

  // --- AUDIO SYNTHESIZER (Web Audio API) ---
  // Pure browser-synthesized sounds (No external audio files needed)
  let audioCtx = null;

  function initAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
      }
    }
  }

  function playPopSound(freq = 440, type = 'sine') {
    if (!state.soundEnabled || !audioCtx) return;
    try {
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, audioCtx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    } catch (e) {
      console.warn("Audio play error", e);
    }
  }

  function playWrongSound() {
    if (!state.soundEnabled || !audioCtx) return;
    try {
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, audioCtx.currentTime);
      osc.frequency.linearRampToValueAtTime(180, audioCtx.currentTime + 0.25);

      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.25);
    } catch (e) {}
  }

  function playFanfare() {
    if (!state.soundEnabled || !audioCtx) return;
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25];
    notes.forEach((freq, idx) => {
      setTimeout(() => playPopSound(freq, 'triangle'), idx * 90);
    });
  }

  // --- GAME ENGINE LOGIC ---

  function initGame() {
    state.currentStep = 1;
    state.isPlaying = true;

    DOM.guidePath.style.opacity = '1';
    DOM.connectedLinesGroup.style.opacity = '1';
    DOM.dotsGroup.style.opacity = '1';

    updateProgressUI();
    renderGuideOutline();
    renderDots();
    clearLines();
    hideColorReveal();
  }

  // Draw faint dotted path for target shape guide
  function renderGuideOutline() {
    let d = "";
    VINAYAGAR_POINTS.forEach((pt, index) => {
      if (index === 0) {
        d += `M ${pt.x} ${pt.y}`;
      } else {
        d += ` L ${pt.x} ${pt.y}`;
      }
    });
    // Close path loop
    d += ` Z`;
    DOM.guidePath.setAttribute('d', d);
  }

  // Render SVG Dot buttons
  function renderDots() {
    DOM.dotsGroup.innerHTML = '';
    VINAYAGAR_POINTS.forEach((pt) => {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('class', `dot-group ${pt.id === 1 ? 'active-target' : ''}`);
      g.setAttribute('data-id', pt.id);

      // Circle
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', pt.x);
      circle.setAttribute('cy', pt.y);
      circle.setAttribute('r', pt.id === 1 ? 28 : 24);
      circle.setAttribute('class', 'dot-circle');

      // Text label (number)
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', pt.x);
      text.setAttribute('y', pt.y);
      text.setAttribute('class', 'dot-text');
      text.textContent = pt.id;

      g.appendChild(circle);
      g.appendChild(text);

      // Event listener for Dot Click/Touch
      g.addEventListener('click', (e) => handleDotClick(pt.id, pt.x, pt.y));
      g.addEventListener('touchstart', (e) => {
        e.preventDefault();
        handleDotClick(pt.id, pt.x, pt.y);
      });

      DOM.dotsGroup.appendChild(g);
    });
  }

  function clearLines() {
    DOM.connectedLinesGroup.innerHTML = '';
  }

  function handleDotClick(clickedId, x, y) {
    if (!state.isPlaying) return;

    initAudio();

    if (clickedId === state.currentStep) {
      // CORRECT SELECTION!
      playPopSound(350 + state.currentStep * 15);
      createSparkle(x, y);

      // Connect line from previous dot
      if (state.currentStep > 1) {
        const prevPt = VINAYAGAR_POINTS[state.currentStep - 2];
        drawLine(prevPt.x, prevPt.y, x, y);
      }

      // Mark current dot connected
      markDotConnected(state.currentStep);

      state.currentStep++;

      // Check if finished
      if (state.currentStep > state.totalPoints) {
        // Connect final line back to dot 1 to close outline
        const firstPt = VINAYAGAR_POINTS[0];
        const lastPt = VINAYAGAR_POINTS[state.totalPoints - 1];
        drawLine(lastPt.x, lastPt.y, firstPt.x, firstPt.y);

        onGameComplete();
      } else {
        // Mark next target dot
        markNextTargetDot(state.currentStep);
        showToast(`Great! Now find ${state.currentStep} ⭐`);
      }

      updateProgressUI();

    } else if (clickedId < state.currentStep) {
      // Already connected
      showToast(`Already connected! Find number ${state.currentStep} 😊`);
    } else {
      // WRONG SELECTION
      playWrongSound();
      showToast(`Try again! Find number ${state.currentStep} 😊`);
      bounceTargetDot(state.currentStep);
    }
  }

  function drawLine(x1, y1, x2, y2) {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1);
    line.setAttribute('y1', y1);
    line.setAttribute('x2', x2);
    line.setAttribute('y2', y2);
    line.setAttribute('class', 'connected-line');
    DOM.connectedLinesGroup.appendChild(line);
  }

  function markDotConnected(id) {
    const dotG = DOM.dotsGroup.querySelector(`[data-id="${id}"]`);
    if (dotG) {
      dotG.classList.remove('active-target');
      dotG.classList.add('connected');
    }
  }

  function markNextTargetDot(id) {
    const dotG = DOM.dotsGroup.querySelector(`[data-id="${id}"]`);
    if (dotG) {
      dotG.classList.add('active-target');
    }
  }

  function bounceTargetDot(id) {
    const dotG = DOM.dotsGroup.querySelector(`[data-id="${id}"]`);
    if (dotG) {
      dotG.style.transition = 'transform 0.1s ease';
      dotG.style.transform = 'scale(1.3)';
      setTimeout(() => {
        dotG.style.transform = 'scale(1)';
      }, 200);
    }
  }

  function createSparkle(x, y) {
    const sparkle = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    sparkle.setAttribute('x', x);
    sparkle.setAttribute('y', y);
    sparkle.setAttribute('fill', '#FFD700');
    sparkle.setAttribute('font-size', '24px');
    sparkle.setAttribute('text-anchor', 'middle');
    sparkle.textContent = '✨';

    DOM.sparkleGroup.appendChild(sparkle);

    let opacity = 1;
    let dy = 0;
    const anim = setInterval(() => {
      dy -= 1.5;
      opacity -= 0.05;
      sparkle.setAttribute('transform', `translate(0, ${dy})`);
      sparkle.setAttribute('opacity', opacity);

      if (opacity <= 0) {
        clearInterval(anim);
        sparkle.remove();
      }
    }, 20);
  }

  function updateProgressUI() {
    const count = Math.min(state.currentStep - 1, state.totalPoints);
    DOM.progressText.textContent = `${count} / ${state.totalPoints} Completed`;
  }

  function showToast(msg) {
    DOM.feedbackToast.textContent = msg;
    DOM.feedbackToast.classList.add('show');
    clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(() => {
      DOM.feedbackToast.classList.remove('show');
    }, 2500);
  }

  // --- GAME COMPLETION & COLOUR REVEAL ---

  function onGameComplete() {
    state.isPlaying = false;
    playFanfare();

    showToast("✨ OUTLINE COMPLETED! ✨");

    // Fade out lines, dots, and guide path so Vinayagar drawing is shown in full frame cleanly
    DOM.guidePath.style.transition = 'opacity 0.6s ease';
    DOM.guidePath.style.opacity = '0';

    DOM.connectedLinesGroup.style.transition = 'opacity 0.6s ease';
    DOM.connectedLinesGroup.style.opacity = '0';

    DOM.dotsGroup.style.transition = 'opacity 0.6s ease';
    DOM.dotsGroup.style.opacity = '0';

    // Fade in background aura
    DOM.bgAura.setAttribute('opacity', '1');

    // Reveal Colourful Illustration in full frame
    setTimeout(() => {
      DOM.colorIllustrationGroup.classList.add('revealed');
    }, 400);

    // Show Celebration Overlay Modal after full frame color reveal finishes
    setTimeout(() => {
      DOM.celebrationOverlay.classList.remove('hidden');
    }, 2400);
  }

  function hideColorReveal() {
    DOM.colorIllustrationGroup.classList.remove('revealed');
    DOM.bgAura.setAttribute('opacity', '0');
  }

  // --- SCREEN NAVIGATION ---

  function showScreen(screenEl) {
    DOM.homeScreen.classList.remove('active');
    DOM.gameScreen.classList.remove('active');
    DOM.rewardScreen.classList.remove('active');
    DOM.celebrationOverlay.classList.add('hidden');
    DOM.rewardModal.classList.add('hidden');

    screenEl.classList.add('active');
  }

  // Event Listeners
  DOM.startBtn.addEventListener('click', () => {
    initAudio();
    showScreen(DOM.gameScreen);
    initGame();
  });

  DOM.resetGameBtn.addEventListener('click', () => {
    initGame();
  });

  DOM.hintBtn.addEventListener('click', () => {
    if (!state.isPlaying) return;
    bounceTargetDot(state.currentStep);
    showToast(`Next number is ${state.currentStep}! 👉`);
  });

  DOM.proceedToRewardBtn.addEventListener('click', () => {
    showScreen(DOM.rewardScreen);
  });

  DOM.openGiftBtn.addEventListener('click', openGift);
  DOM.giftBox.addEventListener('click', openGift);

  function openGift() {
    initAudio();
    playFanfare();
    DOM.giftBox.classList.remove('pulse-gift');
    DOM.rewardModal.classList.remove('hidden');
  }

  // Admission Form Submit Listener
  const admissionForm = document.getElementById('admissionForm');
  const formSuccessToast = document.getElementById('formSuccessToast');

  if (admissionForm) {
    admissionForm.addEventListener('submit', (e) => {
      e.preventDefault();
      initAudio();
      playFanfare();

      const studentName = document.getElementById('studentName').value;
      const studentAge = document.getElementById('studentAge').value;
      const fatherName = document.getElementById('fatherName').value;
      const parentPhone = document.getElementById('parentPhone').value;
      const address = document.getElementById('address').value;
      const classSelect = document.getElementById('classSelect').value;

      // Save lead locally
      const enquiry = { studentName, studentAge, fatherName, parentPhone, address, classSelect, timestamp: new Date().toISOString() };
      localStorage.setItem(`tn_kids_enquiry_${Date.now()}`, JSON.stringify(enquiry));

      // Show success message
      admissionForm.style.display = 'none';
      if (formSuccessToast) {
        formSuccessToast.classList.remove('hidden');
      }
    });
  }

  DOM.playAgainBtn.addEventListener('click', () => {
    showScreen(DOM.gameScreen);
    initGame();
  });

  // Sound Toggle Handler
  DOM.soundToggleBtn.addEventListener('click', () => {
    state.soundEnabled = !state.soundEnabled;
    if (state.soundEnabled) {
      initAudio();
      DOM.soundIcon.textContent = '🔊';
      DOM.soundToggleBtn.querySelector('.btn-label').textContent = 'Sound ON';
      playPopSound(520);
    } else {
      DOM.soundIcon.textContent = '🔇';
      DOM.soundToggleBtn.querySelector('.btn-label').textContent = 'Sound OFF';
    }
  });

})();
