const AimTest = (() => {
  const TOTAL_TARGETS = 30;
  let state        = 'idle';   // idle | active | result
  let clickCount   = 0;
  let clickTimes   = [];
  let lastClickT   = 0;
  let currentTarget= null;
  let sm           = null;
  let missCount    = 0;

  function getArena()   { return document.getElementById('aim-arena'); }
  function getOverlay() { return document.getElementById('aim-arena-overlay'); }

  function updateMeta() {
    document.getElementById('aim-hits').textContent = `${clickCount}/${TOTAL_TARGETS}`;
    const fill = document.getElementById('aim-progress-fill');
    fill.style.width = `${(clickCount / TOTAL_TARGETS) * 100}%`;
    if (clickTimes.length) {
      const avg = Math.round(clickTimes.reduce((a, b) => a + b, 0) / clickTimes.length);
      document.getElementById('aim-avg-time').textContent = avg + 'ms';
      const score = Math.round(clickTimes.reduce((sum, t) => sum + Math.max(0, 1000 - t) / 10, 0));
      document.getElementById('aim-score').textContent = score;
    }
  }

  function spawnTarget() {
    const arena  = getArena();
    const rect   = arena.getBoundingClientRect();
    const size   = Math.round(rand(28, 72));
    const margin = size / 2 + 8;

    const target = document.createElement('div');
    target.className = 'aim-target';
    target.style.width  = size + 'px';
    target.style.height = size + 'px';
    target.style.left   = rand(margin, rect.width  - margin) + 'px';
    target.style.top    = rand(margin, rect.height - margin) + 'px';
    target.style.zIndex = '2';

    target.addEventListener('click', (e) => {
      e.stopPropagation();
      hitTarget(target);
    }, { once: true });

    arena.appendChild(target);
    currentTarget = target;
    lastClickT = performance.now();
  }

  function hitTarget(el) {
    const elapsed = Math.round(performance.now() - lastClickT);
    clickTimes.push(elapsed);
    clickCount++;

    el.style.animation = 'target-out 0.15s ease-out forwards';
    setTimeout(() => el.remove(), 150);
    currentTarget = null;

    if (sm && sm.userData.burst) sm.userData.burst();

    updateMeta();

    if (clickCount >= TOTAL_TARGETS) {
      setTimeout(finish, 200);
    } else {
      spawnTarget();
    }
  }

  function handleArenaClick(e) {
    if (state === 'idle') {
      state = 'active';
      getArena().classList.add('active');
      getOverlay().style.opacity = '0';
      setTimeout(() => { getOverlay().style.display = 'none'; }, 300);
      spawnTarget();
      return;
    }
    if (state !== 'active') return;
    missCount++;
    const arena = getArena();
    const rect  = arena.getBoundingClientRect();
    const flash = document.createElement('div');
    flash.className = 'miss-flash';
    flash.style.left = (e.clientX - rect.left) + 'px';
    flash.style.top  = (e.clientY - rect.top)  + 'px';
    arena.appendChild(flash);
    setTimeout(() => flash.remove(), 400);
  }

  function finish() {
    state = 'result';
    if (currentTarget) { currentTarget.remove(); currentTarget = null; }

    const avg  = Math.round(clickTimes.reduce((a, b) => a + b, 0) / clickTimes.length);
    const best = Math.min(...clickTimes);
    const total= Math.round(clickTimes.reduce((a, b) => a + b, 0) / 1000 * 100) / 100;
    const score= Math.round(clickTimes.reduce((sum, t) => sum + Math.max(0, 1000 - t) / 10, 0));

    GameState.add('aim', score);

    getArena().style.display = 'none';
    document.getElementById('aim-progress-bar') && (document.querySelector('.aim-progress-bar').style.display = 'none');
    const res = document.getElementById('aim-results');
    res.style.display = 'block';
    res.style.textAlign = 'center';
    document.getElementById('aim-results-score').textContent = score;
    document.getElementById('ar-avg').textContent   = avg + 'ms';
    document.getElementById('ar-best').textContent  = best + 'ms';
    document.getElementById('ar-total').textContent = total + 's';
  }

  function init() {
    sm = new SceneManager();
    sm.create('aim-canvas', (s) => {
      const count   = 300;
      const posArr  = new Float32Array(count * 3);
      const radii   = [];
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const r     = rand(4.5, 6.5);
        radii.push({ r, angle, speed: rand(0.004, 0.012), phase: rand(0, Math.PI * 2) });
        posArr[i*3]   = Math.cos(angle) * r;
        posArr[i*3+1] = Math.sin(angle) * r;
        posArr[i*3+2] = (Math.random() - 0.5) * 1.5;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
      const mat = new THREE.PointsMaterial({ color: 0xF59E0B, size: 0.1, sizeAttenuation: true, transparent: true, opacity: 0.85 });
      const ring = new THREE.Points(geo, mat);
      s.scene.add(ring);
      s.userData.ring   = ring;
      s.userData.radii  = radii;
      s.userData.posArr = posArr;

      const count2  = 150;
      const posArr2 = new Float32Array(count2 * 3);
      const radii2  = [];
      for (let i = 0; i < count2; i++) {
        const angle = (i / count2) * Math.PI * 2;
        const r = rand(2, 3.5);
        radii2.push({ r, angle, speed: rand(0.008, 0.02), phase: rand(0, Math.PI * 2) });
        posArr2[i*3]   = Math.cos(angle) * r;
        posArr2[i*3+1] = Math.sin(angle) * r;
        posArr2[i*3+2] = (Math.random() - 0.5) * 0.8;
      }
      const geo2  = new THREE.BufferGeometry();
      geo2.setAttribute('position', new THREE.BufferAttribute(posArr2, 3));
      const mat2  = new THREE.PointsMaterial({ color: 0xFBBF24, size: 0.07, sizeAttenuation: true, transparent: true, opacity: 0.6 });
      const ring2 = new THREE.Points(geo2, mat2);
      s.scene.add(ring2);
      s.userData.ring2   = ring2;
      s.userData.radii2  = radii2;
      s.userData.posArr2 = posArr2;

      const bCount  = 60;
      const bPosArr = new Float32Array(bCount * 3);
      const bGeo    = new THREE.BufferGeometry();
      bGeo.setAttribute('position', new THREE.BufferAttribute(bPosArr, 3));
      const bMat    = new THREE.PointsMaterial({ color: 0xFCD34D, size: 0.25, transparent: true, opacity: 0 });
      const burst   = new THREE.Points(bGeo, bMat);
      s.scene.add(burst);
      s.userData.burst  = () => {
        for (let i = 0; i < bCount; i++) {
          bPosArr[i*3]   = 0; bPosArr[i*3+1] = 0; bPosArr[i*3+2] = 0;
        }
        bGeo.attributes.position.needsUpdate = true;
        bMat.opacity = 1;
        s.userData.burstVels = Array.from({length: bCount}, () => new THREE.Vector3(rand(-0.4,0.4), rand(-0.4,0.4), rand(-0.3,0.3)));
        s.userData.bursting  = true;
      };
      s.userData.bPosArr = bPosArr;
      s.userData.bGeo    = bGeo;
      s.userData.bMat    = bMat;
    });

    sm.animate((t, s) => {
      const r1 = s.userData.radii;
      const p1 = s.userData.posArr;
      if (r1) {
        for (let i = 0; i < r1.length; i++) {
          r1[i].angle += r1[i].speed * 0.016;
          p1[i*3]   = Math.cos(r1[i].angle) * r1[i].r;
          p1[i*3+1] = Math.sin(r1[i].angle) * r1[i].r;
          p1[i*3+2] = Math.sin(t * 2 + r1[i].phase) * 0.5;
        }
        s.userData.ring.geometry.attributes.position.needsUpdate = true;
      }
      const r2 = s.userData.radii2;
      const p2 = s.userData.posArr2;
      if (r2) {
        for (let i = 0; i < r2.length; i++) {
          r2[i].angle -= r2[i].speed * 0.016;
          p2[i*3]   = Math.cos(r2[i].angle) * r2[i].r;
          p2[i*3+1] = Math.sin(r2[i].angle) * r2[i].r;
        }
        s.userData.ring2.geometry.attributes.position.needsUpdate = true;
      }
      if (s.userData.bursting) {
        const bp = s.userData.bPosArr;
        const bv = s.userData.burstVels;
        for (let i = 0; i < 60; i++) {
          bp[i*3]   += bv[i].x;
          bp[i*3+1] += bv[i].y;
          bp[i*3+2] += bv[i].z;
          bv[i].multiplyScalar(0.93);
        }
        s.userData.bGeo.attributes.position.needsUpdate = true;
        s.userData.bMat.opacity *= 0.96;
        if (s.userData.bMat.opacity < 0.01) {
          s.userData.bursting  = false;
          s.userData.bMat.opacity = 0;
        }
      }
    });

    document.getElementById('aim-reset-btn').onclick = reset;
  }

  function reset() {
    state = 'idle'; clickCount = 0; clickTimes = []; missCount = 0;
    currentTarget = null;
    document.querySelectorAll('.aim-target, .miss-flash').forEach(el => el.remove());
    document.getElementById('aim-hits').textContent     = '0/30';
    document.getElementById('aim-avg-time').textContent = '—';
    document.getElementById('aim-score').textContent    = '0';
    document.getElementById('aim-results').style.display = 'none';
    document.getElementById('aim-progress-fill').style.width = '0%';
    const arena = getArena();
    arena.style.display = '';
    arena.classList.remove('active');
    document.querySelector('.aim-progress-bar') && (document.querySelector('.aim-progress-bar').style.display = '');
    getOverlay().style.display = '';
    getOverlay().style.opacity = '';
    getOverlay().textContent = 'Click to Start';
  }

  function destroy() {
    if (sm) { sm.destroy(); sm = null; }
  }

  return { init, handleArenaClick, reset, destroy };
})();
