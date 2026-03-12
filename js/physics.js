// ═══════════════════════════════════════════════
//  CAR PHYSICS
//  Depends on globals: terrain/getY (terrain.js),
//    audio functions (audio.js), K/W/H (game.js)
// ═══════════════════════════════════════════════
'use strict';

// ── Constants ──────────────────────────────────
const AXLE_DIST    = 90;    // px between wheel centres
const WHEEL_R      = 24;    // wheel radius px
const GRAVITY      = 980;   // px/s²
const MAX_SPEED    = 380;   // jeep top speed px/s
const MAX_RPM      = 2200;
const IDLE_RPM     = 600;
const RPM_RISE     = 1400;  // RPM/s on gas (heavy engine, slow rise)
const RPM_FALL     = 900;   // RPM/s off gas
const BRAKE_FORCE  = 320;   // px/s² braking decel
const GROUND_BOUNCE = 0.18; // fraction of vertical vel that bounces back

let car = null;
let rpm = 0;

// ── Factory ────────────────────────────────────
function makeCar(x, y) {
  return {
    // Wheel world positions
    wx: [x - AXLE_DIST / 2, x + AXLE_DIST / 2],
    wy: [y, y],
    // Velocities
    vx: 0,
    wvy: [0, 0],             // per-wheel vertical velocity
    // Body orientation (smoothed — never the raw wheel midpoint)
    lean:        0,          // weight-transfer lean offset (radians)
    smoothAngle: 0,          // final rendered body angle (smoothed)
    smoothY:     y,          // final rendered body centre Y (smoothed)
    // Visuals
    spin: 0,                 // wheel rotation angle
    // Game state
    fuel: 100,
    coins: 0,
    dead: false,
    deadTimer: 0,
    airborne:    [false, false],
    wasAirborne: [false, false],
    scrTimer: 0,             // tyre-screech cooldown
  };
}

// ── Update (call every frame) ───────────────────
function updateCar(dt) {
  if (car.dead) { car.deadTimer += dt; return; }

  const gasOn   = K.gas   && car.fuel > 0;
  const brakeOn = K.brake;

  // ── Fuel consumption ──
  if (gasOn)   car.fuel = Math.max(0, car.fuel - 4.5 * dt);
  if (brakeOn) car.fuel = Math.max(0, car.fuel - 1.2 * dt);

  // ── RPM (jeep engine: slow to rev, slow to drop) ──
  rpm = gasOn
    ? Math.min(MAX_RPM, rpm + RPM_RISE * dt)
    : Math.max(IDLE_RPM, rpm - RPM_FALL * dt);
  updateEngineSound(rpm, gasOn, brakeOn);

  // ── Terrain slope at car centre ──
  const carCX = (car.wx[0] + car.wx[1]) / 2;
  let slope = 0;
  for (let i = 0; i < terrain.length - 1; i++) {
    const a = terrain[i], b = terrain[i + 1];
    if (carCX >= a.x && carCX <= b.x) {
      slope = Math.atan2(b.y - a.y, b.x - a.x);
      break;
    }
  }

  const onGround = !car.airborne[0] || !car.airborne[1];

  // ── Horizontal drive ──
  if (onGround) {
    if (gasOn) {
      // Torque curve: strong low-end pull that tapers off near top speed
      const speedRatio  = Math.abs(car.vx) / MAX_SPEED;
      const torqueCurve = 1.0 - speedRatio * 0.75;
      // Slope penalty: harder uphill, roll down when idle on downhill
      const slopePenalty = Math.max(0.25, 1 - Math.sin(slope) * 2.2);
      const accel = 280 * torqueCurve * slopePenalty;
      car.vx = Math.min(MAX_SPEED, car.vx + accel * dt);

    } else if (brakeOn) {
      if (car.vx > 0) {
        // Braking forward — can squeal
        car.vx = Math.max(0, car.vx - BRAKE_FORCE * dt);
        if (car.vx > 60) {
          car.scrTimer -= dt;
          if (car.scrTimer <= 0) { playSound('screech'); car.scrTimer = 0.25; }
        }
      } else {
        // Reverse — jeeps back up slowly
        car.vx = Math.max(-120, car.vx - 120 * dt);
      }

    } else {
      // Rolling friction + slope gravity
      car.vx  = car.vx * Math.pow(0.82, dt * 60);
      car.vx += Math.sin(slope) * GRAVITY * 0.55 * dt;
      if (Math.abs(car.vx) < 2) car.vx = 0;
    }
  } else {
    // Air drag (minimal)
    car.vx *= Math.pow(0.998, dt * 60);
  }

  // ── Body lean (weight transfer) ──
  // Canvas coords: +angle = clockwise = nose DOWN
  // Gas → nose UP = negative lean; Brake → nose DOWN = positive lean
  if (onGround) {
    const leanTarget = gasOn ? -0.18 : brakeOn ? 0.14 : 0.0;
    car.lean += (leanTarget - car.lean) * 5.0 * dt;
  } else {
    // In air: gas rotates nose up, brake nose down for landing control
    if (gasOn)   car.lean -= 1.4 * dt;
    if (brakeOn) car.lean += 1.4 * dt;
    car.lean += (0 - car.lean) * 1.0 * dt;   // drift back to level
  }
  car.lean = Math.max(-0.38, Math.min(0.38, car.lean));

  // ── Wheel horizontal movement ──
  car.wx[0] += car.vx * dt;
  car.wx[1]  = car.wx[0] + AXLE_DIST;   // rigid axle — always fixed distance
  car.spin  += car.vx * dt / WHEEL_R;

  // ── Per-wheel vertical physics ──
  for (let i = 0; i < 2; i++) {
    car.wasAirborne[i] = car.airborne[i];

    car.wvy[i] += GRAVITY * dt;
    car.wy[i]  += car.wvy[i] * dt;

    const groundY = getY(car.wx[i]) - WHEEL_R;

    if (car.wy[i] >= groundY) {
      car.wy[i] = groundY;   // hard snap — no penetration
      if (car.wvy[i] > 0) {
        // Bounce only on real air-landings; dead-stop on normal rolling
        const bounce = car.wasAirborne[i] ? GROUND_BOUNCE : 0.0;
        car.wvy[i] *= -bounce;
        if (Math.abs(car.wvy[i]) < 20) car.wvy[i] = 0;
      }
      car.airborne[i] = false;
      if (car.wasAirborne[i] && Math.abs(car.wvy[i]) > 80) playSound('land');
    } else {
      car.airborne[i] = true;
    }
  }

  // ── Smooth body angle & Y (decoupled from raw wheel jitter) ──
  const rawAngle = Math.atan2(car.wy[1] - car.wy[0], AXLE_DIST) + car.lean;
  car.smoothAngle += (rawAngle - car.smoothAngle) * Math.min(1, 10 * dt);

  const rawMidY = (car.wy[0] + car.wy[1]) / 2;
  car.smoothY   += (rawMidY - car.smoothY) * Math.min(1, 10 * dt);

  // ── Death conditions ──
  const bodyAngle = car.smoothAngle;

  if (Math.abs(bodyAngle) > Math.PI * 0.68) {
    if (!car.dead) playSound('crash');
    car.dead = true;
    return;
  }

  // Head hits ground
  const midX  = (car.wx[0] + car.wx[1]) / 2;
  const headY = car.smoothY + Math.sin(bodyAngle) * -50 - 25;
  const hty   = getY(midX);
  if (hty !== null && headY > hty - 4) {
    if (!car.dead) playSound('crash');
    car.dead = true;
  }

  if (car.wy[0] > H + 300 || car.wy[1] > H + 300) car.dead = true;
}
