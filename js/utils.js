function countUp(el, target, duration) {
  const start = performance.now();
  const from = 0;
  function frame(now) {
    const p = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(from + (target - from) * ease);
    if (p < 1) requestAnimationFrame(frame);
    else el.textContent = target;
  }
  requestAnimationFrame(frame);
}

function lerp(a, b, t) { return a + (b - a) * t; }

function rand(min, max) { return Math.random() * (max - min) + min; }
