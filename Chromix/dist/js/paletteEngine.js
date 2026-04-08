var MATTE_VARIANTS = [
  { satPeak: 0.38, satMin: 0.12, satMax: 0.72, hueShift:  6 },
  { satPeak: 0.30, satMin: 0.08, satMax: 0.80, hueShift: 10 },
  { satPeak: 0.45, satMin: 0.18, satMax: 0.65, hueShift:  3 },
  { satPeak: 0.50, satMin: 0.05, satMax: 0.90, hueShift: 15 },
  { satPeak: 0.35, satMin: 0.20, satMax: 0.60, hueShift:  0 },
];

var CONTRAST_VARIANTS = [
  { satFloor: 0.75, satPeak: 1.05, peakPos: 0.42, hueWobble:  8, lSpread: 1.10 },
  { satFloor: 0.70, satPeak: 1.10, peakPos: 0.38, hueWobble: 12, lSpread: 1.15 },
  { satFloor: 0.80, satPeak: 1.00, peakPos: 0.50, hueWobble:  5, lSpread: 1.08 },
  { satFloor: 0.72, satPeak: 1.08, peakPos: 0.35, hueWobble: 15, lSpread: 1.12 },
  { satFloor: 0.78, satPeak: 1.02, peakPos: 0.45, hueWobble: 10, lSpread: 1.10 },
];

var FANTASY_VARIANTS = [
  { sweep: 30, satPeakBoost: 1.20, satFloor: 0.70 },
  { sweep: 40, satPeakBoost: 1.15, satFloor: 0.65 },
  { sweep: 22, satPeakBoost: 1.25, satFloor: 0.75 },
  { sweep: 35, satPeakBoost: 1.10, satFloor: 0.68 },
  { sweep: 45, satPeakBoost: 1.18, satFloor: 0.72 },
];

var PALE_VARIANTS = [
  { satScale: 0.55, satAdd: -8,  dustScale: 0.18, hueStep:  4 },
  { satScale: 0.50, satAdd: -5,  dustScale: 0.22, hueStep:  6 },
  { satScale: 0.60, satAdd: -10, dustScale: 0.14, hueStep:  3 },
  { satScale: 0.48, satAdd: -6,  dustScale: 0.20, hueStep:  8 },
  { satScale: 0.52, satAdd: -7,  dustScale: 0.16, hueStep:  5 },
];

var ACID_VARIANTS = [
  { satFloor: 0.88, satPeak: 1.10, peakPos: 0.50, lCompress: 0.60 },
  { satFloor: 0.85, satPeak: 1.15, peakPos: 0.42, lCompress: 0.55 },
  { satFloor: 0.90, satPeak: 1.08, peakPos: 0.58, lCompress: 0.65 },
  { satFloor: 0.86, satPeak: 1.12, peakPos: 0.38, lCompress: 0.58 },
  { satFloor: 0.92, satPeak: 1.06, peakPos: 0.62, lCompress: 0.62 },
];

// Пастельная: высокая яркость (75–92%), низкая насыщенность (20–45%),
// лёгкий дрейф оттенка — мягкие конфетные тона без серости бледного стиля.
var PASTEL_VARIANTS = [
  { satBase: 0.58, satWave: 0.18, lTop: 90, lBot: 70, hueStep:  8 },
  { satBase: 0.52, satWave: 0.16, lTop: 88, lBot: 72, hueStep: 14 },
  { satBase: 0.64, satWave: 0.20, lTop: 91, lBot: 74, hueStep:  5 },
  { satBase: 0.50, satWave: 0.14, lTop: 89, lBot: 76, hueStep: 20 },
  { satBase: 0.60, satWave: 0.22, lTop: 87, lBot: 68, hueStep: 11 },
];

var _variantIndex = 0;
function nextVariant()  { _variantIndex = (_variantIndex + 1) % 5; return _variantIndex; }
function resetVariant() { _variantIndex = 0; }

function generateMattePalette(h, s, l, count, vi) {
  var v    = MATTE_VARIANTS[vi || 0];
  var topL = Math.min(94, l + 38);
  var botL = Math.max(7,  l - 50);
  var out  = [];
  for (var i = 0; i < count; i++) {
    var t    = count === 1 ? 0.5 : i / (count - 1);
    var curL = Math.round(topL - t * (topL - botL));
    var dist = Math.abs(t - v.satPeak);
    var bell = Math.exp(-(dist * dist) / (2 * 0.55 * 0.55));
    var satF = v.satMin + (v.satMax - v.satMin) * bell;
    var curS = Math.round(Math.max(Math.min(s * satF, 95), 4));
    var curH = Math.round((h + v.hueShift * t + 360) % 360);
    out.push([curH, curS, curL]);
  }
  return out;
}

function generateContrastPalette(h, s, l, count, vi) {
  var v    = CONTRAST_VARIANTS[vi || 0];
  var topL = Math.min(97, l + 45 * v.lSpread);
  var botL = Math.max(4,  l - 55 * v.lSpread);
  var out  = [];
  for (var i = 0; i < count; i++) {
    var t            = count === 1 ? 0.5 : i / (count - 1);
    var curL         = Math.round(topL - t * (topL - botL));
    var distFromPeak = Math.abs(t - v.peakPos);
    var bell         = Math.exp(-(distFromPeak * distFromPeak) / (2 * 0.28 * 0.28));
    var satF         = v.satFloor + (v.satPeak - v.satFloor) * bell;
    var curS         = Math.round(Math.max(Math.min(s * satF, 96), 20));
    var curH         = Math.round((h + v.hueWobble * Math.sin(t * Math.PI) + 360) % 360);
    out.push([curH, curS, curL]);
  }
  return out;
}

