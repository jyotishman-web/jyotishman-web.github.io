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

// ── Wheel — HCR crosshair rim ────────────────────
function drawWheel(cx2, cy2, spin) {
  const R = WHEEL_R;
  ctx.save();
  ctx.translate(cx2, cy2);

  // Tyre shadow
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath(); ctx.ellipse(4, 6, R + 2, R * 0.5, 0, 0, Math.PI * 2); ctx.fill();

  // ── Outer tyre (thick black rubber) ──
  ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2);
  ctx.fillStyle = '#1a1a1a'; ctx.fill();
  ctx.strokeStyle = '#000'; ctx.lineWidth = 3.5; ctx.stroke();

  // Tyre sidewall highlight ring
  ctx.beginPath(); ctx.arc(0, 0, R - 3, 0, Math.PI * 2);
  ctx.strokeStyle = '#333'; ctx.lineWidth = 2; ctx.stroke();

  // ── Inner rim (grey) ──
  const rimR = R * 0.64;
  ctx.beginPath(); ctx.arc(0, 0, rimR, 0, Math.PI * 2);
  ctx.fillStyle = '#c0c0c0'; ctx.fill();
  ctx.strokeStyle = '#555'; ctx.lineWidth = 2.5; ctx.stroke();

  // ── Crosshair pattern (rotates with wheel) ──
  ctx.save();
  ctx.rotate(spin);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';

  // Vertical bar
  ctx.beginPath();
  ctx.moveTo(0, -rimR + 4); ctx.lineTo(0, rimR - 4);
  ctx.stroke();
  // Horizontal bar
  ctx.beginPath();
  ctx.moveTo(-rimR + 4, 0); ctx.lineTo(rimR - 4, 0);
  ctx.stroke();

  // 4 corner dots (like the HCR crosshair detail)
  ctx.fillStyle = '#ffffff';
  const d = rimR * 0.52;
  [[-d,-d],[d,-d],[d,d],[-d,d]].forEach(([x,y]) => {
    ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI*2); ctx.fill();
  });

  // Outer crosshair circle
  ctx.beginPath(); ctx.arc(0, 0, rimR - 4, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.lineWidth = 1.5; ctx.stroke();

  ctx.restore(); // undo spin

  // ── Centre hub ──
  ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2);
  ctx.fillStyle = '#888'; ctx.fill();
  ctx.strokeStyle = '#333'; ctx.lineWidth = 1.5; ctx.stroke();

  // Rim border (black outline)
  ctx.beginPath(); ctx.arc(0, 0, rimR, 0, Math.PI * 2);
  ctx.strokeStyle = '#333'; ctx.lineWidth = 2; ctx.stroke();

  ctx.restore();
}

