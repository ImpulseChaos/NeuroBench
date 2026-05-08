const SequenceTest = (() => {
  let state       = 'idle';   // idle | showing | input | result
  let level       = 3;
  let sequence    = [];
  let playerInput = [];
  let maxLevel    = 0;
  let showTimeout = null;
  let sm          = null;
  let baseDelay   = 700;

  function getBtns()    { return document.querySelectorAll('.seq-btn'); }
  function getStatus()  { return document.getElementById('seq-status'); }
  function getLevelEl() { return document.getElementById('seq-level'); }

  function setStatus(msg, color) {
    const el = getStatus();
    el.textContent = msg;
    el.style.color = color || 'var(--muted)';
  }

  function updateProgress() {
    const prog = document.getElementById('seq-progress');
    prog.innerHTML = '';
    for (let i = 0; i < level; i++) {
      const dot = document.createElement('div');
      dot.className = 'seq-dot' + (i < playerInput.length ? ' filled' : '');
      prog.appendChild(dot);
    }
  }

  function lightBtn(idx, duration) {
    return new Promise(res => {
      const btns = getBtns();
      btns[idx].classList.add('lit');
      if (sm && sm.userData.pulse) sm.userData.pulse(idx);
      setTimeout(() => {
        btns[idx].classList.remove('lit');
        res();
      }, duration);
    });
  }

  async function playSequence() {
    state = 'showing';
    disableBtns(true);
    setStatus('Watch the sequence…', 'var(--sequence)');

    const delay = Math.max(300, baseDelay - (level - 3) * 30);
    const gap   = Math.max(80, 200 - (level - 3) * 10);

    for (let i = 0; i < sequence.length; i++) {
      await new Promise(r => setTimeout(r, i === 0 ? 400 : gap));
      await lightBtn(sequence[i], delay);
    }

    await new Promise(r => setTimeout(r, 300));
    state = 'input';
    disableBtns(false);
    playerInput = [];
    updateProgress();
    setStatus('Your turn — repeat the sequence', 'var(--text)');
  }

  function disableBtns(disabled) {
    getBtns().forEach(b => { b.disabled = disabled; });
  }

  function generateSequence() {
    sequence = Array.from({ length: level }, () => Math.floor(Math.random() * 4));
  }

  function handleBtnClick(idx) {
    if (state !== 'input') return;
    playerInput.push(idx);
    lightBtn(idx, 250);
    updateProgress();

    const pos = playerInput.length - 1;
    if (playerInput[pos] !== sequence[pos]) {
      state = 'result';
      disableBtns(true);
      setStatus('Wrong! Sequence failed.', 'var(--error)');
      showResults();
      return;
    }

    if (playerInput.length === sequence.length) {
      level++;
      maxLevel = Math.max(maxLevel, level - 1);
      getLevelEl().textContent = level;
      disableBtns(true);
      setStatus('Correct! Level up!', 'var(--reaction)');
      GameState.add('sequence', level - 1);
      setTimeout(() => {
        generateSequence();
        playSequence();
      }, 800);
    }
  }

  function showResults() {
    document.getElementById('seq-results').style.display = 'block';
    document.getElementById('seq-start-btn').style.display = 'none';
    document.getElementById('seq-results-level').textContent = maxLevel || (level - 1);
    setStatus('');
    GameState.add('sequence', maxLevel || (level - 1));
  }

  function start() {
    level    = 3;
    maxLevel = 0;
    sequence = [];
    playerInput = [];
    document.getElementById('seq-results').style.display = 'none';
    document.getElementById('seq-start-btn').style.display = 'none';
    getLevelEl().textContent = level;
    generateSequence();
    playSequence();
  }

  function init() {
    sm = new SceneManager();
    sm.create('sequence-canvas', (s) => {
      const geo = new THREE.IcosahedronGeometry(3.5, 1);
      const mat = new THREE.MeshPhongMaterial({
        color: 0x8B5CF6,
        emissive: 0x8B5CF6,
        emissiveIntensity: 0.4,
        transparent: true,
        opacity: 0.55,
        shininess: 120
      });
      const ico = new THREE.Mesh(geo, mat);
      s.scene.add(ico);

      const wmat = new THREE.MeshBasicMaterial({
        color: 0xA78BFA,
        wireframe: true,
        transparent: true,
        opacity: 0.35
      });
      const wico = new THREE.Mesh(geo.clone(), wmat);
      s.scene.add(wico);

      s.userData.ico  = ico;
      s.userData.wico = wico;
      s.userData.pulseVal = 0;
      s.userData.pulseColors = [0x8B5CF6, 0x3B82F6, 0x10B981, 0xF59E0B];

      s.userData.pulse = (idx) => {
        const col = s.userData.pulseColors[idx];
        ico.material.color.setHex(col);
        ico.material.emissive.setHex(col);
        s.userData.pulseVal = 2.5;
      };

      const glowGeo = new THREE.SphereGeometry(4.5, 24, 16);
      const glowMat = new THREE.MeshBasicMaterial({
        color: 0x8B5CF6,
        transparent: true,
        opacity: 0,
        side: THREE.BackSide
      });
      const glow = new THREE.Mesh(glowGeo, glowMat);
      s.scene.add(glow);
      s.userData.glow    = glow;
      s.userData.glowMat = glowMat;
    });

    sm.animate((t, s) => {
      const ico  = s.userData.ico;
      const wico = s.userData.wico;
      if (!ico) return;

      ico.rotation.x  += 0.005;
      ico.rotation.y  += 0.007;
      wico.rotation.x  = ico.rotation.x + 0.01 * Math.sin(t);
      wico.rotation.y  = ico.rotation.y;

      if (s.userData.pulseVal > 0) {
        s.userData.pulseVal *= 0.94;
        ico.material.emissiveIntensity = 0.4 + s.userData.pulseVal;
        s.userData.glowMat.opacity     = 0.08 + s.userData.pulseVal * 0.06;
        ico.scale.setScalar(1 + s.userData.pulseVal * 0.04);
      } else {
        ico.material.emissiveIntensity = lerp(ico.material.emissiveIntensity, 0.4, 0.05);
        ico.material.color.lerp(new THREE.Color(0x8B5CF6), 0.03);
        ico.material.emissive.lerp(new THREE.Color(0x8B5CF6), 0.03);
        ico.scale.lerp(new THREE.Vector3(1,1,1), 0.1);
        s.userData.glowMat.opacity = lerp(s.userData.glowMat.opacity, 0, 0.05);
      }

      ico.position.y  = Math.sin(t * 0.7) * 0.3;
      wico.position.y = ico.position.y;
    });

    document.getElementById('sequence-reset-btn').onclick = reset;
  }

  function reset() {
    clearTimeout(showTimeout);
    level = 3; maxLevel = 0; sequence = []; playerInput = [];
    state = 'idle';
    disableBtns(true);
    getLevelEl().textContent = level;
    setStatus('Press Start to begin');
    document.getElementById('seq-progress').innerHTML = '';
    document.getElementById('seq-results').style.display = 'none';
    document.getElementById('seq-start-btn').style.display = '';
  }

  function destroy() {
    clearTimeout(showTimeout);
    if (sm) { sm.destroy(); sm = null; }
  }

  return { init, start, handleBtnClick, reset, destroy };
})();