function generateFantasyPalette(h, s, l, count, vi) {
  var v    = FANTASY_VARIANTS[vi || 0];
  var topL = Math.min(90, l + 30);
  var botL = Math.max(12, l - 42);
  var out  = [];
  for (var i = 0; i < count; i++) {
    var t    = count === 1 ? 0.5 : i / (count - 1);
    var curH = Math.round((h - v.sweep * t + 360) % 360);
    var curL = Math.round(topL - t * (topL - botL));
    var bell = 0.55 + 0.45 * Math.sin(t * Math.PI);
    var curS = Math.round(Math.max(Math.min(s * v.satFloor + (s * (v.satPeakBoost - v.satFloor)) * bell, 95), 30));
    out.push([curH, curS, curL]);
  }
  return out;
}

function generatePalePalette(h, s, l, count, vi) {
  var v    = PALE_VARIANTS[vi || 0];
  var topL = Math.min(88, l + 26);
  var botL = Math.max(18, l - 30);
  var out  = [];
  for (var i = 0; i < count; i++) {
    var t    = count === 1 ? 0.5 : i / (count - 1);
    var baseL = topL - t * (topL - botL);
    var dust  = v.dustScale * Math.sin((t + 0.1) * Math.PI) * (topL - botL);
    var curL  = Math.round(Math.max(Math.min(baseL + dust, 88), 15));
    var curS  = Math.round(Math.max(Math.min(s * v.satScale + v.satAdd, 72), 6));
    curS      = Math.round(curS * (0.85 + 0.15 * Math.cos(t * Math.PI)));
    var curH  = Math.round((h + v.hueStep * t + 360) % 360);
    out.push([curH, curS, curL]);
  }
  return out;
}

function generateAcidPalette(h, s, l, count, vi) {
  var v    = ACID_VARIANTS[vi || 0];
  var midL = Math.max(38, Math.min(72, l));
  var topL = Math.min(88, midL + 26 * v.lCompress);
  var botL = Math.max(24, midL - 30 * v.lCompress);
  var out  = [];
  for (var i = 0; i < count; i++) {
    var t    = count === 1 ? 0.5 : i / (count - 1);
    var curL = Math.round(topL - t * (topL - botL));
    var dist = Math.abs(t - v.peakPos);
    var bell = Math.exp(-(dist * dist) / (2 * 0.35 * 0.35));
    var satF = v.satFloor + (v.satPeak - v.satFloor) * bell;
    var curS = Math.round(Math.max(Math.min(s * satF, 100), 60));
    out.push([h, curS, curL]);
  }
  return out;
}

function generatePastelPalette(h, s, l, count, vi) {
  var v   = PASTEL_VARIANTS[vi || 0];
  // Яркость зажата в высоком диапазоне — пастель всегда светлая
  var topL = Math.min(v.lTop, Math.max(v.lTop - 6, l + 34));
  var botL = Math.max(v.lBot, Math.min(v.lBot + 6, l + 14));
  var out  = [];
  for (var i = 0; i < count; i++) {
    var t    = count === 1 ? 0.5 : i / (count - 1);
    var curL = Math.round(topL - t * (topL - botL));
    // Насыщенность — синусоидальная волна, никогда не высокая
    var wave = v.satBase + v.satWave * Math.sin(t * Math.PI * 1.5 + 0.4);
    var curS = Math.round(Math.max(Math.min(s * wave, 72), 22));
    // Небольшой дрейф оттенка для разнообразия
    var curH = Math.round((h + v.hueStep * t + 360) % 360);
    out.push([curH, curS, curL]);
  }
  return out;
}

function generatePalette(style, h, s, l, count, vi) {
  switch (style) {
    case 'contrast': return generateContrastPalette(h, s, l, count, vi);
    case 'fantasy':  return generateFantasyPalette(h, s, l, count, vi);
    case 'pale':     return generatePalePalette(h, s, l, count, vi);
    case 'acid':     return generateAcidPalette(h, s, l, count, vi);
    case 'pastel':   return generatePastelPalette(h, s, l, count, vi);
    default:         return generateMattePalette(h, s, l, count, vi);
  }
}

function renderPalette(colors) {
  var container = document.getElementById('results');
  container.innerHTML = '';
  var compact = colors.length > 4;
  container.className = 'results' + (compact ? ' results--compact' : '');
  colors.forEach(function (entry) {
    var h = entry[0], s = entry[1], l = entry[2];
    var hex = hslToHex(h, s, l).toUpperCase();
    var row = document.createElement('div');
    row.className = 'swatch-row' + (compact ? ' swatch-row--compact' : '');
    if (compact) {
      row.innerHTML =
        '<div class="swatch-color" style="background:' + hex + '"></div>' +
        '<div class="swatch-hex">' + hex + '</div>' +
        '<div class="swatch-copy">COPY</div>';
    } else {
      row.innerHTML =
        '<div class="swatch-color" style="background:' + hex + '"></div>' +
        '<div class="swatch-info">' +
          '<div class="swatch-hex">' + hex + '</div>' +
          '<div class="swatch-hsl">hsl(' + h + ', ' + s + '%, ' + l + '%)</div>' +
        '</div>' +
        '<div class="swatch-copy">COPY</div>';
    }
    row.addEventListener('click', function () {
      navigator.clipboard && navigator.clipboard.writeText(hex);
      showToast('Скопировано: ' + hex);
    });
    container.appendChild(row);
  });
}