// ── Car body — HCR jeep with closed curved cab + open rear cockpit ──
function drawCar() {
  const midX  = (car.wx[0] + car.wx[1]) / 2 - camX;
  const midY  = car.smoothY;
  const angle = car.smoothAngle;

  // Wheels behind body
  drawWheel(car.wx[0] - camX, car.wy[0], car.spin);
  drawWheel(car.wx[1] - camX, car.wy[1], car.spin);

  // Exhaust smoke from rear underside
  if (K.gas && car.fuel > 0 && Math.random() > 0.45) {
    const ex = midX + camX + Math.cos(angle) * -60;
    const ey = midY         + Math.sin(angle) * -60 + 8;
    addParticles(ex, ey, car.vx * 0.12 - 50, -12, 1, '#bbbbaa', 6);
  }
  // Rear wheel dust
  for (let i = 0; i < 2; i++) {
    if (!car.airborne[i] && Math.abs(car.vx) > 100 && Math.random() > 0.55)
      addParticles(car.wx[i], car.wy[i] + WHEEL_R - 2, -car.vx * 0.1, -18, 2, '#c8b080', 3);
  }

  ctx.save();
  ctx.translate(midX, midY);
  ctx.rotate(angle);

  // ── CHASSIS / undercarriage ──
  // Main floor beam
  ctx.fillStyle = '#6a0000';
  ctx.beginPath();
  ctx.moveTo(-58, 6); ctx.lineTo(-58, 14);
  ctx.lineTo( 58, 14); ctx.lineTo(58, 6);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#3a0000'; ctx.lineWidth = 1.5; ctx.stroke();

  // ── OPEN REAR COCKPIT (left / rear section) ──
  // Floor and side wall of open section
  ctx.fillStyle = '#c01010';
  ctx.beginPath();
  ctx.moveTo(-58, 6);     // bottom rear
  ctx.lineTo(-58, -20);   // up rear wall
  ctx.lineTo(-12, -20);   // across to rear pillar base
  ctx.lineTo(-12, 6);     // down pillar to floor
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#000'; ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.stroke();

  // Seat lip (separates cockpit from chassis)
  ctx.fillStyle = '#8a0808';
  ctx.beginPath(); ctx.roundRect(-50, -22, 36, 5, 2); ctx.fill();

  // ── CLOSED CAB (right / front section) ──
  // Cab body box
  ctx.beginPath();
  ctx.moveTo(-12, 6);
  ctx.lineTo(-12, -20);
  ctx.lineTo( 50, -20);
  ctx.quadraticCurveTo(58, -20, 58, -12);
  ctx.lineTo( 58, 6);
  ctx.closePath();
  const cabG = ctx.createLinearGradient(0, -20, 0, 14);
  cabG.addColorStop(0,   '#ff3a3a');
  cabG.addColorStop(0.4, '#e01818');
  cabG.addColorStop(1,   '#9a0a0a');
  ctx.fillStyle = cabG; ctx.fill();
  ctx.strokeStyle = '#000'; ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.stroke();

  // ── CURVED ROOF (the signature HCR swept shape) ──
  ctx.beginPath();
  ctx.moveTo(-12, -20);         // rear pillar top
  // Sweep up and over: rear of roof dips back slightly past pillar (the hook)
  ctx.bezierCurveTo(
    -20, -52,  // ctrl1 — pulls the rear of roof backward and up (the curl)
     10, -62,  // ctrl2 — roof peak
     38, -55   // windshield top
  );
  ctx.lineTo(50, -38);          // front A-pillar top → windshield bottom-front
  ctx.lineTo(50, -20);          // down front A-pillar
  ctx.lineTo(-12, -20);         // back along cab top
  ctx.closePath();

  const roofG = ctx.createLinearGradient(0, -62, 0, -20);
  roofG.addColorStop(0,   '#ff5050');
  roofG.addColorStop(0.5, '#e01818');
  roofG.addColorStop(1,   '#c01010');
  ctx.fillStyle = roofG; ctx.fill();
  ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.stroke();

  // Roof highlight (shine strip along top)
  ctx.save();
  ctx.clip(); // clip to roof shape — redraw path for clip
  ctx.beginPath();
  ctx.moveTo(-12, -20);
  ctx.bezierCurveTo(-20,-52, 10,-62, 38,-55);
  ctx.lineTo(50,-38); ctx.lineTo(50,-20); ctx.lineTo(-12,-20);
  ctx.closePath();
  ctx.fillStyle = 'rgba(255,160,160,0.28)';
  ctx.fillRect(-22, -64, 70, 22);
  ctx.restore();

  // ── WINDSHIELD ──
  ctx.beginPath();
  ctx.moveTo(38, -55);   // roof front
  ctx.lineTo(50, -38);   // top-right (A-pillar)
  ctx.lineTo(50, -20);   // bottom-right
  ctx.lineTo(35, -20);   // bottom-left
  ctx.closePath();
  ctx.fillStyle = 'rgba(160,225,255,0.72)';
  ctx.fill();
  ctx.strokeStyle = '#005588'; ctx.lineWidth = 1.5; ctx.stroke();

  // Windshield glare
  ctx.fillStyle = 'rgba(255,255,255,0.30)';
  ctx.beginPath();
  ctx.moveTo(40, -52); ctx.lineTo(48, -40); ctx.lineTo(44, -40); ctx.lineTo(37, -52);
  ctx.closePath(); ctx.fill();

  // ── BONNET / HOOD (slopes down at front) ──
  ctx.beginPath();
  ctx.moveTo(50, -20);
  ctx.quadraticCurveTo(56, -20, 58, -12);
  ctx.lineTo(58,  6);
  ctx.lineTo(50,  6);
  ctx.lineTo(50, -20);
  ctx.closePath();
  ctx.fillStyle = '#d01010'; ctx.fill();
  ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.stroke();

  // ── HEADLIGHT ──
  ctx.fillStyle = '#fffce8';
  ctx.beginPath(); ctx.arc(57, -6, 5, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#998800'; ctx.lineWidth = 1.5; ctx.stroke();
  // Glint
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath(); ctx.arc(55, -8, 1.8, 0, Math.PI * 2); ctx.fill();

  // ── TAIL LIGHT ──
  ctx.fillStyle = K.brake ? '#ff1500' : '#770000';
  ctx.beginPath(); ctx.arc(-57, -8, 4, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#330000'; ctx.lineWidth = 1; ctx.stroke();

  // ── EXHAUST PIPE ──
  ctx.fillStyle = '#555';
  ctx.beginPath(); ctx.roundRect(-64, 2, 14, 7, 3); ctx.fill();
  ctx.strokeStyle = '#111'; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = '#111';
  ctx.beginPath(); ctx.arc(-58, 5.5, 2.5, 0, Math.PI * 2); ctx.fill();

  // ── DOOR LINE on cab ──
  ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.roundRect(0, -18, 28, 22, 3); ctx.stroke();
  // Door handle
  ctx.strokeStyle = '#888'; ctx.lineWidth = 2; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(18, -8); ctx.lineTo(26, -8); ctx.stroke();
  ctx.lineCap = 'butt';

  // ── ROLL BAR (behind the roof, above open cockpit) ──
  ctx.strokeStyle = '#111'; ctx.lineWidth = 4; ctx.lineCap = 'round';
  // Left post
  ctx.beginPath(); ctx.moveTo(-12, -20); ctx.lineTo(-12, -38); ctx.stroke();
  // Right post (rear pillar of cab)
  ctx.beginPath(); ctx.moveTo(-4, -20); ctx.lineTo(-4, -38); ctx.stroke();
  // Top bar
  ctx.beginPath(); ctx.moveTo(-13, -38); ctx.lineTo(-3, -38); ctx.stroke();
  ctx.lineCap = 'butt';

  // ── ANTENNA (thin wire from left rear) ──
  ctx.strokeStyle = '#111'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-52, -20); ctx.lineTo(-60, -56); ctx.stroke();
  ctx.fillStyle = '#333';
  ctx.beginPath(); ctx.arc(-60, -57, 2.5, 0, Math.PI * 2); ctx.fill();

  // ══════════════════════════════
  //  DRIVER — large cartoon HCR style, sitting in open rear cockpit
  // ══════════════════════════════
  // Body / torso — pink shirt, visible above seat
  ctx.fillStyle = '#d4526a';
  ctx.beginPath(); ctx.ellipse(-34, -22, 12, 10, -0.1, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#8a1a30'; ctx.lineWidth = 1.5; ctx.stroke();

  // Neck
  ctx.fillStyle = '#d8a878';
  ctx.beginPath(); ctx.ellipse(-34, -30, 5, 5, 0, 0, Math.PI * 2); ctx.fill();

  // ── BIG CARTOON HEAD ──
  ctx.fillStyle = '#dba878';
  ctx.beginPath(); ctx.arc(-34, -44, 16, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#8a5020'; ctx.lineWidth = 2; ctx.stroke();

  // Ear
  ctx.fillStyle = '#c89060';
  ctx.beginPath(); ctx.arc(-20, -43, 6, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#8a5020'; ctx.lineWidth = 1.5; ctx.stroke();
  // Ear inner
  ctx.fillStyle = '#b07850';
  ctx.beginPath(); ctx.arc(-21, -43, 3, 0, Math.PI * 2); ctx.fill();

  // ── SHAGGY BROWN HAIR ──
  ctx.fillStyle = '#5a3010';
  // Hair tufts sticking out (messy HCR style)
  const hairTufts = [
    [-44,-52, 7], [-38,-58, 8], [-28,-58, 7], [-20,-56, 6],
    [-48,-46, 5], [-46,-42, 4]
  ];
  hairTufts.forEach(([hx, hy, hr]) => {
    ctx.beginPath(); ctx.arc(hx, hy, hr, 0, Math.PI * 2); ctx.fill();
  });
  // Main hair mass on top/back of head
  ctx.beginPath();
  ctx.moveTo(-50, -44);
  ctx.bezierCurveTo(-54, -58, -42, -66, -28, -62);
  ctx.bezierCurveTo(-20, -60, -18, -54, -22, -50);
  ctx.bezierCurveTo(-30, -52, -44, -52, -50, -44);
  ctx.fill();
  ctx.strokeStyle = '#3a1a00'; ctx.lineWidth = 1; ctx.stroke();

  // Hair detail lines
  ctx.strokeStyle = '#3a1a00'; ctx.lineWidth = 1.2;
  [[-46,-54],[-40,-60],[-32,-62],[-24,-58]].forEach(([hx,hy]) => {
    ctx.beginPath();
    ctx.moveTo(hx, hy); ctx.lineTo(hx+3, hy+6); ctx.stroke();
  });

  // ── PINK BACKWARDS CAP ──
  // Brim (goes forward/right since cap is worn backwards = brim faces left/rear)
  ctx.fillStyle = '#e06080';
  ctx.beginPath(); ctx.ellipse(-46, -55, 10, 3.5, -0.3, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#a02040'; ctx.lineWidth = 1.5; ctx.stroke();
  // Cap dome
  ctx.beginPath();
  ctx.moveTo(-50, -54);
  ctx.bezierCurveTo(-52, -66, -38, -68, -32, -60);
  ctx.bezierCurveTo(-30, -56, -34, -54, -38, -54);
  ctx.bezierCurveTo(-44, -54, -50, -54, -50, -54);
  ctx.closePath();
  ctx.fillStyle = '#e87090'; ctx.fill();
  ctx.strokeStyle = '#a02040'; ctx.lineWidth = 1.5; ctx.stroke();
  // Cap button on top
  ctx.fillStyle = '#c04060';
  ctx.beginPath(); ctx.arc(-40, -64, 2.5, 0, Math.PI * 2); ctx.fill();

  // ── SUNGLASSES ──
  ctx.fillStyle = 'rgba(20,20,60,0.85)';
  // Left lens
  ctx.beginPath(); ctx.ellipse(-28, -44, 7, 5, 0.1, 0, Math.PI * 2); ctx.fill();
  // Right lens (partially behind hair)
  ctx.beginPath(); ctx.ellipse(-40, -45, 6, 4.5, 0.1, 0, Math.PI * 2); ctx.fill();
  // Bridge
  ctx.strokeStyle = '#111'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-34, -44); ctx.lineTo(-33, -44); ctx.stroke();
  // Frames
  ctx.strokeStyle = '#111'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.ellipse(-28, -44, 7, 5, 0.1, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(-40, -45, 6, 4.5, 0.1, 0, Math.PI * 2); ctx.stroke();
  // Arm (glasses arm going to ear)
  ctx.beginPath(); ctx.moveTo(-21, -43); ctx.lineTo(-16, -41); ctx.stroke();

  // ── NOSE (big round cartoon) ──
  ctx.fillStyle = '#c07040';
  ctx.beginPath(); ctx.arc(-24, -38, 5, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#995020'; ctx.lineWidth = 1; ctx.stroke();
  // Nose highlight
  ctx.fillStyle = 'rgba(255,200,150,0.5)';
  ctx.beginPath(); ctx.arc(-26, -40, 2, 0, Math.PI * 2); ctx.fill();

  // ── STUBBLE / BEARD ──
  ctx.fillStyle = '#8a6040';
  const stubbleDots = [
    [-28,-33],[-25,-32],[-22,-31],[-30,-34],[-33,-33],
    [-27,-35],[-24,-34],[-21,-33],[-32,-35],[-29,-36]
  ];
  stubbleDots.forEach(([sx,sy]) => {
    ctx.beginPath(); ctx.arc(sx, sy, 1.2, 0, Math.PI * 2); ctx.fill();
  });

  // ── MOUTH (slight smirk) ──
  ctx.strokeStyle = '#7a4020'; ctx.lineWidth = 1.8; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(-28, -34, 5, 0.3, Math.PI - 0.6); ctx.stroke();
  ctx.lineCap = 'butt';

  // ── ARMS (gripping something behind the cab) ──
  ctx.strokeStyle = '#d4906a'; ctx.lineWidth = 5; ctx.lineCap = 'round';
  // Left arm reaching to roll bar
  ctx.beginPath();
  ctx.moveTo(-32, -28);
  ctx.quadraticCurveTo(-20, -22, -12, -30);
  ctx.stroke();
  // Right arm
  ctx.beginPath();
  ctx.moveTo(-36, -26);
  ctx.quadraticCurveTo(-26, -18, -18, -24);
  ctx.stroke();
  // Hands
  ctx.fillStyle = '#d4906a';
  ctx.beginPath(); ctx.arc(-12, -30, 5, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(-18, -24, 4.5, 0, Math.PI*2); ctx.fill();
  ctx.lineCap = 'butt';

  ctx.restore();
}

