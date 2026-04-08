var currentHue   = 200;
var currentSat   = 65;
var currentLight = 50;

(function () {
  const canvas = document.getElementById('colorWheel');
  const ctx    = canvas.getContext('2d');
  const dot    = document.getElementById('cursorDot');

  function drawWheel() {
    const cx = 80, cy = 80, r = 78;
    for (let deg = 0; deg < 360; deg++) {
      const startAngle = (deg - 0.5) * Math.PI / 180;
      const endAngle   = (deg + 1.5) * Math.PI / 180;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      grad.addColorStop(0, `hsl(${deg}, 0%, ${currentLight}%)`);
      grad.addColorStop(1, `hsl(${deg}, 100%, ${currentLight}%)`);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();
    }
  }

  function syncUI() {
    const hex = hslToHex(currentHue, currentSat, currentLight).toUpperCase();
    document.getElementById('hexPreview').style.background = hex;
    document.getElementById('hexInput').value = hex;
    document.getElementById('lightnessSlider').value = currentLight;
    document.getElementById('lightnessVal').textContent = currentLight + '%';
    const angle = currentHue * Math.PI / 180;
    const dx = 80 + 76 * (currentSat / 100) * Math.cos(angle);
    const dy = 80 + 76 * (currentSat / 100) * Math.sin(angle);
    dot.style.left       = dx + 'px';
    dot.style.top        = dy + 'px';
    dot.style.background = hex;
    dot.style.display    = 'block';
  }

  function pickXY(clientX, clientY) {
    const rect   = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;
    const x  = (clientX - rect.left) * scaleX;
    const y  = (clientY - rect.top)  * scaleY;
    const dx = x - 80, dy = y - 80;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 78) return;
    currentHue = Math.round((Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360);
    currentSat = Math.round(Math.min(dist / 78 * 100, 100));
    drawWheel();
    syncUI();
  }

  canvas.addEventListener('click',     e => pickXY(e.clientX, e.clientY));
  canvas.addEventListener('mousemove', e => { if (e.buttons === 1) pickXY(e.clientX, e.clientY); });

  document.getElementById('lightnessSlider').addEventListener('input', function () {
    currentLight = parseInt(this.value);
    document.getElementById('lightnessVal').textContent = currentLight + '%';
    drawWheel();
    syncUI();
  });

  document.getElementById('hexInput').addEventListener('input', function () {
    const v = this.value.trim();
    if (/^#[0-9A-Fa-f]{6}$/.test(v)) {
      const hsl = hexToHsl(v);
      if (hsl) { [currentHue, currentSat, currentLight] = hsl; drawWheel(); syncUI(); }
    }
  });

  drawWheel();
  syncUI();
})();
