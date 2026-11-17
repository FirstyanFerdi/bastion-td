'use strict';
/* Procedural tower and enemy sprites */

/* ============================================================
   SPRITES, towers
   ============================================================ */
function drawBase(c, col, tier, branch) {
  c.fillStyle = '#0b0f12'; rr(c, -26, -26, 52, 52, 3); c.fill();
  c.fillStyle = '#1f272c'; rr(c, -24, -24, 48, 48, 2); c.fill();
  c.lineWidth = 2; c.strokeStyle = tier === 0 ? '#4a575f' : col; rr(c, -24, -24, 48, 48, 2); c.stroke();
  if (tier >= 2) { c.lineWidth = 1; c.strokeStyle = col; rr(c, -21, -21, 42, 42, 1); c.stroke(); }
  c.fillStyle = '#29333a'; rr(c, -19, -19, 38, 38, 2); c.fill();
  c.fillStyle = tier >= 1 ? col : '#66747d';
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) c.fillRect(sx * 20 - 1.5, sy * 20 - 1.5, 3, 3);
  c.fillStyle = col;
  for (let i = 0; i <= tier; i++) c.fillRect((i - tier / 2) * 7 - 2.5, 16.5, 5, 3);
  if (branch) {
    c.fillStyle = branch === 'A' ? '#38bdf8' : '#f59e0b';
    c.font = '700 8px ' + FONT; c.textAlign = 'center';
    c.fillText(branch, 0, -17);
  }
}
function drawTowerSprite(c, type, tier, o, time) {
  const col = o.branch ? TD[type].branches[o.branch].color : TD[type].color;
  const rec = o.recoil || 0, fl = o.flash || 0, a = o.angle || 0;
  c.save(); c.translate(o.x, o.y);
  const pop = o.pop || 0; if (pop > 0) { const s = 1 + pop * 0.18; c.scale(s, s); }
  drawBase(c, col, tier, o.branch);
  if (o.overchargeT > 0) glow(c, 0, 0, 32, '#38bdf8', 0.5 + 0.3 * Math.sin(time * 15));
  if (o.empT > 0) glow(c, 0, 0, 26, '#facc15', 0.4 + 0.4 * Math.sin(time * 20));
  switch (type) {
    case 'gatling': {
      c.rotate(a);
      const isOverdrive = o.branch === 'A', isFlak = o.branch === 'B';
      const n = isOverdrive ? 6 : (2 + tier), R = 5.5 + tier * 0.8, len = 19 + tier * 3 - rec * 5;
      c.fillStyle = '#24304f'; rr(c, -10, -8, 11, 16, 3); c.fill();
      const heat = o.heat || 0;
      for (let i = 0; i < n; i++) {
        const ang = o.spin + i * TAU / n, y = Math.sin(ang) * R, z = Math.cos(ang), g = Math.round(112 + z * 48);
        c.fillStyle = isOverdrive && heat > 0.2 ? 'rgb(' + Math.round(180 + heat * 75) + ',' + Math.round(80 * (1 - heat)) + ',40)' : 'rgb(' + g + ',' + (g + 24) + ',' + (g + 46) + ')';
        c.fillRect(3, y - 2, len, isFlak ? 5 : 4);
        c.fillStyle = col; c.fillRect(3 + len - 3, y - 2, 3, isFlak ? 5 : 4);
      }
      c.fillStyle = '#1b2540'; c.beginPath(); c.arc(0, 0, 10 + tier, 0, TAU); c.fill();
      c.strokeStyle = col; c.lineWidth = 1.5; c.stroke();
      c.fillStyle = col; c.beginPath(); c.arc(0, 0, 3, 0, TAU); c.fill();
      if (tier >= 2) { c.strokeStyle = col; c.lineWidth = 2; c.beginPath(); c.arc(0, 0, 15, -0.9, 0.9); c.stroke(); c.beginPath(); c.arc(0, 0, 15, Math.PI - 0.9, Math.PI + 0.9); c.stroke(); }
      if (fl > 0) glow(c, 25 + tier * 3 + len * 0.3, 0, 16, isOverdrive ? '#fde047' : '#cffafe', fl);
      break;
    }
    case 'plasma': {
      c.rotate(a);
      const isMortar = o.branch === 'A';
      const bw = (isMortar ? 14 : 9) + tier * 2.5, len = (isMortar ? 26 : 22) + tier * 2 - rec * 6;
      if (tier >= 1) { c.fillStyle = '#33261b'; rr(c, -6, -19, 20, 6, 3); c.fill(); rr(c, -6, 13, 20, 6, 3); c.fill(); c.fillStyle = col; c.fillRect(8, -17.5, 3, 3); c.fillRect(8, 14.5, 3, 3); }
      c.fillStyle = '#2b2118'; c.beginPath(); c.arc(0, 0, isMortar ? 16 : 14, 0, TAU); c.fill(); c.strokeStyle = col; c.lineWidth = 2; c.stroke();
      c.fillStyle = isMortar ? '#451a03' : '#3a2d22'; rr(c, 2, -bw / 2, len, bw, 3); c.fill(); c.strokeStyle = col; c.lineWidth = 1.2; c.stroke();
      c.fillStyle = col; c.fillRect(2 + len - 4, -bw / 2 - 1.5, 4, bw + 3);
      if (tier >= 2) c.fillRect(2 + len * 0.5, -bw / 2 - 1.5, 3, bw + 3);
      const pulse = 0.6 + 0.4 * Math.sin(time * 5);
      glow(c, 0, 0, isMortar ? 12 : 9, isMortar ? '#ea580c' : '#fdba74', 0.5 + 0.5 * pulse);
      if (fl > 0) glow(c, 26 + len * 0.4, 0, 18, '#fff7ed', fl);
      break;
    }
    case 'cryo': {
      const isAbsZero = o.branch === 'A', isVortex = o.branch === 'B';
      const pulse = 0.5 + 0.5 * Math.sin(time * 3);
      glow(c, 0, 0, 26, isAbsZero ? '#93c5fd' : (isVortex ? '#3b82f6' : '#60a5fa'), 0.2 + 0.15 * pulse + fl * 0.5);
      c.save(); c.rotate(isVortex ? -o.spin * 1.5 : o.spin);
      const sp = isAbsZero ? 8 : (4 + tier * 2);
      for (let i = 0; i < sp; i++) {
        c.save(); c.rotate(i * TAU / sp);
        const L = (isAbsZero ? 18 : 15) + tier * 3 - (i % 2 ? 3 : 0);
        c.fillStyle = i % 2 ? '#93c5fd' : '#bfdbfe'; c.beginPath(); c.moveTo(6, -3.2); c.lineTo(L, 0); c.lineTo(6, 3.2); c.closePath(); c.fill();
        c.restore();
      }
      c.restore();
      c.fillStyle = '#1e3a8a'; c.strokeStyle = '#bfdbfe'; c.lineWidth = 1.5;
      c.beginPath(); for (let i = 0; i < 6; i++) { const q = i * TAU / 6 + o.spin * 0.3; c.lineTo(Math.cos(q) * 9, Math.sin(q) * 9); } c.closePath(); c.fill(); c.stroke();
      glow(c, 0, 0, 7, '#eff6ff', 0.7 + 0.3 * pulse);
      break;
    }
    case 'tesla': {
      const isDisrupter = o.branch === 'B';
      const rings = 3 + tier;
      for (let i = 0; i < rings; i++) {
        const r = 15 - i * (8 / rings);
        c.fillStyle = i % 2 ? '#2a2410' : '#1c1a10'; c.strokeStyle = col; c.lineWidth = 1.2;
        c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill(); c.globalAlpha = 0.5 + i * 0.08; c.stroke(); c.globalAlpha = 1;
      }
      const pr = 3 + tier, tips = [];
      for (let i = 0; i < pr; i++) {
        const q = i * TAU / pr + o.spin * 0.3, x1 = Math.cos(q) * 7, y1 = Math.sin(q) * 7, x2 = Math.cos(q) * 15, y2 = Math.sin(q) * 15;
        c.strokeStyle = '#a16207'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
        c.fillStyle = col; c.beginPath(); c.arc(x2, y2, 2, 0, TAU); c.fill(); tips.push(x2, y2);
      }
      if (Math.sin(time * 13 + (o.x || 0)) > 0.75 && tips.length >= 4) {
        c.strokeStyle = isDisrupter ? '#7dd3fc' : '#fef08a'; c.lineWidth = 1; c.beginPath(); c.moveTo(tips[0], tips[1]);
        c.lineTo((tips[0] + tips[2]) / 2 + rand(-4, 4), (tips[1] + tips[3]) / 2 + rand(-4, 4)); c.lineTo(tips[2], tips[3]); c.stroke();
      }
      const pulse = 0.6 + 0.4 * Math.sin(time * 6);
      glow(c, 0, 0, 9 + fl * 6, isDisrupter ? '#38bdf8' : '#fde047', 0.7 * pulse + 0.3 + fl * 0.5);
      c.fillStyle = '#fffbeb'; c.beginPath(); c.arc(0, 0, 2.6, 0, TAU); c.fill();
      break;
    }
    case 'rail': {
      c.rotate(a);
      const isExec = o.branch === 'B';
      const L = (isExec ? 32 : 26) + tier * 4 - rec * 8;
      c.fillStyle = '#2a1018'; rr(c, -15, -10, 15, 20, 3); c.fill(); c.strokeStyle = col; c.lineWidth = 1.5; c.stroke();
      for (let i = 0; i <= tier; i++) { c.fillStyle = col; c.beginPath(); c.arc(-11 + i * 4, 0, 1.4, 0, TAU); c.fill(); }
      if (tier >= 1) { c.fillStyle = '#3b1520'; c.beginPath(); c.moveTo(-4, -10); c.lineTo(8, -14); c.lineTo(8, -8); c.closePath(); c.fill(); c.beginPath(); c.moveTo(-4, 10); c.lineTo(8, 14); c.lineTo(8, 8); c.closePath(); c.fill(); }
      c.fillStyle = '#3b1520'; c.fillRect(-2, -7, L, 4); c.fillRect(-2, 3, L, 4);
      c.strokeStyle = col; c.lineWidth = 1; c.strokeRect(-2, -7, L, 4); c.strokeRect(-2, 3, L, 4);
      const ch = o.charge === undefined ? 1 : o.charge;
      c.fillStyle = 'rgba(251,113,133,' + (0.25 + ch * 0.6) + ')'; c.fillRect(0, -3, L - 2, 6);
      c.fillStyle = col; c.fillRect(L - 4, -8, 3, 5); c.fillRect(L - 4, 3, 3, 5);
      if (tier >= 2) { c.fillStyle = '#1f2937'; rr(c, 4, -3, 10, 6, 2); c.fill(); c.fillStyle = '#fecdd3'; c.fillRect(12, -1, 2, 2); }
      if (fl > 0) glow(c, L + 2, 0, 22, '#ffe4e6', fl);
      break;
    }
    case 'relay': {
      const isOverdrive = o.overdriveT > 0;
      const isShutdown = o.shutdownT > 0;
      // Hexagonal reactor base
      c.fillStyle = isShutdown ? '#1e293b' : '#064e3b';
      c.strokeStyle = isShutdown ? '#475569' : (isOverdrive ? '#34d399' : col);
      c.lineWidth = isOverdrive ? 2.5 : 1.8;
      c.beginPath();
      for (let i = 0; i < 6; i++) {
        const q = i * TAU / 6 + (o.spin || 0) * 0.2;
        const rx = Math.cos(q) * 16, ry = Math.sin(q) * 16;
        i ? c.lineTo(rx, ry) : c.moveTo(rx, ry);
      }
      c.closePath(); c.fill(); c.stroke();

      // Pulsing reactor core
      const pulse = isShutdown ? 0.2 : (0.5 + 0.5 * Math.sin(time * (isOverdrive ? 18 : 6)));
      const coreCol = isShutdown ? '#64748b' : (isOverdrive ? '#6ee7b7' : '#10b981');
      glow(c, 0, 0, 14, coreCol, pulse);
      c.fillStyle = coreCol;
      c.beginPath(); c.arc(0, 0, 6.5, 0, TAU); c.fill();
      c.fillStyle = '#ecfdf5';
      c.beginPath(); c.arc(0, 0, 2.8, 0, TAU); c.fill();

      // 3 Cooling rods
      for (let i = 0; i < 3; i++) {
        const q = i * TAU / 3 + (o.spin || 0) * 0.5;
        c.fillStyle = isShutdown ? '#334155' : '#059669';
        c.beginPath(); c.arc(Math.cos(q) * 11, Math.sin(q) * 11, 2.2, 0, TAU); c.fill();
      }
      break;
    }
    case 'fusion_hellfire': {
      c.rotate(a);
      // Heavy twin Gatling chassis
      c.fillStyle = '#1c1917'; rr(c, -12, -14, 15, 28, 4); c.fill();
      c.strokeStyle = '#f97316'; c.lineWidth = 2; c.stroke();
      // Twin rotary barrel banks
      for (const offset of [-7, 7]) {
        for (let i = 0; i < 4; i++) {
          const ang = (o.spin || 0) * 2 + i * TAU / 4;
          const by = offset + Math.sin(ang) * 4.5;
          c.fillStyle = '#44403c'; c.fillRect(2, by - 1.5, 24, 3);
          c.fillStyle = '#f97316'; c.fillRect(23, by - 1.5, 3, 3);
        }
      }
      // Magma combustion chamber
      const heatPulse = 0.5 + 0.5 * Math.sin(time * 12);
      glow(c, 0, 0, 14, '#f97316', heatPulse * 0.8);
      c.fillStyle = '#fb923c'; c.beginPath(); c.arc(0, 0, 6, 0, TAU); c.fill();
      if (fl > 0) {
        glow(c, 28, -7, 16, '#fed7aa', fl);
        glow(c, 28, 7, 16, '#fed7aa', fl);
      }
      break;
    }
    case 'fusion_deathray': {
      c.rotate(a);
      // Rail accelerators
      c.fillStyle = '#0f172a'; rr(c, -14, -12, 16, 24, 4); c.fill();
      c.fillStyle = '#1e1b4b'; c.fillRect(2, -11, 28, 5); c.fillRect(2, 6, 28, 5);
      c.strokeStyle = '#a855f7'; c.lineWidth = 1.8; c.strokeRect(2, -11, 28, 5); c.strokeRect(2, 6, 28, 5);
      // Central focusing crystal
      const rayPulse = 0.6 + 0.4 * Math.sin(time * 16);
      glow(c, 10, 0, 16, '#c084fc', rayPulse);
      c.fillStyle = '#e9d5ff'; c.beginPath(); c.arc(10, 0, 5, 0, TAU); c.fill();
      // Arc coils
      c.strokeStyle = '#38bdf8'; c.lineWidth = 1.5;
      c.beginPath(); c.moveTo(6, -8); c.lineTo(10, 0); c.lineTo(6, 8); c.stroke();
      if (fl > 0) glow(c, 30, 0, 22, '#c084fc', fl);
      break;
    }
    case 'fusion_zero': {
      // Hex permafrost base
      c.fillStyle = '#083344'; c.strokeStyle = '#06b6d4'; c.lineWidth = 2.2;
      c.beginPath();
      for (let i = 0; i < 6; i++) {
        const q = i * TAU / 6 + (o.spin || 0) * 0.15;
        const rx = Math.cos(q) * 18, ry = Math.sin(q) * 18;
        i ? c.lineTo(rx, ry) : c.moveTo(rx, ry);
      }
      c.closePath(); c.fill(); c.stroke();
      // Absolute Zero core
      const zPulse = 0.5 + 0.5 * Math.sin(time * 8);
      glow(c, 0, 0, 20, '#22d3ee', zPulse * 0.9);
      c.fillStyle = '#cffafe'; c.beginPath(); c.arc(0, 0, 8, 0, TAU); c.fill();
      // Counter-rotating cryo rings
      c.save(); c.rotate(time * 2);
      c.strokeStyle = '#67e8f9'; c.lineWidth = 1.5; c.setLineDash([6, 4]);
      c.beginPath(); c.arc(0, 0, 13, 0, TAU); c.stroke();
      c.restore();
      break;
    }
    case 'fusion_antimatter': {
      c.rotate(a);
      // Gravitational horns
      c.fillStyle = '#1e1b4b'; rr(c, -12, -15, 14, 30, 4); c.fill();
      c.strokeStyle = '#818cf8'; c.lineWidth = 2; c.stroke();
      c.fillStyle = '#312e81';
      c.beginPath(); c.moveTo(2, -14); c.lineTo(26, -6); c.lineTo(2, -2); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(2, 14); c.lineTo(26, 6); c.lineTo(2, 2); c.closePath(); c.fill();
      // Event horizon singularity
      glow(c, 12, 0, 18, '#818cf8', 0.8 + 0.2 * Math.sin(time * 10));
      c.fillStyle = '#020617'; c.beginPath(); c.arc(12, 0, 6.5, 0, TAU); c.fill();
      c.strokeStyle = '#c084fc'; c.lineWidth = 1.5; c.stroke();
      break;
    }
  }
  c.restore();
}

