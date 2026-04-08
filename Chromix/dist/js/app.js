(function () {
  var lastH = null, lastS = null, lastL = null;
  var currentCount = 4;
  var currentStyle = 'matte';
  var lastColors   = [];
  var previewColors = ['','','',''];
  var activeSlot   = 0;

  var genBtn       = document.getElementById('genBtn');
  var rerollBtn    = document.getElementById('rerollBtn');
  var downloadWrap = document.getElementById('downloadWrap');
  var downloadBtn  = document.getElementById('downloadOpenBtn');
  var fmtStep      = document.getElementById('fmtStep');
  var mainView     = document.getElementById('mainView');
  var previewView  = document.getElementById('previewView');
  var previewToggleBtn = document.getElementById('previewToggleBtn');
  var previewBackBtn   = document.getElementById('previewBackBtn');
  var previewColumns   = document.getElementById('previewColumns');
  var previewInputs    = document.getElementById('previewInputs');
  var previewPaletteHint     = document.getElementById('previewPaletteHint');
  var previewPaletteSwatches = document.getElementById('previewPaletteSwatches');
  var blurSlider   = document.getElementById('blurSlider');
  var blurVal      = document.getElementById('blurVal');

  // ── Window controls ───────────────────────────────────────────────────────

  function getTauriWindow() {
    return window.__TAURI__ && window.__TAURI__.window
      ? window.__TAURI__.window.getCurrentWindow()
      : null;
  }

  document.getElementById('closeBtn').addEventListener('click', function () {
    var win = getTauriWindow();
    if (win) { win.close(); } else {
      var app = document.getElementById('app');
      app.style.opacity = '0.35';
      app.style.pointerEvents = 'none';
    }
  });

  document.getElementById('minimizeBtn').addEventListener('click', function () {
    var win = getTauriWindow();
    if (win) win.minimize();
  });

  document.getElementById('maximizeBtn').addEventListener('click', function () {
    var win = getTauriWindow();
    if (win) win.toggleMaximize();
  });

  // ── Style / count selectors ───────────────────────────────────────────────

  document.querySelectorAll('.style-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.style-btn').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      currentStyle = btn.dataset.style;
    });
  });

  document.querySelectorAll('.count-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.count-btn').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      currentCount = parseInt(btn.dataset.count);
    });
  });

  genBtn.addEventListener('click', function () {
    lastH = currentHue; lastS = currentSat; lastL = currentLight;
    resetVariant();
    lastColors = generatePalette(currentStyle, lastH, lastS, lastL, currentCount, 0);
    renderPalette(lastColors);
    rerollBtn.disabled = false;
    downloadWrap.style.display = 'flex';
    fmtStep.style.display = 'none';
    downloadBtn.style.display = 'block';
  });

  rerollBtn.addEventListener('click', function () {
    if (lastH === null) return;
    var idx = nextVariant();
    lastColors = generatePalette(currentStyle, lastH, lastS, lastL, currentCount, idx);
    renderPalette(lastColors);
    showToast('Вариант ' + (idx + 1) + ' / 5 ↻');
  });

  downloadBtn.addEventListener('click', function () {
    fmtStep.style.display = fmtStep.style.display === 'flex' ? 'none' : 'flex';
  });

  document.querySelectorAll('.fmt-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var fmt = btn.dataset.fmt;
      if      (fmt === 'gpl')      downloadGPL(lastColors);
      else if (fmt === 'pal')      downloadPAL(lastColors);
      else if (fmt === 'ase')      downloadASE(lastColors);
      else if (fmt === 'aseprite') downloadAseprite(lastColors);
      fmtStep.style.display = 'none';
      showToast('Скачивание: .' + fmt);
    });
  });

  previewToggleBtn.addEventListener('click', function () {
    mainView.style.display = 'none';
    previewView.style.display = 'block';
    buildPreviewUI();
  });

  previewBackBtn.addEventListener('click', function () {
    previewView.style.display = 'none';
    mainView.style.display = 'block';
  });

  blurSlider.addEventListener('input', function () {
    var px = parseInt(this.value);
    blurVal.textContent = px + 'px';
    applyBlur(px);
  });

  // ── helpers ───────────────────────────────────────────────────────────────

  function hslToRgb(h, s, l) {
    s /= 100; l /= 100;
    var a = s * Math.min(l, 1 - l);
    var f = function (n) {
      var k = (n + h / 30) % 12;
      return Math.round((l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)) * 255);
    };
    return [f(0), f(8), f(4)];
  }

  function hslArrToHex(hsl) {
    var rgb = hslToRgb(hsl[0], hsl[1], hsl[2]);
    return '#' + rgb.map(function (v) {
      return ('0' + v.toString(16)).slice(-2);
    }).join('').toUpperCase();
  }

  function sortByLightness(colors) {
    return colors.slice().sort(function (a, b) { return b[2] - a[2]; });
  }

  function buildPaletteSwatches() {
    previewPaletteSwatches.innerHTML = '';
    if (!lastColors || lastColors.length === 0) {
      previewPaletteHint.style.display = 'none';
      return;
    }
    previewPaletteHint.style.display = 'block';
    var sorted = sortByLightness(lastColors);
    sorted.forEach(function (hsl) {
      var hex = hslArrToHex(hsl);
      var sw = document.createElement('button');
      sw.className = 'preview-palette-swatch';
      sw.style.background = hex;
      sw.title = hex;
      if (previewColors.indexOf(hex) !== -1) sw.classList.add('used');
      sw.addEventListener('click', function () {
        setSlotColor(activeSlot, hex);
        activeSlot = findNextSlot(activeSlot);
        updateActiveSlotUI();
        updateSwatchUsedState();
      });
      previewPaletteSwatches.appendChild(sw);
    });
  }

  function findNextSlot(current) {
    for (var i = 1; i <= 4; i++) {
      var idx = (current + i) % 4;
      if (!previewColors[idx]) return idx;
    }
    return (current + 1) % 4;
  }

  function updateSwatchUsedState() {
    var swatches = previewPaletteSwatches.querySelectorAll('.preview-palette-swatch');
    swatches.forEach(function (sw) {
      sw.classList.toggle('used', previewColors.indexOf(sw.title) !== -1);
    });
  }

  function updateActiveSlotUI() {
    var inputs = previewInputs.querySelectorAll('.preview-hex-inp');
    inputs.forEach(function (inp, i) {
      inp.classList.toggle('active-slot', i === activeSlot);
    });
  }

  function setSlotColor(idx, hex) {
    previewColors[idx] = hex;
    var col = document.getElementById('pcol' + idx);
    if (col) col.style.background = hex;
    var inputs = previewInputs.querySelectorAll('.preview-hex-inp');
    if (inputs[idx]) inputs[idx].value = hex;
    applyBlur(parseInt(blurSlider.value));
  }

  function buildPreviewUI() {
    previewColumns.innerHTML = '';
    previewInputs.innerHTML  = '';
    blurSlider.value = 0;
    blurVal.textContent = '0px';
    activeSlot = 0;

    for (var i = 0; i < 4; i++) {
      var col = document.createElement('div');
      col.className = 'preview-col';
      col.id = 'pcol' + i;
      col.style.background = previewColors[i] || '#e6e5e1';
      previewColumns.appendChild(col);

      var inp = document.createElement('input');
      inp.type = 'text';
      inp.className = 'preview-hex-inp' + (i === 0 ? ' active-slot' : '');
      inp.maxLength = 7;
      inp.value = previewColors[i] || '';
      inp.placeholder = '#HEX';
      inp.dataset.idx = i;
      inp.addEventListener('focus', function (e) {
        activeSlot = parseInt(e.target.dataset.idx);
        updateActiveSlotUI();
      });
      inp.addEventListener('input', onPreviewInput);
      previewInputs.appendChild(inp);
    }

    applyBlur(0);
    buildPaletteSwatches();
  }

  function onPreviewInput(e) {
    var idx = parseInt(e.target.dataset.idx);
    var val = e.target.value.trim();
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
      previewColors[idx] = val.toUpperCase();
      document.getElementById('pcol' + idx).style.background = val;
      applyBlur(parseInt(blurSlider.value));
      updateSwatchUsedState();
    } else if (val === '' || val === '#') {
      previewColors[idx] = '';
      document.getElementById('pcol' + idx).style.background = '#e6e5e1';
      updateSwatchUsedState();
    }
  }

  function applyBlur(px) {
    previewColumns.style.filter = px > 0 ? 'blur(' + px + 'px)' : 'none';
  }

  // ── download helpers ──────────────────────────────────────────────────────

  function triggerDownload(blob, filename) {
    var url = URL.createObjectURL(blob);
    var a   = document.createElement('a');
    a.href  = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function downloadGPL(colors) {
    var lines = ['GIMP Palette', 'Name: Chromix', 'Columns: 4', '#'];
    colors.forEach(function (c, i) {
      var rgb = hslToRgb(c[0], c[1], c[2]);
      lines.push(rgb[0] + '\t' + rgb[1] + '\t' + rgb[2] + '\tColor ' + (i + 1));
    });
    triggerDownload(new Blob([lines.join('\n')], { type: 'text/plain' }), 'chromix.gpl');
  }

  function downloadPAL(colors) {
    var lines = ['JASC-PAL', '0100', String(colors.length)];
    colors.forEach(function (c) {
      var rgb = hslToRgb(c[0], c[1], c[2]);
      lines.push(rgb[0] + ' ' + rgb[1] + ' ' + rgb[2]);
    });
    triggerDownload(new Blob([lines.join('\r\n')], { type: 'text/plain' }), 'chromix.pal');
  }

  function downloadASE(colors) {
    var bytes = [];
    function u8(v)  { bytes.push(v & 0xff); }
    function u16(v) { bytes.push((v >> 8) & 0xff, v & 0xff); }
    function u32(v) { bytes.push((v >> 24) & 0xff, (v >> 16) & 0xff, (v >> 8) & 0xff, v & 0xff); }
    function f32(v) { var b = new ArrayBuffer(4); new DataView(b).setFloat32(0, v, false); var a = new Uint8Array(b); bytes.push(a[0],a[1],a[2],a[3]); }
    u8(0x41); u8(0x53); u8(0x45); u8(0x46);
    u16(1); u16(0); u32(colors.length);
    colors.forEach(function (c, i) {
      var rgb = hslToRgb(c[0], c[1], c[2]);
      var name = 'Color ' + (i + 1); var nLen = name.length + 1;
      u16(0x0001); u32(2 + nLen * 2 + 4 + 4 * 3 + 2);
      u16(nLen);
      for (var j = 0; j < name.length; j++) { u16(name.charCodeAt(j)); }
      u16(0); u8(0x52); u8(0x47); u8(0x42); u8(0x20);
      f32(rgb[0]/255); f32(rgb[1]/255); f32(rgb[2]/255); u16(0);
    });
    triggerDownload(new Blob([new Uint8Array(bytes)], { type: 'application/octet-stream' }), 'chromix.ase');
  }

  function downloadAseprite(colors) {
    var n    = colors.length;
    var rgbs = colors.map(function (c) { return hslToRgb(c[0], c[1], c[2]); });
    var buf = [];
    function u8(v)    { buf.push(v & 0xff); }
    function u16le(v) { buf.push(v & 0xff, (v >> 8) & 0xff); }
    function u32le(v) { buf.push(v & 0xff, (v >> 8) & 0xff, (v >> 16) & 0xff, (v >> 24) & 0xff); }
    function zeros(k) { for (var i = 0; i < k; i++) buf.push(0); }
    var chunkSize = 4 + 2 + 4 + 4 + 4 + 8 + n * 6;
    var frameSize = 16 + chunkSize;
    var fileSize  = 128 + frameSize;
    u32le(fileSize); u16le(0xA5E0); u16le(1); u16le(1); u16le(1); u16le(8); u32le(1); u16le(100);
    zeros(8); u8(0); zeros(3); u16le(n); u8(1); u8(1); u16le(0); u16le(0); u16le(16); u16le(16); zeros(84);
    u32le(frameSize); u16le(0xF1FA); u16le(0xFFFF); u16le(100); zeros(2); u32le(1);
    u32le(chunkSize); u16le(0x2019); u32le(n); u32le(0); u32le(n - 1); zeros(8);
    for (var i = 0; i < n; i++) { u16le(0); u8(rgbs[i][0]); u8(rgbs[i][1]); u8(rgbs[i][2]); u8(255); }
    triggerDownload(new Blob([new Uint8Array(buf)], { type: 'application/octet-stream' }), 'chromix.aseprite');
  }

  var toastTimer = null;
  window.showToast = function (msg) {
    var el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('show'); }, 1800);
  };
})();