const ReactionTest = (() => {
  let state     = 'idle';   // idle | countdown | waiting | active | result | false-start
  let startTime = 0;
  let waitTimer = null;
  let results   = [];
  let sm        = null;

  function getZone()  { return document.getElementById('reaction-zone'); }
  function getMsg()   { return document.getElementById('reaction-msg'); }
  function getHint()  { return document.getElementById('reaction-hint'); }
  function getTime()  { return document.getElementById('reaction-time'); }

  function setState(s) {
    state = s;
    const zone = getZone();
    if (zone) zone.setAttribute('data-state', s);
  }

  function updateStats() {
    if (!results.length) return;
    const best = Math.min(...results);
    const avg  = Math.round(results.reduce((a, b) => a + b, 0) / results.length);
    document.getElementById('reaction-stat-last').textContent  = results[results.length - 1] + 'ms';
    document.getElementById('reaction-stat-best').textContent  = best + 'ms';
    document.getElementById('reaction-stat-avg').textContent   = avg + 'ms';
    document.getElementById('reaction-stat-count').textContent = results.length;
  }

  function showActive() {
    setState('active');
    getMsg().textContent  = 'CLICK NOW!';
    getMsg().style.color  = 'var(--reaction)';
    getHint().textContent = '';
    startTime = performance.now();
    if (sm && sm.userData.explode) sm.userData.explode();
  }

  function handleClick() {
    if (state === 'idle') {
      setState('countdown');
      getMsg().textContent  = 'Get Ready…';
      getMsg().style.color  = '';
      getHint().textContent = 'Don\'t click early!';
      getTime().style.display = 'none';
      const delay = rand(1000, 5000);
      waitTimer = setTimeout(showActive, delay);

    } else if (state === 'waiting' || state === 'countdown') {
      clearTimeout(waitTimer);
      setState('false-start');
      getMsg().textContent  = 'Too Early!';
      getMsg().style.color  = 'var(--error)';
      getHint().textContent = 'Click to try again';

    } else if (state === 'active') {
      const elapsed = Math.round(performance.now() - startTime);
      setState('result');
      results.push(elapsed);
      GameState.add('reaction', elapsed);

      getMsg().style.display  = 'none';
      getTime().style.display = 'block';
      getTime().textContent   = elapsed + 'ms';
      getHint().textContent   = 'Click to go again';
      updateStats();
      getTime().classList.remove('glow-animate');
      void getTime().offsetWidth;
      getTime().classList.add('glow-animate');

    } else if (state === 'result' || state === 'false-start') {
      setState('idle');
      getMsg().style.display  = 'block';
      getMsg().textContent    = 'Click to Start';
      getMsg().style.color    = '';
      getTime().style.display = 'none';
      getHint().textContent   = 'Wait for green — then click as fast as you can';
    }
  }

  function init() {
    sm = new SceneManager();
    sm.create('reaction-canvas', (s) => {
      const shards = [];
      const colors = [0x10B981, 0x059669, 0x34D399, 0x6EE7B7];
      for (let i = 0; i < 40; i++) {
        const geo = new THREE.TetrahedronGeometry(rand(0.15, 0.55), 0);
        const mat = new THREE.MeshPhongMaterial({
          color: colors[i % colors.length],
          emissive: 0x10B981,
          emissiveIntensity: 0.4,
          transparent: true,
          opacity: rand(0.4, 0.85)
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(rand(-18, 18), rand(-12, 12), rand(-8, 0));
        mesh.userData.vel = new THREE.Vector3(rand(-0.03, 0.03), rand(-0.03, 0.03), 0);
        mesh.userData.rot = new THREE.Vector3(rand(0.005, 0.02), rand(0.005, 0.02), rand(0.005, 0.02));
        mesh.userData.baseOpacity = mat.opacity;
        s.scene.add(mesh);
        shards.push(mesh);
      }
      s.objects = shards;

      s.userData.explode = () => {
        shards.forEach(shard => {
          shard.userData.vel.set(rand(-0.25, 0.25), rand(-0.25, 0.25), 0);
          shard.material.emissiveIntensity = 1.5;
        });
      };
    });

    sm.animate((t, s) => {
      s.objects.forEach(shard => {
        shard.position.addScaledVector(shard.userData.vel, 1);
        shard.rotation.x += shard.userData.rot.x;
        shard.rotation.y += shard.userData.rot.y;
        shard.userData.vel.multiplyScalar(0.97);
        if (shard.position.x >  20) shard.position.x = -20;
        if (shard.position.x < -20) shard.position.x =  20;
        if (shard.position.y >  14) shard.position.y = -14;
        if (shard.position.y < -14) shard.position.y =  14;
        if (shard.material.emissiveIntensity > 0.4)
          shard.material.emissiveIntensity *= 0.97;
        const pulse = Math.sin(t * 1.5 + shard.position.x) * 0.1;
        shard.material.emissiveIntensity = Math.max(0.3 + pulse, shard.material.emissiveIntensity);
      });
    });

    document.getElementById('reaction-reset-btn').onclick = reset;
  }

  function reset() {
    clearTimeout(waitTimer);
    results = [];
    setState('idle');
    const msg  = getMsg();
    const hint = getHint();
    const time = getTime();
    if (msg)  { msg.style.display = 'block'; msg.textContent = 'Click to Start'; msg.style.color = ''; }
    if (hint) hint.textContent = 'Wait for green — then click as fast as you can';
    if (time) { time.style.display = 'none'; }
    ['reaction-stat-last','reaction-stat-best','reaction-stat-avg'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = '—';
    });
    document.getElementById('reaction-stat-count').textContent = '0';
  }

  function destroy() {
    clearTimeout(waitTimer);
    if (sm) { sm.destroy(); sm = null; }
  }

  return { init, handleClick, reset, destroy };
})();