/* ============================================================
   SPRITES, enemies
   ============================================================ */
function drawEnemy(c, e, time) {
  const r = e.r;
  c.save(); c.translate(e.x, e.y);
  if (e.healFx > 0) glow(c, 0, 0, r + 16, '#6ee7b7', e.healFx);

  // Champion Under-Aura (Fase 2)
  if (e.isChampion && e.affix && CHAMPION_AFFIXES[e.affix]) {
    const af = CHAMPION_AFFIXES[e.affix];
    c.save();
    c.strokeStyle = af.color;
    c.lineWidth = 2.2;
    c.setLineDash([6, 4]);
    c.beginPath();
    c.arc(0, 0, r + 9, time * 2, time * 2 + TAU);
    c.stroke();
    c.fillStyle = af.auraColor;
    c.beginPath();
    c.arc(0, 0, r + 9, 0, TAU);
    c.fill();
    c.restore();
  }

  // Adaptive Threat Indicators
  if (e.threat === 'deflector') {
    c.save();
    c.strokeStyle = 'rgba(148,163,184,0.8)';
    c.lineWidth = 1.8;
    c.beginPath();
    c.arc(0, 0, r + 6, 0, TAU);
    c.stroke();
    c.restore();
  } else if (e.threat === 'thermal_juggernaut') {
    c.save();
    c.strokeStyle = 'rgba(234,88,12,0.85)';
    c.lineWidth = 2;
    c.setLineDash([4, 4]);
    c.beginPath();
    c.arc(0, 0, r + 8, -time * 3, -time * 3 + TAU);
    c.stroke();
    c.restore();
  } else if (e.threat === 'artillery') {
    c.save();
    c.strokeStyle = 'rgba(239,68,68,0.85)';
    c.lineWidth = 2;
    c.beginPath();
    c.arc(0, 0, r + 7, 0, TAU);
    c.stroke();
    c.restore();
  }

  // Anti-Projectile Dome projection
  if (e.affix === 'dome') {
    c.save();
    const domePulse = 0.5 + 0.5 * Math.sin(time * 3);
    c.fillStyle = 'rgba(56,189,248,' + (0.08 + 0.05 * domePulse) + ')';
    c.strokeStyle = 'rgba(56,189,248,' + (0.4 + 0.3 * domePulse) + ')';
    c.lineWidth = 1.5;
    c.beginPath();
    c.arc(0, 0, 40, 0, TAU);
    c.fill();
    c.stroke();
    c.restore();
  }

  c.save(); c.rotate(e.ang);
  switch (e.type) {
    case 'scout': {
      if (e.curSpeed > 0) {
        const f = 0.7 + 0.3 * Math.sin(e.anim * 45);
        c.fillStyle = 'rgba(190,255,90,0.75)'; c.beginPath(); c.moveTo(-r * 0.45, -r * 0.2); c.lineTo(-r * (1.2 + f * 0.5), 0); c.lineTo(-r * 0.45, r * 0.2); c.closePath(); c.fill();
      }
      c.fillStyle = '#a3e635'; c.strokeStyle = '#365314'; c.lineWidth = 1.6;
      c.beginPath(); c.moveTo(r * 1.15, 0); c.lineTo(-r * 0.8, -r * 0.8); c.lineTo(-r * 0.35, 0); c.lineTo(-r * 0.8, r * 0.8); c.closePath(); c.fill(); c.stroke();
      c.fillStyle = '#1a2e05'; c.beginPath(); c.ellipse(r * 0.15, 0, r * 0.35, r * 0.2, 0, 0, TAU); c.fill();
      break;
    }
    case 'brute': {
      const af = e.armor > 0 ? clamp((e.armor - e.shred) / e.armor, 0, 1) : 0;
      c.fillStyle = '#1e293b'; rr(c, -r, -r * 0.98, r * 2, r * 0.36, 4); c.fill(); rr(c, -r, r * 0.62, r * 2, r * 0.36, 4); c.fill();
      c.fillStyle = '#64748b'; c.strokeStyle = '#cbd5e1'; c.lineWidth = 1.5; rr(c, -r * 0.88, -r * 0.7, r * 1.76, r * 1.4, 5); c.fill(); c.stroke();
      c.fillStyle = 'rgba(148,163,184,' + (0.25 + af * 0.75) + ')'; rr(c, -r * 0.7, -r * 0.5, r * 0.8, r, 3); c.fill();
      if (af < 1) { c.fillStyle = 'rgba(251,146,60,' + ((1 - af) * 0.7) + ')'; rr(c, -r * 0.7, -r * 0.5, r * 0.8, r, 3); c.fill(); c.strokeStyle = 'rgba(30,20,10,' + (1 - af) + ')'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(-r * 0.5, -r * 0.4); c.lineTo(-r * 0.2, 0); c.lineTo(-r * 0.4, r * 0.4); c.stroke(); }
      c.fillStyle = '#0f172a'; rr(c, r * 0.15, -r * 0.4, r * 0.7, r * 0.8, 3); c.fill();
      c.fillStyle = '#f87171'; c.fillRect(r * 0.5, -r * 0.14, r * 0.28, r * 0.28);
      c.fillStyle = '#334155'; for (const sx of [-0.6, 0.3]) for (const sy of [-0.55, 0.55]) { c.beginPath(); c.arc(r * sx, r * sy, 1.6, 0, TAU); c.fill(); }
      break;
    }
    case 'swarm': {
      c.strokeStyle = '#9f1239'; c.lineWidth = 1.2;
      for (let i = 0; i < 3; i++) {
        const w = Math.sin(e.anim * 22 + i * 2) * 2.2, x = -r * 0.5 + i * r * 0.55;
        c.beginPath(); c.moveTo(x, -r * 0.4); c.lineTo(x + w, -r * 1.15); c.moveTo(x, r * 0.4); c.lineTo(x - w, r * 1.15); c.stroke();
      }
      c.fillStyle = '#f43f5e'; c.beginPath(); c.ellipse(0, 0, r, r * 0.8, 0, 0, TAU); c.fill();
      c.fillStyle = '#be123c'; c.beginPath(); c.arc(r * 0.7, 0, r * 0.5, 0, TAU); c.fill();
      c.fillStyle = '#fde047'; c.fillRect(r * 0.85, -r * 0.35, 1.6, 1.6); c.fillRect(r * 0.85, r * 0.2, 1.6, 1.6);
      break;
    }
    case 'healer': {
      c.rotate(-e.ang);
      const pulse = 0.5 + 0.5 * Math.sin(e.anim * 4);
      c.strokeStyle = 'rgba(110,231,183,' + (0.15 + 0.15 * pulse) + ')'; c.lineWidth = 1.5; c.beginPath(); c.arc(0, 0, r + 5 + pulse * 2, 0, TAU); c.stroke();
      const g = c.createRadialGradient(0, -2, 1, 0, 0, r); g.addColorStop(0, '#d1fae5'); g.addColorStop(1, '#10b981');
      c.fillStyle = g; c.strokeStyle = '#065f46'; c.lineWidth = 1.6; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill(); c.stroke();
      c.fillStyle = '#fff'; c.fillRect(-2.4, -r * 0.6, 4.8, r * 1.2); c.fillRect(-r * 0.6, -2.4, r * 1.2, 4.8);
      c.fillStyle = '#34d399'; for (let i = 0; i < 3; i++) { const q = e.anim * 2 + i * TAU / 3; c.beginPath(); c.arc(Math.cos(q) * (r + 7), Math.sin(q) * (r + 7), 1.8, 0, TAU); c.fill(); }
      break;
    }
    case 'boss': {
      if (e.titanId === 'goliath') {
        // Heavy industrial caterpillar treads
        c.fillStyle = '#1e293b';
        rr(c, -r * 1.1, -r * 0.95, r * 2.2, r * 0.38, 4); c.fill();
        rr(c, -r * 1.1, r * 0.57, r * 2.2, r * 0.38, 4); c.fill();
        c.strokeStyle = '#475569'; c.lineWidth = 1.5;
        rr(c, -r * 1.1, -r * 0.95, r * 2.2, r * 0.38, 4); c.stroke();
        rr(c, -r * 1.1, r * 0.57, r * 2.2, r * 0.38, 4); c.stroke();
        // Heavy armored chassis
        c.fillStyle = '#78350f'; rr(c, -r * 0.9, -r * 0.65, r * 1.8, r * 1.3, 5); c.fill();
        c.fillStyle = '#b45309'; rr(c, -r * 0.75, -r * 0.55, r * 1.5, r * 1.1, 4); c.fill();
        c.strokeStyle = '#f59e0b'; c.lineWidth = 2; rr(c, -r * 0.75, -r * 0.55, r * 1.5, r * 1.1, 4); c.stroke();
        // Conical spinning drill bit head on front
        const dSpin = Math.sin(e.anim * 25) * 3;
        c.fillStyle = '#475569'; c.beginPath();
        c.moveTo(r * 0.75, -r * 0.45); c.lineTo(r * 1.5, dSpin); c.lineTo(r * 0.75, r * 0.45); c.closePath();
        c.fill(); c.strokeStyle = '#94a3b8'; c.lineWidth = 1.5; c.stroke();
        // Glowing orange rear fuel valve (weak point)
        const rearPulse = 0.6 + 0.4 * Math.sin(time * 8);
        glow(c, -r * 0.85, 0, 14, '#ea580c', rearPulse);
        c.fillStyle = '#ea580c'; c.beginPath(); c.arc(-r * 0.85, 0, 5, 0, TAU); c.fill();
        c.strokeStyle = '#fef08a'; c.lineWidth = 1.5; c.stroke();
        break;
      }
      if (e.titanId === 'chronoweaver') {
        c.rotate(-e.ang); // keep dials oriented
        // Outer chrono-dial
        c.save(); c.rotate(time * 1.2);
        c.strokeStyle = '#38bdf8'; c.lineWidth = 2; c.setLineDash([6, 6]);
        c.beginPath(); c.arc(0, 0, r * 1.2, 0, TAU); c.stroke();
        c.restore();
        // Inner reverse chrono-dial
        c.save(); c.rotate(-time * 1.8);
        c.strokeStyle = '#818cf8'; c.lineWidth = 1.5; c.setLineDash([4, 4]);
        c.beginPath(); c.arc(0, 0, r * 0.85, 0, TAU); c.stroke();
        c.restore();
        // Central time singularity orb
        const sp = 0.5 + 0.5 * Math.sin(time * 6);
        glow(c, 0, 0, r * 0.7, '#38bdf8', 0.5 + 0.3 * sp);
        c.fillStyle = '#0f172a'; c.beginPath(); c.arc(0, 0, r * 0.5, 0, TAU); c.fill();
        c.strokeStyle = '#e0f2fe'; c.lineWidth = 2; c.stroke();
        c.fillStyle = '#38bdf8'; c.beginPath(); c.arc(0, 0, r * 0.25, 0, TAU); c.fill();
        break;
      }
      if (e.titanId === 'swarm_mother') {
        // Segmented chitin abdomen
        c.fillStyle = '#831843'; c.beginPath(); c.ellipse(-r * 0.4, 0, r * 0.9, r * 0.65, 0, 0, TAU); c.fill();
        c.strokeStyle = '#ec4899'; c.lineWidth = 2; c.stroke();
        // Biomorphic brood sacs
        const broodPulse = 0.5 + 0.5 * Math.sin(e.anim * 8);
        glow(c, -r * 0.5, 0, r * 0.5, '#ec4899', 0.4 + 0.3 * broodPulse);
        // Head & Mandibles
        c.fillStyle = '#500724'; c.beginPath(); c.arc(r * 0.6, 0, r * 0.45, 0, TAU); c.fill();
        c.strokeStyle = '#f472b6'; c.lineWidth = 1.5; c.stroke();
        // Mandibles
        c.strokeStyle = '#fbcfe8'; c.lineWidth = 2;
        c.beginPath(); c.moveTo(r * 0.8, -r * 0.25); c.lineTo(r * 1.3, -r * 0.1); c.stroke();
        c.beginPath(); c.moveTo(r * 0.8, r * 0.25); c.lineTo(r * 1.3, r * 0.1); c.stroke();
        // Wings if damaged
        if (e.hp <= e.maxHp * 0.6) {
          const wFlap = Math.sin(e.anim * 20) * 0.3;
          c.fillStyle = 'rgba(236,72,153,0.35)'; c.strokeStyle = '#ec4899'; c.lineWidth = 1.5;
          c.beginPath(); c.moveTo(0, -r * 0.3); c.lineTo(-r * 0.8, -r * (1.6 + wFlap)); c.lineTo(r * 0.4, -r * 0.3); c.closePath(); c.fill(); c.stroke();
          c.beginPath(); c.moveTo(0, r * 0.3); c.lineTo(-r * 0.8, r * (1.6 + wFlap)); c.lineTo(r * 0.4, r * 0.3); c.closePath(); c.fill(); c.stroke();
        }
        break;
      }
      c.rotate(-e.ang + e.anim * 0.35);
      const spikes = 10;
      c.fillStyle = e.phase === 3 ? '#881337' : '#581c87'; c.strokeStyle = e.phase === 3 ? '#fb7185' : '#d8b4fe'; c.lineWidth = 2;
      c.beginPath();
      for (let i = 0; i < spikes * 2; i++) { const q = i * Math.PI / spikes, rad = i % 2 ? r * 0.82 : r * 1.12; c.lineTo(Math.cos(q) * rad, Math.sin(q) * rad); }
      c.closePath(); c.fill(); c.stroke();
      c.fillStyle = e.phase === 3 ? '#9f1239' : '#7e22ce'; c.beginPath(); c.arc(0, 0, r * 0.72, 0, TAU); c.fill(); c.strokeStyle = e.phase === 3 ? '#f43f5e' : '#c084fc'; c.stroke();
      c.save(); c.rotate(-e.anim * (e.phase === 3 ? 1.8 : 0.9)); c.strokeStyle = 'rgba(233,213,255,0.7)'; c.lineWidth = 2; c.setLineDash([8, 6]); c.beginPath(); c.arc(0, 0, r * 0.52, 0, TAU); c.stroke(); c.restore();
      const pulse = 0.6 + 0.4 * Math.sin(e.anim * (e.phase === 3 ? 14 : 5));
      glow(c, 0, 0, r * 0.45, e.phase === 3 ? '#f43f5e' : '#fb7185', 0.8 * pulse + 0.2);
      c.fillStyle = '#fff1f2'; c.beginPath(); c.arc(0, 0, r * 0.12, 0, TAU); c.fill();
      if (e.phase === 3) glow(c, 0, 0, r * 1.5, '#f43f5e', 0.6 + 0.3 * Math.sin(time * 15));
      break;
    }
    case 'stealth': {
      const rev = e.revealT > 0;
      c.globalAlpha = rev ? 0.9 : (0.28 + 0.14 * Math.sin(time * 12));
      c.fillStyle = rev ? '#0284c7' : '#0369a1'; c.strokeStyle = '#38bdf8'; c.lineWidth = 1.4;
      c.beginPath(); c.moveTo(r * 1.3, 0); c.lineTo(-r * 0.9, -r * 0.7); c.lineTo(-r * 0.4, 0); c.lineTo(-r * 0.9, r * 0.7); c.closePath(); c.fill(); c.stroke();
      if (!rev) { c.strokeStyle = '#7dd3fc'; c.lineWidth = 1; c.strokeRect(-r * 0.4, -r * 0.3, r * 0.8, r * 0.6); }
      break;
    }
    case 'carrier': {
      c.fillStyle = '#1e293b'; c.strokeStyle = '#38bdf8'; c.lineWidth = 2;
      c.beginPath();
      for (let i = 0; i < 6; i++) { const q = i * TAU / 6; c.lineTo(Math.cos(q) * r, Math.sin(q) * r); }
      c.closePath(); c.fill(); c.stroke();
      c.fillStyle = '#0f172a'; c.beginPath(); c.arc(0, 0, r * 0.5, 0, TAU); c.fill();
      glow(c, 0, 0, r * 0.4, '#38bdf8', 0.6 + 0.4 * Math.sin(time * 4));
      for (let i = 0; i < 3; i++) {
        const q = time * 2.5 + i * TAU / 3, dx = Math.cos(q) * (r + 9), dy = Math.sin(q) * (r + 9);
        c.fillStyle = '#38bdf8'; c.beginPath(); c.arc(dx, dy, 2.8, 0, TAU); c.fill();
      }
      break;
    }
    case 'breacher': {
      c.fillStyle = '#451a03'; c.strokeStyle = '#f59e0b'; c.lineWidth = 1.8;
      rr(c, -r, -r * 0.7, r * 2, r * 1.4, 3); c.fill(); c.stroke();
      c.fillStyle = '#dc2626'; c.beginPath(); c.arc(0, 0, r * 0.4, 0, TAU); c.fill();
      glow(c, 0, 0, r * 0.7, '#fbbf24', 0.5 + 0.5 * Math.sin(time * 18));
      break;
    }
  }
  c.restore();
  if (e.armor > 0 && e.shred > 0 && e.type === 'boss') { c.strokeStyle = 'rgba(251,146,60,0.5)'; c.lineWidth = 2; c.beginPath(); c.arc(0, 0, r + 2, 0, TAU); c.stroke(); }
  if (e.flash > 0) { c.fillStyle = 'rgba(255,255,255,' + (e.flash * 0.55) + ')'; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill(); }
  if (e.slowT > 0) { c.strokeStyle = 'rgba(96,165,250,0.75)'; c.lineWidth = 2; c.beginPath(); c.arc(0, 0, r + 3, 0, TAU); c.stroke(); }
  if (e.acidT > 0) { c.strokeStyle = 'rgba(163,230,53,0.8)'; c.lineWidth = 1.8; c.beginPath(); c.arc(0, 0, r + 4, 0, TAU); c.stroke(); }
  if (e.thermiteT > 0) { c.strokeStyle = 'rgba(249,115,22,0.85)'; c.lineWidth = 2; c.beginPath(); c.arc(0, 0, r + 5, 0, TAU); c.stroke(); }
  if (e.brittleT > 0) {
    c.strokeStyle = 'rgba(226,240,255,0.85)'; c.lineWidth = 1;
    c.beginPath(); c.moveTo(-r * 0.5, -r * 0.6); c.lineTo(-r * 0.1, -r * 0.1); c.lineTo(-r * 0.4, r * 0.3); c.moveTo(-r * 0.1, -r * 0.1); c.lineTo(r * 0.4, r * 0.1); c.stroke();
  }
  if (e.stunT > 0) { c.fillStyle = 'rgba(186,230,253,0.5)'; c.strokeStyle = '#e0f2fe'; c.lineWidth = 2; rr(c, -r - 3, -r - 3, r * 2 + 6, r * 2 + 6, 6); c.fill(); c.stroke(); }
  if (e.shield > 0) {
    const pct = clamp(e.shield / e.maxShield, 0, 1);
    c.fillStyle = 'rgba(34,211,238,' + (0.1 + 0.12 * pct) + ')'; c.beginPath(); c.arc(0, 0, r + 6, 0, TAU); c.fill();
    c.save(); c.rotate(e.anim * 1.5); c.strokeStyle = 'rgba(103,232,249,' + (0.5 + 0.4 * pct) + ')'; c.lineWidth = 2; c.setLineDash([7, 5]); c.beginPath(); c.arc(0, 0, r + 6, 0, TAU); c.stroke(); c.restore();
  }
  if (e.hijackedT > 0) {
    c.save();
    c.strokeStyle = '#38bdf8'; c.lineWidth = 2; c.setLineDash([5, 4]);
    c.beginPath(); c.arc(0, 0, r + 8, 0, TAU); c.stroke();
    glow(c, 0, 0, r + 12, '#38bdf8', 0.5);
    c.restore();
  }
  if (e.chitinHits > 0) {
    c.save();
    c.strokeStyle = '#fb7185'; c.lineWidth = 2.5;
    for (let k = 0; k < e.chitinHits; k++) {
      const ca = k * TAU / 4;
      c.beginPath(); c.arc(0, 0, r + 4, ca - 0.4, ca + 0.4); c.stroke();
    }
    c.restore();
  }
  c.restore();
}
function drawBars(c, e) {
  if (!(e.hp < e.maxHp || e.shield > 0 || e.type === 'boss' || e.isChampion)) return;
  const w = Math.max(22, e.r * 2 + 6), h = 4, x = e.x - w / 2, y = e.y - e.r - 11 - (e.shield > 0 ? 4 : 0);
  c.fillStyle = 'rgba(2,6,14,0.85)'; rr(c, x - 1, y - 1, w + 2, h + 2, 2); c.fill();
  c.fillStyle = '#e2e8f0'; c.fillRect(x, y, w * clamp(e.dispHp / e.maxHp, 0, 1), h);
  const pct = clamp(e.hp / e.maxHp, 0, 1);
  c.fillStyle = pct > 0.6 ? '#34d399' : pct > 0.3 ? '#fbbf24' : '#f43f5e'; c.fillRect(x, y, w * pct, h);
  if (e.shield > 0) { c.fillStyle = 'rgba(2,6,14,0.85)'; c.fillRect(x - 1, y + h + 1, w + 2, 4); c.fillStyle = '#22d3ee'; c.fillRect(x, y + h + 2, w * clamp(e.shield / e.maxShield, 0, 1), 2.5); }
  if (e.isChampion && e.affix && CHAMPION_AFFIXES[e.affix]) {
    c.fillStyle = CHAMPION_AFFIXES[e.affix].color;
    c.beginPath();
    c.moveTo(e.x, y - 8);
    c.lineTo(e.x + 4, y - 4);
    c.lineTo(e.x, y - 1);
    c.lineTo(e.x - 4, y - 4);
    c.closePath();
    c.fill();
  }
}
function enemyIcon(type) {
  const cv = document.createElement('canvas'); cv.width = cv.height = 52;
  const c = cv.getContext('2d'), d = ED[type];
  const sc = type === 'boss' ? 0.75 : type === 'brute' ? 1.05 : type === 'carrier' ? 0.95 : type === 'stealth' ? 1.7 : type === 'breacher' ? 1.4 : type === 'swarm' ? 2.2 : type === 'scout' ? 1.6 : 1.5;
  const fake = { type, x: 0, y: 0, r: d.r, ang: type === 'boss' || type === 'healer' || type === 'carrier' ? 0 : -0.4, anim: 1, curSpeed: 0, armor: d.armor, shred: 0, flash: 0, slowT: 0, brittleT: 0, stunT: 0, shield: 0, healFx: 0, revealT: 1 };
  c.translate(26, 26); c.scale(sc, sc);
  drawEnemy(c, fake, 0);
  return cv.toDataURL();
}
