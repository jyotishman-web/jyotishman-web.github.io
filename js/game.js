// ═══════════════════════════════════════════════
//  GAME  — canvas setup, input, loop, state
//  Load order: audio.js → terrain.js → physics.js
//              → render.js → game.js  (this file)
// ═══════════════════════════════════════════════
'use strict';

// ── Canvas & layout ─────────────────────────────
const c    = document.getElementById('c');
const ctx  = c.getContext('2d');
const wrap = document.getElementById('wrap');
const bGas   = document.getElementById('btnGas');
const bBrake = document.getElementById('btnBrake');

let W = 0, H = 0;

function layout() {
  const sw = window.innerWidth, sh = window.innerHeight;
  const portrait = sh > sw;

  if (portrait) {
    // Rotate the entire #wrap 90° so portrait phones play landscape
    W = sh; H = sw;
    wrap.style.width     = sh + 'px';
    wrap.style.height    = sw + 'px';
    wrap.style.top       = ((sh - sw) / 2) + 'px';
    wrap.style.left      = ((sw - sh) / 2) + 'px';
    wrap.style.transform = 'rotate(90deg)';
    wrap.style.transformOrigin = 'center center';
  } else {
    W = sw; H = sh;
    wrap.style.width     = sw + 'px';
    wrap.style.height    = sh + 'px';
    wrap.style.top       = '0';
    wrap.style.left      = '0';
    wrap.style.transform = 'none';
  }

  c.width  = W;
  c.height = H;
}

window.addEventListener('resize', layout);
window.addEventListener('orientationchange', () => setTimeout(layout, 300));
layout();

// Attempt to lock orientation (works on Android Chrome)
try {
  screen.orientation && screen.orientation.lock &&
    screen.orientation.lock('landscape').catch(() => {});
} catch (e) {}
document.addEventListener('touchstart', () => {
  try {
    screen.orientation && screen.orientation.lock &&
      screen.orientation.lock('landscape').catch(() => {});
  } catch (e) {}
}, { once: true });

// ── Input ────────────────────────────────────────
const K = { gas: false, brake: false };

document.addEventListener('keydown', e => {
  initAudio();
  if (e.key === 'ArrowRight' || e.key === 'd') K.gas   = true;
  if (e.key === 'ArrowLeft'  || e.key === 'a') K.brake = true;
});
document.addEventListener('keyup', e => {
  if (e.key === 'ArrowRight' || e.key === 'd') K.gas   = false;
  if (e.key === 'ArrowLeft'  || e.key === 'a') K.brake = false;
});

function bindBtn(el, key) {
  const on  = () => { initAudio(); K[key] = true;  el.classList.add('on'); };
  const off = () => { K[key] = false; el.classList.remove('on'); };
  el.addEventListener('touchstart',  e => { e.preventDefault(); on();  }, { passive: false });
  el.addEventListener('touchend',    e => { e.preventDefault(); off(); }, { passive: false });
  el.addEventListener('touchcancel', off);
  el.addEventListener('mousedown',   on);
  el.addEventListener('mouseup',     off);
  el.addEventListener('mouseleave',  off);
}
bindBtn(bGas,   'gas');
bindBtn(bBrake, 'brake');

// ── Collectibles ─────────────────────────────────
let coins    = [];
let fuelCans = [];

function spawnPickups(fromIdx) {
  for (let i = fromIdx; i < terrain.length - 2; i++) {
    const a  = terrain[i];
    const b  = terrain[i + 1] || a;
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;

    if (i % 4 === 0) {
      coins.push({ x: mx, y: my - 48, collected: false, bob: Math.random() * Math.PI * 2 });
    }
    if (i % 25 === 0 && i > 10) {
      fuelCans.push({ x: a.x + 20, y: a.y - 60, collected: false });
    }
  }
}

// ── Particles ────────────────────────────────────
let particles = [];

function addParticles(x, y, vx, vy, n, color, size) {
  for (let i = 0; i < n; i++) {
    particles.push({
      x, y,
      vx: vx + (Math.random() - 0.5) * 100,
      vy: vy + (Math.random() - 0.5) * 80 - 30,
      life: 0.5 + Math.random() * 0.4,
      ml:   0.7,
      r:    (size || 4) * (0.5 + Math.random()),
      col:  color,
    });
  }
}

function tickParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x  += p.vx * dt;
    p.y  += p.vy * dt;
    p.vy += 350 * dt;
    p.vx *= 1 - 1.5 * dt;
    p.life -= dt;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

// ── Camera ───────────────────────────────────────
let camX = 0;

// ── Game state ───────────────────────────────────
let gameTime = 0;
let lastTs   = null;
let raf      = null;

