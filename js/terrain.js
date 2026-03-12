// ═══════════════════════════════════════════════
//  TERRAIN
//  Depends on globals: W, H  (set in game.js)
// ═══════════════════════════════════════════════
'use strict';

let terrain = [];
let tSeed   = 1;

function noise(s) {
  const x = Math.sin(s * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

// Build `count` terrain points starting at (fromX, fromY)
function buildTerrain(fromX, fromY, count) {
  let x = fromX, y = fromY, vel = 0;
  const pts = [];
  for (let i = 0; i < count; i++) {
    pts.push({ x, y });
    tSeed++;
    vel += (noise(tSeed) - 0.5) * 70;
    vel *= 0.75;
    x   += 55 + noise(tSeed + 0.3) * 35;
    y   += vel;
    y    = Math.max(H * 0.20, Math.min(H * 0.80, y));
  }
  return pts;
}

// Linear interpolation: get terrain Y at world-X position
function getY(wx) {
  for (let i = 0; i < terrain.length - 1; i++) {
    const a = terrain[i], b = terrain[i + 1];
    if (wx >= a.x && wx <= b.x) {
      const t = (wx - a.x) / (b.x - a.x);
      return a.y + (b.y - a.y) * t;
    }
  }
  // Extrapolate off the right end
  if (terrain.length >= 2) {
    const a = terrain[terrain.length - 2];
    const b = terrain[terrain.length - 1];
    if (wx > b.x) {
      const t = (wx - a.x) / (b.x - a.x);
      return Math.min(H * 0.80, a.y + (b.y - a.y) * t);
    }
  }
  return H * 0.6;
}
