const TypingTest = (() => {
  let state      = 'idle';  // idle | active | result
  let startTime  = 0;
  let timerInt   = null;
  let text       = '';
  let typed      = '';
  let errors     = 0;
  let totalTyped = 0;
  let wpm        = 0;
  let sm         = null;
  let currentWPM = 0;

  function getInput()   { return document.getElementById('typing-input'); }
  function getChars()   { return document.getElementById('typing-chars'); }
  function getOverlay() { return document.getElementById('typing-overlay'); }
  function getTimer()   { return document.getElementById('typing-timer'); }
  function getWPMEl()   { return document.getElementById('typing-wpm-val'); }
  function getAccEl()   { return document.getElementById('typing-acc-val'); }

  function pickText() {
    return TYPING_TEXTS[Math.floor(Math.random() * TYPING_TEXTS.length)];
  }

  function buildChars() {
    const container = getChars();
    container.innerHTML = '';
    for (let i = 0; i < text.length; i++) {
      const span = document.createElement('span');
      span.className = 'char' + (i === 0 ? ' current' : '');
      span.textContent = text[i];
      container.appendChild(span);
    }
  }

  function updateChars() {
    const spans = getChars().querySelectorAll('.char');
    spans.forEach((s, i) => {
      s.className = 'char';
      if (i < typed.length) {
        s.classList.add(typed[i] === text[i] ? 'correct' : 'wrong');
      } else if (i === typed.length) {
        s.classList.add('current');
      }
    });
  }

  function calcWPM(elapsed) {
    const minutes = elapsed / 60000;
    if (minutes < 0.001) return 0;
    return Math.round((totalTyped / 5) / minutes);
  }

  function calcAccuracy() {
    if (totalTyped === 0) return 100;
    return Math.round(((totalTyped - errors) / totalTyped) * 100);
  }

  function tickTimer() {
    const elapsed = performance.now() - startTime;
    const remaining = Math.max(0, Math.ceil(60 - elapsed / 1000));
    getTimer().textContent = remaining;
    currentWPM = calcWPM(elapsed);
    getWPMEl().textContent = currentWPM;
    getAccEl().textContent = calcAccuracy();
    if (remaining <= 0) finish();
  }

  function finish() {
    clearInterval(timerInt);
    state = 'result';
    const elapsed = Math.min(performance.now() - startTime, 60000);
    wpm = calcWPM(elapsed);
    const acc = calcAccuracy();
    GameState.add('typing', wpm);

    document.getElementById('typing-active-view').style.display = 'none';
    const results = document.getElementById('typing-results');
    results.style.display = 'block';
    document.getElementById('typing-results-wpm').textContent = wpm;
    document.getElementById('tr-accuracy').textContent = acc + '%';
    document.getElementById('tr-chars').textContent = totalTyped - errors;
    document.getElementById('tr-errors').textContent = errors;

    if (sm) sm.userData.wpmNorm = 0;
  }

  function handleInput() {
    if (state !== 'active') return;
    const input = getInput();
    const newTyped = input.value;

    if (newTyped.length > typed.length) {
      totalTyped++;
      const idx = newTyped.length - 1;
      if (newTyped[idx] !== text[idx]) errors++;
    }

    typed = newTyped;

    if (typed.length >= text.length) {
      typed = typed.slice(0, text.length);
      input.value = typed;
      finish();
      return;
    }

    updateChars();

    if (sm) sm.userData.wpmNorm = Math.min(currentWPM / 100, 1.5);
  }

  function focusInput() {
    if (state === 'idle') start();
    else getInput().focus();
  }

  function start() {
    state     = 'active';
    text      = pickText();
    typed     = '';
    errors    = 0;
    totalTyped= 0;
    startTime = performance.now();

    document.getElementById('typing-active-view').style.display = 'flex';
    document.getElementById('typing-results').style.display     = 'none';
    document.getElementById('typing-idle-view').style.display   = 'none';

    const box = document.getElementById('typing-text-box');
    box.classList.add('active');
    getOverlay().style.opacity = '0';
    setTimeout(() => { getOverlay().style.display = 'none'; }, 300);

    buildChars();
    getInput().value = '';
    getInput().focus();

    timerInt = setInterval(tickTimer, 100);
  }

  function init() {
    sm = new SceneManager();
    sm.create('typing-canvas', (s) => {
      const geo = new THREE.PlaneGeometry(30, 6, 120, 30);
      const mat = new THREE.MeshPhongMaterial({
        color: 0x3B82F6,
        emissive: 0x3B82F6,
        emissiveIntensity: 0.15,
        wireframe: true,
        transparent: true,
        opacity: 0.45
      });
      const wave = new THREE.Mesh(geo, mat);
      wave.rotation.x = -0.2;
      wave.position.z = -2;
      s.scene.add(wave);
      s.userData.wave = wave;
      s.userData.geo  = geo;
      s.userData.wpmNorm = 0;

      const geo2 = new THREE.PlaneGeometry(30, 6, 80, 20);
      const mat2 = new THREE.MeshPhongMaterial({
        color: 0x60A5FA,
        emissive: 0x3B82F6,
        emissiveIntensity: 0.1,
        wireframe: true,
        transparent: true,
        opacity: 0.25
      });
      const wave2 = new THREE.Mesh(geo2, mat2);
      wave2.rotation.x = -0.2;
      wave2.position.z = -4;
      wave2.position.y = -3;
      s.scene.add(wave2);
      s.userData.wave2 = wave2;
      s.userData.geo2  = geo2;
    });

    sm.animate((t, s) => {
      const intensity = s.userData.wpmNorm || 0;
      const speed = 1.5 + intensity * 3;
      const amp   = 0.3 + intensity * 1.2;

      const pos = s.userData.geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        pos.setZ(i,
          Math.sin(x * 0.5 + t * speed) * amp * 0.5 +
          Math.sin(x * 0.3 - t * speed * 0.7 + y * 0.4) * amp * 0.3
        );
      }
      pos.needsUpdate = true;

      const pos2 = s.userData.geo2.attributes.position;
      for (let i = 0; i < pos2.count; i++) {
        const x = pos2.getX(i);
        pos2.setZ(i, Math.sin(x * 0.4 + t * speed * 0.8 + 1.5) * amp * 0.4);
      }
      pos2.needsUpdate = true;

      if (s.userData.wave) {
        s.userData.wave.material.emissiveIntensity = lerp(
          s.userData.wave.material.emissiveIntensity,
          0.15 + intensity * 0.5, 0.05
        );
      }

      if (s.userData.wpmNorm > 0) s.userData.wpmNorm *= 0.995;
    });

    const input = getInput();
    input.addEventListener('input', handleInput);
    input.addEventListener('keydown', () => {
      if (state === 'idle') start();
    });
    document.getElementById('typing-reset-btn').onclick = reset;
  }

  function reset() {
    clearInterval(timerInt);
    state = 'idle';
    typed = ''; totalTyped = 0; errors = 0; wpm = 0;

    document.getElementById('typing-active-view').style.display = 'flex';
    document.getElementById('typing-results').style.display     = 'none';
    document.getElementById('typing-idle-view').style.display   = 'none';

    getTimer().textContent = '60';
    getWPMEl().textContent = '0';
    getAccEl().textContent = '100';

    const box = document.getElementById('typing-text-box');
    box.classList.remove('active');
    getOverlay().style.display = '';
    getOverlay().style.opacity = '';

    getChars().innerHTML = '';
    getInput().value = '';

    if (sm) sm.userData.wpmNorm = 0;
  }

  function destroy() {
    clearInterval(timerInt);
    if (sm) { sm.destroy(); sm = null; }
  }

  return { init, start, reset, destroy, focusInput };
})();