// ── startGame ────────────────────────────────────
function startGame() {
  document.getElementById('overlay').classList.add('hide');
  initAudio();
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  layout();

  tSeed     = Math.floor(Math.random() * 99999) + 100;
  terrain   = [];
  coins     = [];
  fuelCans  = [];
  particles = [];

  // Flat starting section
  const sy = H * 0.60;
  for (let i = 0; i < 12; i++) terrain.push({ x: i * 60, y: sy });

  // Rolling hills
  const last  = terrain[terrain.length - 1];
  const hills = buildTerrain(last.x + 60, sy, 700);
  terrain.push(...hills);
  spawnPickups(8);

  car      = makeCar(160, sy - 30);
  rpm      = IDLE_RPM;
  camX     = 0;
  gameTime = 0;
  lastTs   = null;

  if (raf) cancelAnimationFrame(raf);
  raf = requestAnimationFrame(loop);
}

// ── End screen ───────────────────────────────────
function showEnd(reason) {
  muteEngine();
  const dist  = Math.max(0, Math.round((car.wx[0] - 160) / 5));
  const title = reason === 'fuel' ? '⛽ NO FUEL!' : '💥 FLIPPED!';

  document.getElementById('ovTitle').textContent = title;
  document.getElementById('ovContent').innerHTML = `
    <div id="ovScores">
      <div class="oscore">
        <div class="oscore-n">📏 ${dist} m</div>
        <div class="oscore-l">DISTANCE</div>
      </div>
      <div class="oscore">
        <div class="oscore-n">🪙 ${car.coins}</div>
        <div class="oscore-l">COINS</div>
      </div>
      <div class="oscore">
        <div class="oscore-n">⏱ ${gameTime.toFixed(1)}s</div>
        <div class="oscore-l">TIME</div>
      </div>
    </div>`;
  document.getElementById('ovBtn').textContent = '🔄 TRY AGAIN';
  document.getElementById('overlay').classList.remove('hide');
}

// ── Main loop ────────────────────────────────────
function loop(ts) {
  if (!lastTs) lastTs = ts;
  const dt = Math.min((ts - lastTs) / 1000, 0.05);
  lastTs    = ts;
  gameTime += dt;

  // Extend terrain ahead
  const rightEdge = camX + W + 1200;
  if (terrain[terrain.length - 1].x < rightEdge) {
    const last   = terrain[terrain.length - 1];
    const oldLen = terrain.length;
    terrain.push(...buildTerrain(last.x + 60, last.y, 200));
    spawnPickups(oldLen - 1);
  }

  // Trim old terrain & collectibles behind camera
  while (terrain.length > 4   && terrain[1].x    < camX - 500) terrain.shift();
  while (coins.length    > 0  && coins[0].x       < camX - 400) coins.shift();
  while (fuelCans.length > 0  && fuelCans[0].x    < camX - 400) fuelCans.shift();

  // ── Update ──
  updateCar(dt);
  tickParticles(dt);

  // Coin collection
  for (const coin of coins) {
    if (coin.collected) continue;
    const dx = (car.wx[0] + car.wx[1]) / 2 - coin.x;
    const dy = car.smoothY - coin.y;
    if (dx * dx + dy * dy < 45 * 45) {
      coin.collected = true;
      car.coins++;
      playSound('coin');
      addParticles(coin.x, coin.y, 0, -60, 10, '#f5c030', 4);
    }
  }

  // Fuel can collection
  for (const f of fuelCans) {
    if (f.collected) continue;
    const dx = (car.wx[0] + car.wx[1]) / 2 - f.x;
    const dy = car.smoothY - f.y;
    if (dx * dx + dy * dy < 55 * 55) {
      f.collected   = true;
      car.fuel      = Math.min(100, car.fuel + 40);
      playSound('fuel');
      addParticles(f.x, f.y, 0, -50, 14, '#e74c3c', 5);
    }
  }

  // Smooth camera — car stays 42% from right edge
  const targetCam = car.wx[1] - W * 0.42;
  camX += (targetCam - camX) * Math.min(1, 6 * dt);

  // ── Draw ──
  ctx.clearRect(0, 0, W, H);
  drawBG();
  drawTerrain();
  drawCoins(gameTime);
  drawFuelCans();
  drawCar();
  drawParticles();
  drawSpeedometer(Math.abs(car.vx));

  // HUD
  const dist = Math.max(0, Math.round((car.wx[0] - 160) / 5));
  document.getElementById('hDist').textContent   = dist;
  document.getElementById('hCoins').textContent  = car.coins;
  document.getElementById('fuelBar').style.width = car.fuel + '%';

  // End conditions
  if (car.dead) {
    if (car.deadTimer > 0.6) { showEnd('flip'); return; }
  } else if (car.fuel <= 0 && Math.abs(car.vx) < 8 && gameTime > 2) {
    showEnd('fuel'); return;
  }

  raf = requestAnimationFrame(loop);
}
