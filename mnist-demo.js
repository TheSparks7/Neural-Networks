
(function () {
  'use strict';

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MODEL_URL = 'https://carlos-aguayo.github.io/model/model.json';

  const canvas = document.getElementById('mnist-canvas');
  const ctx = canvas.getContext('2d');
  const statusEl = document.getElementById('mnist-status');
  const clearBtn = document.getElementById('mnist-clear');
  const digitEl = document.getElementById('mnist-digit');
  const confidenceEl = document.getElementById('mnist-confidence');
  const barsEl = document.getElementById('mnist-bars');
  const sizeEl = document.getElementById('mnist-size');
  const paramsEl = document.getElementById('mnist-params');

  let model = null;
  let drawing = false;
  let lastX = 0;
  let lastY = 0;
  let predictTimer = null;


  function resetCanvas() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function drawDot(x, y) {
    ctx.beginPath();
    ctx.arc(x, y, 9, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
  }

  function drawLine(x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 18;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  }

  function getCanvasPos(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }


  canvas.addEventListener('pointerdown', function (e) {
    drawing = true;
    canvas.setPointerCapture(e.pointerId);
    const p = getCanvasPos(e);
    lastX = p.x;
    lastY = p.y;
    drawDot(p.x, p.y);
  });

  canvas.addEventListener('pointermove', function (e) {
    if (!drawing) return;
    const p = getCanvasPos(e);
    drawLine(lastX, lastY, p.x, p.y);
    lastX = p.x;
    lastY = p.y;
  });

  function stopDrawing() {
    if (!drawing) return;
    drawing = false;
    schedulePredict();
  }

  canvas.addEventListener('pointerup', stopDrawing);
  canvas.addEventListener('pointerleave', stopDrawing);
  canvas.addEventListener('pointercancel', stopDrawing);


  function schedulePredict() {
    if (predictTimer) clearTimeout(predictTimer);
    predictTimer = setTimeout(function () {
      predictTimer = null;
      predict();
    }, 50);
  }


  function preprocess() {
    const w = canvas.width;
    const h = canvas.height;
    const imageData = ctx.getImageData(0, 0, w, h);
    const data = imageData.data;

    let minX = w, minY = h, maxX = 0, maxY = 0;
    let hasInk = false;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
        if (brightness > 10) {
          hasInk = true;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (!hasInk) return null;

    const bw = maxX - minX + 1;
    const bh = maxY - minY + 1;

    const crop = document.createElement('canvas');
    crop.width = bw;
    crop.height = bh;
    crop.getContext('2d').drawImage(canvas, minX, minY, bw, bh, 0, 0, bw, bh);


    const scale = 20 / Math.max(bw, bh);
    const sw = Math.max(1, Math.round(bw * scale));
    const sh = Math.max(1, Math.round(bh * scale));

    const scaled = document.createElement('canvas');
    scaled.width = sw;
    scaled.height = sh;
    const sctx = scaled.getContext('2d');
    sctx.imageSmoothingEnabled = true;
    sctx.drawImage(crop, 0, 0, bw, bh, 0, 0, sw, sh);


    const sData = sctx.getImageData(0, 0, sw, sh).data;
    let mass = 0, cx = 0, cy = 0;
    for (let y = 0; y < sh; y++) {
      for (let x = 0; x < sw; x++) {
        const idx = (y * sw + x) * 4;
        const m = (sData[idx] + sData[idx + 1] + sData[idx + 2]) / 3;
        if (m > 10) {
          mass += m;
          cx += x * m;
          cy += y * m;
        }
      }
    }
    if (mass === 0) return null;
    cx /= mass;
    cy /= mass;


    const frame = document.createElement('canvas');
    frame.width = 28;
    frame.height = 28;
    const fctx = frame.getContext('2d');
    fctx.fillStyle = '#000';
    fctx.fillRect(0, 0, 28, 28);
    fctx.drawImage(scaled, Math.round(14 - cx), Math.round(14 - cy));

    const fData = fctx.getImageData(0, 0, 28, 28).data;
    const input = new Float32Array(28 * 28);
    for (let i = 0; i < 28 * 28; i++) {
      input[i] = fData[i * 4] / 255; /* red channel = grayscale */
    }
    return input;
  }


  function buildBars() {
    for (let i = 0; i < 10; i++) {
      const row = document.createElement('div');
      row.className = 'mnist-demo__bar-row';
      row.innerHTML =
        '<span class="mnist-demo__bar-label">' + i + '</span>' +
        '<span class="mnist-demo__bar-track">' +
        '<span class="mnist-demo__bar-fill" data-digit="' + i + '"></span>' +
        '</span>';
      barsEl.appendChild(row);
    }
  }

  function updateBars(probs) {
    const rows = barsEl.querySelectorAll('.mnist-demo__bar-row');
    let best = 0;
    let bestProb = probs[0];
    for (let i = 0; i < 10; i++) {
      if (probs[i] > bestProb) {
        bestProb = probs[i];
        best = i;
      }
    }
    rows.forEach(function (row, i) {
      const fill = row.querySelector('.mnist-demo__bar-fill');
      fill.style.width = (probs[i] * 100).toFixed(1) + '%';
      row.classList.toggle('is-winner', i === best);
    });
    digitEl.textContent = best;
    confidenceEl.textContent = (bestProb * 100).toFixed(1) + '%';
    statusEl.textContent = 'confident · ' + (bestProb * 100).toFixed(1) + '%';
  }

  function resetReadout() {
    digitEl.textContent = '–';
    confidenceEl.textContent = '—';
    const rows = barsEl.querySelectorAll('.mnist-demo__bar-row');
    rows.forEach(function (row) {
      row.classList.remove('is-winner');
      row.querySelector('.mnist-demo__bar-fill').style.width = '0%';
    });
  }


  async function predict() {
    if (!model) return;
    const inputArr = preprocess();
    if (!inputArr) {
      statusEl.textContent = 'draw something';
      resetReadout();
      return;
    }

    statusEl.textContent = 'thinking…';

    const input = tf.tensor4d(inputArr, [1, 28, 28, 1]);
    const output = model.predict(input);
    const probs = await output.data();

    input.dispose();
    output.dispose();

    updateBars(probs);
  }


  clearBtn.addEventListener('click', function () {
    resetCanvas();
    resetReadout();
    statusEl.textContent = 'ready — draw something';
  });

  async function loadModel() {
    try {
      model = await tf.loadLayersModel(MODEL_URL);


      const dummy = tf.zeros([1, 28, 28, 1]);
      const warm = model.predict(dummy);
      warm.dispose();
      dummy.dispose();

  
      const params = model.countParams();
      paramsEl.textContent = params.toLocaleString();

  
      let totalBytes = 0;
      try {
        const jsonRes = await fetch(MODEL_URL);
        const jsonText = await jsonRes.text();
        totalBytes += new Blob([jsonText]).size;

        const weightsUrl = MODEL_URL.replace('model.json', 'group1-shard1of1.bin');
        const head = await fetch(weightsUrl, { method: 'HEAD' });
        const cl = head.headers.get('content-length');
        if (cl) totalBytes += parseInt(cl, 10);
        else totalBytes += params * 4; 
      } catch (_) {
        totalBytes = params * 4; 
      }

      const kb = Math.round(totalBytes / 1024);
      sizeEl.textContent = '~' + kb + ' KB';

      statusEl.textContent = 'ready — draw something';
    } catch (err) {
      console.error('Model load failed:', err);
      statusEl.textContent = 'model failed to load';
    }
  }


  function reveal() {
    if (reduce) return;
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    gsap.from('.mnist-demo__inner', {
      scrollTrigger: {
        trigger: '.mnist-demo',
        start: 'top 82%',
        toggleActions: 'play none none none'
      },
      opacity: 0,
      y: 36,
      duration: 0.8,
      ease: 'power2.out'
    });
  }


  function init() {
    resetCanvas();
    buildBars();
    reveal();
    loadModel();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();