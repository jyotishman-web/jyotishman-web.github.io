// ═══════════════════════════════════════════════
//  RENDERER
//  Depends on globals: ctx, W, H, camX (game.js),
//    terrain (terrain.js), car/WHEEL_R (physics.js),
//    coins, fuelCans, particles, K (game.js)
// ═══════════════════════════════════════════════
'use strict';

// ── Background ──────────────────────────────────
function drawBG() {
  const sg = ctx.createLinearGradient(0, 0, 0, H);
  sg.addColorStop(0,   '#0e2060');
  sg.addColorStop(0.6, '#1e5494');
  sg.addColorStop(1,   '#2a7a4a');
  ctx.fillStyle = sg;
  ctx.fillRect(0, 0, W, H);

  // Sun
  ctx.save();
  ctx.translate(W * 0.78, H * 0.15);
  const sun = ctx.createRadialGradient(0, 0, 0, 0, 0, 55);
  sun.addColorStop(0,    '#fff9d0');
  sun.addColorStop(0.35, '#ffd05099');
  sun.addColorStop(1,    'transparent');
  ctx.fillStyle = sun;
  ctx.beginPath(); ctx.arc(0, 0, 55, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // Parallax hills
  const px = (camX * 0.08) % (W * 2);
  ctx.fillStyle = 'rgba(15,40,100,0.38)';
  for (let m = -1; m < 5; m++) {
    const bx = m * 200 - (px % 200);
    const bh = 80 + Math.sin(bx * 0.02 + 1) * 45;
    ctx.beginPath();
    ctx.moveTo(bx,       H * 0.62);
    ctx.lineTo(bx + 100, H * 0.62 - bh);
    ctx.lineTo(bx + 200, H * 0.62);
    ctx.fill();
  }

  // Clouds
  const cpx = (camX * 0.05) % (W + 300);
  ctx.fillStyle = 'rgba(255,255,255,0.11)';
  [60, 220, 400, 580, 780, 960].forEach(cx2 => {
    const sx = ((cx2 - cpx) % (W + 400) + W + 400) % (W + 400) - 80;
    const sy = 35 + (cx2 % 50);
    ctx.beginPath(); ctx.ellipse(sx,      sy,      68, 20, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(sx + 26, sy - 12, 44, 15, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(sx - 20, sy - 8,  36, 13, 0, 0, Math.PI * 2); ctx.fill();
  });
}

// ── Terrain ─────────────────────────────────────
function drawTerrain() {
  if (terrain.length < 2) return;

  let si = 0;
  while (si < terrain.length - 2 && terrain[si + 1].x < camX - 60) si++;

  ctx.beginPath();
  ctx.moveTo(terrain[si].x - camX, terrain[si].y);
  for (let i = si + 1; i < terrain.length; i++) {
    ctx.lineTo(terrain[i].x - camX, terrain[i].y);
    if (terrain[i].x - camX > W + 60) break;
  }
  ctx.lineTo(W + 60, H + 10);
  ctx.lineTo(terrain[si].x - camX, H + 10);
  ctx.closePath();

  const tg = ctx.createLinearGradient(0, H * 0.25, 0, H);
  tg.addColorStop(0,    '#4caa3a');
  tg.addColorStop(0.06, '#60c045');
  tg.addColorStop(0.22, '#9c7018');
  tg.addColorStop(0.55, '#6e4a10');
  tg.addColorStop(1,    '#3c2408');
  ctx.fillStyle = tg;
  ctx.fill();

  // Green surface line
  ctx.beginPath();
  ctx.moveTo(terrain[si].x - camX, terrain[si].y);
  for (let i = si + 1; i < terrain.length; i++) {
    ctx.lineTo(terrain[i].x - camX, terrain[i].y);
    if (terrain[i].x - camX > W + 60) break;
  }
  ctx.strokeStyle = '#80de4a'; ctx.lineWidth = 4; ctx.lineJoin = 'round'; ctx.stroke();

  // Grass tufts
  ctx.strokeStyle = '#94ea60'; ctx.lineWidth = 1.8;
  for (let i = si; i < terrain.length - 1; i++) {
    const px = terrain[i].x - camX;
    if (px < -10 || px > W + 10) continue;
    if (i % 2 !== 0) continue;
    const py  = terrain[i].y;
    const ang = Math.atan2(terrain[i + 1].y - terrain[i].y, terrain[i + 1].x - terrain[i].x);
    ctx.save(); ctx.translate(px, py); ctx.rotate(ang);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-3, -8);  ctx.stroke();
    ctx.beginPath(); ctx.moveTo(4, 0); ctx.lineTo( 3, -9);  ctx.stroke();
    ctx.beginPath(); ctx.moveTo(9, 0); ctx.lineTo(11, -7);  ctx.stroke();
    ctx.restore();
  }
}

// ── Wheel ────────────────────────────────────────
function drawWheel(cx2, cy2, spin) {
  ctx.save();
  ctx.translate(cx2, cy2);

  // Drop shadow
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath(); ctx.ellipse(3, 5, WHEEL_R, WHEEL_R * 0.55, 0, 0, Math.PI * 2); ctx.fill();

  ctx.rotate(spin);

  // Outer tyre
  ctx.beginPath(); ctx.arc(0, 0, WHEEL_R, 0, Math.PI * 2);
  ctx.fillStyle = '#222'; ctx.fill();
  ctx.strokeStyle = '#3a3a3a'; ctx.lineWidth = 5; ctx.stroke();

  // Tread bumps
  ctx.fillStyle = '#111';
  for (let t = 0; t < 12; t++) {
    const a = (t / 12) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * (WHEEL_R - 2), Math.sin(a) * (WHEEL_R - 2), 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Rim
  ctx.beginPath(); ctx.arc(0, 0, WHEEL_R * 0.60, 0, Math.PI * 2);
  const rg = ctx.createRadialGradient(-6, -6, 1, 0, 0, WHEEL_R * 0.60);
  rg.addColorStop(0,   '#e8e8e8');
  rg.addColorStop(0.6, '#b0b0b0');
  rg.addColorStop(1,   '#888');
  ctx.fillStyle = rg; ctx.fill();
  ctx.strokeStyle = '#666'; ctx.lineWidth = 2; ctx.stroke();

  // Spokes
  for (let s = 0; s < 5; s++) {
    const a = (s / 5) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 5,              Math.sin(a) * 5);
    ctx.lineTo(Math.cos(a) * WHEEL_R * 0.56, Math.sin(a) * WHEEL_R * 0.56);
    ctx.strokeStyle = '#999'; ctx.lineWidth = 4; ctx.stroke();
    ctx.strokeStyle = '#ccc'; ctx.lineWidth = 2; ctx.stroke();
  }

  // Hub
  ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI * 2);
  ctx.fillStyle = '#bbb'; ctx.fill();
  ctx.strokeStyle = '#888'; ctx.lineWidth = 1.5; ctx.stroke();

  ctx.restore();
}

// ── Car body (HCR red open-top jeep) ────────────
function drawCar() {
  const midX  = (car.wx[0] + car.wx[1]) / 2 - camX;
  const midY  = car.smoothY;       // smoothed — no wheel-bounce jitter
  const angle = car.smoothAngle;   // smoothed body angle

  // Wheels behind body
  drawWheel(car.wx[0] - camX, car.wy[0], car.spin);
  drawWheel(car.wx[1] - camX, car.wy[1], car.spin);

  // Exhaust smoke
  if (K.gas && car.fuel > 0 && Math.random() > 0.45) {
    const ex = midX + camX + Math.cos(angle) * -58 - Math.sin(angle) * 5;
    const ey = midY         + Math.sin(angle) * -58 + Math.cos(angle) * 5;
    addParticles(ex, ey, car.vx * 0.15 - 40, -15, 1, '#aaaaaa', 6);
  }
  // Wheel dust
  for (let i = 0; i < 2; i++) {
    if (!car.airborne[i] && Math.abs(car.vx) > 100 && Math.random() > 0.55)
      addParticles(car.wx[i], car.wy[i] + WHEEL_R - 2, -car.vx * 0.1, -20, 2, '#c8b080', 3);
  }

  ctx.save();
  ctx.translate(midX, midY);
  ctx.rotate(angle);

  // === Chassis / undercarriage ===
  ctx.fillStyle = '#7a3a10';
  ctx.beginPath();
  ctx.moveTo(-56, 8); ctx.lineTo(-56, 18); ctx.lineTo(56, 18); ctx.lineTo(56, 8);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#4a2008'; ctx.lineWidth = 1.5; ctx.stroke();

  // === Main red body ===
  ctx.beginPath();
  ctx.moveTo(-56, 8);
  ctx.lineTo(-56, -8);
  ctx.quadraticCurveTo(-56, -22, -44, -22);
  ctx.lineTo(-18, -22);
  ctx.lineTo(-18, -34);
  ctx.lineTo( 10, -34);
  ctx.lineTo( 10, -22);
  ctx.lineTo( 38, -22);
  ctx.quadraticCurveTo(56, -22, 56, -8);
  ctx.lineTo( 56, 8);
  ctx.closePath();

  const bodyG = ctx.createLinearGradient(0, -34, 0, 18);
  bodyG.addColorStop(0,   '#ff4a4a');
  bodyG.addColorStop(0.3, '#e02020');
  bodyG.addColorStop(0.7, '#c01010');
  bodyG.addColorStop(1,   '#901010');
  ctx.fillStyle = bodyG; ctx.fill();
  ctx.strokeStyle = '#6a0000'; ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.stroke();

  // Shine strip
  ctx.fillStyle = 'rgba(255,150,150,0.35)';
  ctx.beginPath();
  ctx.moveTo(-44, -22); ctx.lineTo(-44, -16);
  ctx.lineTo( 38, -16); ctx.lineTo( 38, -22);
  ctx.closePath(); ctx.fill();

  // === Windshield ===
  ctx.fillStyle = 'rgba(180,230,255,0.75)';
  ctx.beginPath();
  ctx.moveTo(10, -34); ctx.lineTo(24, -48); ctx.lineTo(36, -48); ctx.lineTo(38, -34);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#5599bb'; ctx.lineWidth = 1.5; ctx.stroke();

  // === Bonnet ===
  ctx.fillStyle = '#e02020';
  ctx.beginPath();
  ctx.moveTo(38, -22); ctx.quadraticCurveTo(48, -22, 56, -14); ctx.lineTo(56, -8); ctx.lineTo(38, -8);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#6a0000'; ctx.lineWidth = 1.5; ctx.stroke();

  // Headlight
  ctx.fillStyle = '#fffce0';
  ctx.beginPath(); ctx.arc(54, -2, 6, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#aaa820'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.beginPath(); ctx.arc(52, -4, 2, 0, Math.PI * 2); ctx.fill();

  // Tail light (glows red when braking)
  ctx.fillStyle = K.brake ? '#ff1800' : '#880000';
  ctx.beginPath(); ctx.arc(-54, -4, 4, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#440000'; ctx.lineWidth = 1; ctx.stroke();

  // Exhaust pipe
  ctx.fillStyle = '#555';
  ctx.beginPath(); ctx.roundRect(-62, 2, 14, 7, 3); ctx.fill();
  ctx.strokeStyle = '#222'; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = '#111';
  ctx.beginPath(); ctx.arc(-56, 5.5, 2.5, 0, Math.PI * 2); ctx.fill();

  // Seat interior
  ctx.fillStyle = '#5a1a08'; ctx.fillRect(-44, -22, 26, 10);
  ctx.fillStyle = '#8a3010';
  ctx.beginPath(); ctx.roundRect(-42, -18, 20, 8, 3); ctx.fill();

  // Antenna
  ctx.strokeStyle = '#333'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(-30, -34); ctx.lineTo(-34, -62); ctx.stroke();
  ctx.fillStyle = '#555';
  ctx.beginPath(); ctx.arc(-34, -63, 2.5, 0, Math.PI * 2); ctx.fill();

  // === Driver ===
  // Arms
  ctx.strokeStyle = '#d4a070'; ctx.lineWidth = 4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-8, -32); ctx.quadraticCurveTo(0, -26, 8, -28); ctx.stroke();
  ctx.lineCap = 'butt';
  // Torso
  ctx.fillStyle = '#d4a070';
  ctx.beginPath(); ctx.ellipse(-22, -30, 9, 11, 0.1, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#a07040'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = '#cc6622';
  ctx.beginPath(); ctx.ellipse(-22, -26, 8, 7, 0.1, 0, Math.PI * 2); ctx.fill();
  // Head
  ctx.fillStyle = '#e8b880';
  ctx.beginPath(); ctx.arc(-22, -42, 10, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#b07840'; ctx.lineWidth = 1.5; ctx.stroke();
  // Eyes
  ctx.fillStyle = '#333';
  ctx.beginPath(); ctx.arc(-18, -43, 2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(-26, -43, 2, 0, Math.PI * 2); ctx.fill();
  // Nose
  ctx.fillStyle = '#c08050';
  ctx.beginPath(); ctx.ellipse(-22, -40, 2, 1.5, 0, 0, Math.PI * 2); ctx.fill();
  // Smile
  ctx.strokeStyle = '#a06030'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(-22, -40, 4, 0.2, Math.PI - 0.2); ctx.stroke();
  // Pink hat — brim
  ctx.fillStyle = '#e87090';
  ctx.beginPath(); ctx.ellipse(-22, -51, 14, 4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#c04060'; ctx.lineWidth = 1.5; ctx.stroke();
  // Pink hat — dome
  ctx.fillStyle = '#e87090';
  ctx.beginPath(); ctx.arc(-22, -55, 10, Math.PI, 0); ctx.fill();
  ctx.strokeStyle = '#c04060'; ctx.lineWidth = 1.5; ctx.stroke();
  // Hat highlight
  ctx.fillStyle = 'rgba(255,200,210,0.45)';
  ctx.beginPath(); ctx.arc(-26, -57, 4, 0, Math.PI * 2); ctx.fill();

  ctx.restore();
}

// ── Coins ────────────────────────────────────────
function drawCoins(t) {
  for (const coin of coins) {
    if (coin.collected) continue;
    const sx = coin.x - camX;
    if (sx < -20 || sx > W + 20) continue;
    const sy  = coin.y + Math.sin(t * 3 + coin.bob) * 6;
    const scx = Math.abs(Math.cos(t * 3.5 + coin.bob)) * 0.5 + 0.5;
    ctx.save();
    ctx.translate(sx, sy); ctx.scale(scx, 1);
    ctx.beginPath(); ctx.arc(0, 0, 13, 0, Math.PI * 2);
    const cg = ctx.createRadialGradient(-4, -4, 1, 0, 0, 13);
    cg.addColorStop(0,   '#fffac0');
    cg.addColorStop(0.5, '#f5c030');
    cg.addColorStop(1,   '#b08010');
    ctx.fillStyle = cg; ctx.fill();
    ctx.strokeStyle = '#907010'; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = '#705008';
    ctx.font = 'bold 11px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('$', 0, 0.5);
    ctx.restore();
  }
}

// ── Fuel cans ────────────────────────────────────
function drawFuelCans() {
  for (const f of fuelCans) {
    if (f.collected) continue;
    const sx = f.x - camX;
    if (sx < -30 || sx > W + 30) continue;
    ctx.save(); ctx.translate(sx, f.y);
    ctx.fillStyle = '#c0392b';
    ctx.beginPath(); ctx.roundRect(-13, -22, 26, 34, 4); ctx.fill();
    ctx.strokeStyle = '#7b0d07'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fillRect(-9, -18, 8, 18);
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath(); ctx.roundRect(7, -28, 10, 12, 2); ctx.fill();
    ctx.strokeStyle = '#7b0d07'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = '#f39c12';
    ctx.beginPath(); ctx.roundRect(8, -31, 8, 5, 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 9px Arial';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('FUEL', 0, 4);
    ctx.restore();
  }
}

// ── Particles ────────────────────────────────────
function drawParticles() {
  for (const p of particles) {
    const a = Math.max(0, p.life / p.ml);
    ctx.globalAlpha = a * 0.85;
    ctx.fillStyle   = p.col;
    ctx.beginPath(); ctx.arc(p.x - camX, p.y, p.r * a, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// ── Speedometer ──────────────────────────────────
function drawSpeedometer(speed) {
  const kmh = Math.round(speed / 6);
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.beginPath(); ctx.roundRect(W / 2 - 50, H - 38, 100, 30, 15); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 15px Arial';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(kmh + ' km/h', W / 2, H - 23);
}
