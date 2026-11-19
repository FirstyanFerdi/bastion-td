'use strict';
/* Pointer and keyboard handling, canvas fitting */

/* ============================================================
   INPUT
   ============================================================ */
function setSpeed(s) {
  if (G && G.activeContract === 'blind_fire') s = 1;
  G.speed = s;
  Sfx.play('click');
}
function togglePause() {
  if (G.state !== 'prep' && G.state !== 'active') return;
  G.paused = !G.paused; Sfx.play('click');
}
function toggleMute() { Sfx.init(); Sfx.setMuted(!Sfx.muted); if (!Sfx.muted) Sfx.play('click'); }
function begin() {
  Sfx.init(); Sfx.resume && Sfx.resume();
  newGame(true); showOverlay(null); wcWave = -1;
}
Sfx.resume = function () { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); };

function canvasPos(e) {
  const rect = canvas.getBoundingClientRect();
  return { x: (e.clientX - rect.left) / rect.width * W, y: (e.clientY - rect.top) / rect.height * H };
}
function onPointerMove(e) {
  if (!G) return;
  const p = canvasPos(e); G.mouse.x = p.x; G.mouse.y = p.y; G.mouse.in = true;
  const col = Math.floor(p.x / TILE), row = Math.floor(p.y / TILE);
  G.hover = (col >= 0 && row >= 0 && col < COLS && row < ROWS) ? { c: col, r: row } : null;
}
function triggerSkill(id) {
  if (!G || (G.state !== 'prep' && G.state !== 'active') || G.drafting) return;
  if (!G.skills) G.skills = {};
  if (!G.skills[id]) G.skills[id] = { cd: 0 };
  const sk = G.skills[id];
  if (sk.cd > 0) { Sfx.play('error'); return; }

  // Check Pacifist Defense Contract
  if (G.activeContract === 'pacifist') {
    G.contractFailed = true;
    addText(W / 2, 70, 'PACIFIST CONTRACT BREACHED!', '#fb7185', 14);
  }
  G.skillsUsedThisWave = (G.skillsUsedThisWave || 0) + 1;

  // Workshop HQ: Command Protocol [R] - EMP Pulse when casting 4th skill slot [R]
  const curDoc = (typeof COMMANDER_DOCTRINES !== 'undefined' && COMMANDER_DOCTRINES[G.doctrine]) || (typeof COMMANDER_DOCTRINES !== 'undefined' && COMMANDER_DOCTRINES.vanguard);
  if (curDoc && curDoc.skills && id === curDoc.skills[3] && typeof getWorkshopLevel === 'function' && getWorkshopLevel('command_protocol') > 0) {
    shake(8);
    burst(BASE_PT.x, BASE_PT.y, 22, '#38bdf8', 160, 0.6, 3.5, true);
    addRing(BASE_PT.x, BASE_PT.y, 10, 160, 0.5, '#38bdf8', 4);
    addText(BASE_PT.x, BASE_PT.y - 25, 'COMMAND PROTOCOL: EMP WAVE', '#38bdf8', 14);
    for (const en of G.enemies) {
      if (en.dead) continue;
      if (en.shield > 0) en.shield = Math.round(en.shield * 0.5);
      if (en.type !== 'boss') en.stunT = Math.max(en.stunT || 0, 1.2);
    }
  }

  // Instant Cast Skills:
  if (id === 'emp_nuke') {
    sk.cd = COMMANDER_SKILLS.emp_nuke.cd;
    addRing(W / 2, H / 2, 20, Math.max(W, H), 0.85, '#38bdf8', 6);
    shake(16); Sfx.play('emp');
    addText(W / 2, 90, 'TACTICAL EMP DETONATED', '#38bdf8', 22);
    for (const en of G.enemies) {
      if (en.dead) continue;
      en.shield = 0; en.shieldT = 0;
      if (en.type !== 'boss') en.stunT = Math.max(en.stunT, 3.0);
      else en.stunT = Math.max(en.stunT, 1.2);
      burst(en.x, en.y, 8, '#38bdf8', 90, 0.45, 2.5, true);
      addText(en.x, en.y - en.r - 20, 'EMP SHUTDOWN', '#38bdf8', 13);
    }
    G.casting = null; G.uiDirty = true;
    return;
  }

  if (id === 'sabot_rounds') {
    sk.cd = COMMANDER_SKILLS.sabot_rounds.cd;
    G.sabotRoundsT = 6.0;
    shake(8); Sfx.play('upgrade');
    addRing(W / 2, H / 2, 20, 300, 0.6, '#f97316', 5);
    burst(W / 2, 90, 25, '#f97316', 150, 0.5, 3.5, true);
    addText(W / 2, 90, 'AP SABOT ROUNDS ARMED!', '#f97316', 20);
    G.casting = null; G.uiDirty = true;
    return;
  }

  if (id === 'liquidation') {
    sk.cd = COMMANDER_SKILLS.liquidation.cd;
    let sum = 0;
    for (const t of G.towers) sum += (t.invested || 0);
    const cash = Math.max(150, Math.round(sum * 0.25));
    G.gold += cash;
    G.liquidationT = 8.0;
    shake(10); Sfx.play('coin');
    burst(W / 2, 90, 30, '#fbbf24', 160, 0.6, 4, true);
    addText(W / 2, 90, 'LIQUIDATION +' + cash + 'G (100% CRITS!)', '#fbbf24', 20);
    G.casting = null; G.uiDirty = true;
    return;
  }

  if (G.casting === id) { G.casting = null; G.swapSource = null; G.uiDirty = true; Sfx.play('click'); return; }
  G.casting = id; G.placing = null; G.sel = null; G.swapSource = null; G.uiDirty = true;
  Sfx.play('click');
}

function onPointerDown(e) {
  if (!G || (G.state !== 'prep' && G.state !== 'active') || G.drafting) return;
  Sfx.init(); Sfx.resume();
  onPointerMove(e);
  if (e.button === 2) { G.placing = null; G.placingMegastructure = null; G.placingBarricade = null; G.sel = null; G.casting = null; G.swapSource = null; G.uiDirty = true; return; }

  // Titan Mech Manual Vulcan Fire (7.0)
  if (G.mech && G.mech.active && !G.casting) {
    const p = canvasPos(e);
    const col = Math.floor(p.x / TILE), row = Math.floor(p.y / TILE);
    if (col >= 0 && col < COLS && row >= 0 && row < ROWS && G.grid[row][col]) {
      G.sel = G.grid[row][col];
      G.uiDirty = true;
      Sfx.play('click');
      return;
    }
    if (typeof mechFireVulcan === 'function') {
      mechFireVulcan(p.x, p.y);
    }
    return;
  }

  // Commander Casting Handle
  if (G.casting) {
    const p = canvasPos(e);
    const col = Math.floor(p.x / TILE), row = Math.floor(p.y / TILE);
    if (G.casting === 'orbital') {
      const rad = 95 * (hasPerk('orbital_salvo') ? 1.4 : 1.0);
      burst(p.x, p.y, 45, '#f43f5e', 220, 0.8, 4, true);
      addRing(p.x, p.y, 10, rad, 0.7, '#f43f5e', 5);
      shake(12); Sfx.play('orbital');
      for (const en of G.enemies) {
        if (en.dead) continue;
        if ((en.x - p.x) ** 2 + (en.y - p.y) ** 2 <= (rad + en.r) ** 2) {
          dealDamage(en, 420 * hpScale(G.wave) * 0.45, 'phys', null);
          en.revealT = 4.0;
        }
      }
      G.skills.orbital.cd = COMMANDER_SKILLS.orbital.cd;
      G.casting = null; G.uiDirty = true;
      return;
    } else if (G.casting === 'minefield') {
      for (let m = 0; m < 6; m++) {
        const tOff = (m - 2.5) * 22;
        const mx = clamp(p.x + rand(-20, 20) + tOff, 30, W - 30);
        const my = clamp(p.y + rand(-20, 20), 30, H - 30);
        G.hazards.push({ type: 'mine', x: mx, y: my, r: 16, life: 30 });
        burst(mx, my, 4, '#f59e0b', 50, 0.3, 2, true);
      }
      shake(6); Sfx.play('upgrade');
      addText(p.x, p.y - 20, 'MINEFIELD DEPLOYED', '#f59e0b', 15);
      G.skills.minefield.cd = COMMANDER_SKILLS.minefield.cd;
      G.casting = null; G.uiDirty = true;
      return;
    } else if (G.casting === 'carpet_bomb') {
      shake(14); Sfx.play('boom');
      for (let b = 0; b < 5; b++) {
        const bx = clamp(p.x + (b - 2) * 55, 30, W - 30);
        const by = p.y + rand(-15, 15);
        burst(bx, by, 30, '#f97316', 180, 0.7, 4, true);
        addRing(bx, by, 10, 65, 0.5, '#ef4444', 4);
        for (const foe of G.enemies) {
          if (foe.dead) continue;
          if (Math.hypot(foe.x - bx, foe.y - by) <= 65 + foe.r) {
            dealDamage(foe, 300 * hpScale(G.wave) * 0.45, 'plasma', null);
          }
        }
      }
      addText(p.x, p.y - 30, 'CARPET BOMBING INBOUND', '#ef4444', 18);
      G.skills.carpet_bomb.cd = COMMANDER_SKILLS.carpet_bomb.cd;
      G.casting = null; G.uiDirty = true;
      return;
    } else if (G.casting === 'swap_towers') {
      let clickedTower = null, bestD = 48 * 48;
      for (const t of G.towers) {
        const d = (t.x - p.x) ** 2 + (t.y - p.y) ** 2;
        if (d < bestD) { bestD = d; clickedTower = t; }
      }
      if (!clickedTower) { Sfx.play('error'); return; }
      if (!G.swapSource) {
        G.swapSource = clickedTower;
        burst(clickedTower.x, clickedTower.y, 10, '#38bdf8', 80, 0.35, 2.5, true);
        addText(clickedTower.x, clickedTower.y - 20, 'SELECT TARGET TOWER', '#38bdf8', 12);
        Sfx.play('click');
        return;
      } else {
        if (G.swapSource === clickedTower) {
          G.swapSource = null; G.casting = null; G.uiDirty = true; Sfx.play('click'); return;
        }
        swapTowers(G.swapSource, clickedTower);
        G.skills.swap_towers.cd = COMMANDER_SKILLS.swap_towers.cd;
        G.swapSource = null; G.casting = null; G.uiDirty = true;
        return;
      }
    } else if (G.casting === 'overcharge') {
      let bestT = null, bestD = 48 * 48;
      for (const t of G.towers) {
        const d = (t.x - p.x) ** 2 + (t.y - p.y) ** 2;
        if (d < bestD) { bestD = d; bestT = t; }
      }
      if (bestT) {
        bestT.overchargeT = 8.0;
        burst(bestT.x, bestT.y, 25, '#38bdf8', 140, 0.6, 3, false);
        addRing(bestT.x, bestT.y, 10, 50, 0.5, '#38bdf8', 4);
        addText(bestT.x, bestT.y - 20, 'OVERCHARGED!', '#38bdf8', 16);
        Sfx.play('overcharge');
        G.skills.overcharge.cd = COMMANDER_SKILLS.overcharge.cd;
        G.casting = null; G.uiDirty = true;
        return;
      } else {
        Sfx.play('error'); return;
      }
    } else if (G.casting === 'cryo_singularity') {
      G.hazards.push({ type: 'singularity', x: p.x, y: p.y, r: 120, life: 3.5, max: 3.5 });
      burst(p.x, p.y, 35, '#38bdf8', 150, 0.7, 4, true);
      addRing(p.x, p.y, 15, 120, 0.7, '#60a5fa', 5);
      shake(10); Sfx.play('cryo');
      addText(p.x, p.y - 30, 'CRYO SINGULARITY!', '#38bdf8', 18);
      for (const foe of G.enemies) {
        if (foe.dead) continue;
        if (Math.hypot(foe.x - p.x, foe.y - p.y) <= 120 + foe.r) {
          foe.stunT = Math.max(foe.stunT, 2.5);
          dealDamage(foe, 80 * hpScale(G.wave) * 0.4, 'energy', null);
        }
      }
      G.skills.cryo_singularity.cd = COMMANDER_SKILLS.cryo_singularity.cd;
      G.casting = null; G.uiDirty = true;
      return;
    } else if (G.casting === 'holo_beacon') {
      G.hazards.push({ type: 'beacon', x: p.x, y: p.y, r: 24, hp: 400, maxHp: 400, life: 6.0, max: 6.0 });
      burst(p.x, p.y, 25, '#38bdf8', 120, 0.5, 3.5, true);
      addRing(p.x, p.y, 10, 85, 0.55, '#38bdf8', 4);
      shake(6); Sfx.play('shield');
      addText(p.x, p.y - 25, 'HOLO-BEACON DEPLOYED', '#38bdf8', 15);
      G.skills.holo_beacon.cd = COMMANDER_SKILLS.holo_beacon.cd;
      G.casting = null; G.uiDirty = true;
      return;
    } else if (G.casting === 'cyber_hijack') {
      let bestEnemy = null, bestDist = 60 * 60;
      for (const foe of G.enemies) {
        if (foe.dead || foe.type === 'boss') continue;
        const d = (foe.x - p.x) ** 2 + (foe.y - p.y) ** 2;
        if (d < bestDist) { bestDist = d; bestEnemy = foe; }
      }
      if (!bestEnemy) { Sfx.play('error'); return; }
      bestEnemy.hijackedT = 6.0;
      bestEnemy.hijackFireCd = 0.2;
      burst(bestEnemy.x, bestEnemy.y, 20, '#38bdf8', 130, 0.5, 3, true);
      addRing(bestEnemy.x, bestEnemy.y, 8, 45, 0.5, '#38bdf8', 4);
      shake(6); Sfx.play('emp');
      addText(bestEnemy.x, bestEnemy.y - bestEnemy.r - 20, 'CYBER-HIJACKED!', '#38bdf8', 16);
      G.skills.cyber_hijack.cd = COMMANDER_SKILLS.cyber_hijack.cd;
      G.casting = null; G.uiDirty = true;
      return;
    } else if (G.casting === 'caltrops') {
      if (col >= 0 && row >= 0 && col < COLS && row < ROWS && pathTile[row][col]) {
        const dur = hasPerk('nanite_infusion') ? 18 : 12;
        G.hazards.push({ type: 'caltrops', x: col * TILE + TILE / 2, y: row * TILE + TILE / 2, r: 28, life: dur, max: dur, dps: 34, col, row });
        burst(col * TILE + TILE / 2, row * TILE + TILE / 2, 14, '#e2a72e', 90, 0.4, 2.5, true);
        Sfx.play('caltrops');
        G.skills.caltrops.cd = COMMANDER_SKILLS.caltrops.cd;
        G.casting = null; G.uiDirty = true;
        return;
      } else {
        Sfx.play('error'); return;
      }
    }
  }

  // Interactive Fuel Cell Detonation
  if (G.fuelCells && !G.casting) {
    const p = canvasPos(e);
    for (const fc of G.fuelCells) {
      if (!fc.dead && Math.hypot(p.x - fc.x, p.y - fc.y) <= fc.r + 8) {
        detonateFuelCell(fc);
        G.placing = null;
        G.uiDirty = true;
        return;
      }
    }
  }

  // Interactive Field Anomalies Clicking (4.0)
  if (G.anomalies && !G.casting) {
    const p = canvasPos(e);
    for (let i = G.anomalies.length - 1; i >= 0; i--) {
      const an = G.anomalies[i];
      if (an.type === 'supply_drop' && Math.hypot(p.x - an.x, p.y - an.y) <= an.r + 10) {
        an.hp -= 30;
        burst(an.x, an.y, 6, '#fbbf24', 80, 0.25, 2.5, true);
        addText(an.x, an.y - 18, '-30 CRACK!', '#fbbf24', 12);
        Sfx.play('hit');
        if (an.hp <= 0) {
          G.anomalies.splice(i, 1);
          G.gold += 160;
          if (typeof addCores === 'function') addCores(10);
          burst(an.x, an.y, 35, '#fbbf24', 180, 0.7, 4, true);
          addRing(an.x, an.y, 10, 60, 0.5, '#fbbf24', 4);
          shake(8);
          Sfx.play('victory');
          addText(an.x, an.y - 25, 'SUPPLY DROP CRACKED: +160G +10 CORES!', '#fbbf24', 16);
        }
        G.uiDirty = true;
        return;
      } else if (an.type === 'smuggler_drone' && Math.hypot(p.x - an.x, p.y - an.y) <= an.r + 14) {
        G.anomalies.splice(i, 1);
        burst(an.x, an.y, 25, '#c084fc', 160, 0.6, 3.5, true);
        addRing(an.x, an.y, 8, 45, 0.45, '#c084fc', 4);
        shake(6);
        Sfx.play('coin');
        showOverlay('smuggler');
        return;
      }
    }
  }

  // Interactive Spore Spires Clicking (Pilar 3)
  if (G.sporeSpires && !G.casting) {
    const p = canvasPos(e);
    for (let i = G.sporeSpires.length - 1; i >= 0; i--) {
      const sp = G.sporeSpires[i];
      if (!sp.dead && Math.hypot(p.x - sp.x, p.y - sp.y) <= 24) {
        sp.hp -= 80;
        burst(sp.x, sp.y, 8, '#84cc16', 80, 0.3, 2.5, true);
        addText(sp.x, sp.y - 20, '-80 STRIKE!', '#84cc16', 13);
        Sfx.play('hit');
        G.uiDirty = true;
        return;
      }
    }
  }

  // Interactive Seismic Pillar Clicking (Pilar 5)
  if (G.seismicPillars && !G.casting) {
    const p = canvasPos(e);
    for (let i = G.seismicPillars.length - 1; i >= 0; i--) {
      const sp = G.seismicPillars[i];
      if (sp.hp > 0 && Math.hypot(p.x - sp.x, p.y - sp.y) <= 24) {
        sp.hp -= 90;
        burst(sp.x, sp.y, 6, '#78716c', 70, 0.25, 2, false);
        addText(sp.x, sp.y - 20, '-90 CRACK!', '#a8a29e', 12);
        Sfx.play('hit');
        G.uiDirty = true;
        return;
      }
    }
  }

  // Interactive Syndicate Gunship Clicking (6.0)
  if (G.syndicateGunship && G.syndicateGunship.active && !G.casting) {
    const p = canvasPos(e);
    if (Math.hypot(p.x - G.syndicateGunship.x, p.y - G.syndicateGunship.y) <= 36) {
      if (!G.syndicateGunship.bribed && !G.syndicateGunship.hostile) {
        showOverlay('syndicate');
        return;
      }
    }
  }

  // Interactive Alien Corpse Reclaiming (6.0)
  if (G.corpses && G.corpses.length > 0 && !G.casting && !G.placing) {
    const p = canvasPos(e);
    for (let i = G.corpses.length - 1; i >= 0; i--) {
      const cp = G.corpses[i];
      if (Math.hypot(p.x - cp.x, p.y - cp.y) <= 22) {
        reclaimCorpse(i);
        G.uiDirty = true;
        return;
      }
    }
  }

  // 9.0 Deployable Road Barricade Clicking
  if (G.barricades && G.barricades.length > 0 && !G.casting && !G.placing && !G.placingMegastructure && !G.placingBarricade) {
    const p = canvasPos(e);
    for (const bar of G.barricades) {
      if (Math.hypot(p.x - bar.x, p.y - bar.y) <= 24 || (G.hover && G.hover.c === bar.c && G.hover.r === bar.r)) {
        G.sel = bar;
        Sfx.play('click');
        G.uiDirty = true;
        return;
      }
    }
  }

  // 9.0 Destructible Crag Clicking
  if (G.destructibleCrags && !G.casting && !G.placing) {
    const p = canvasPos(e);
    for (const crag of G.destructibleCrags) {
      if (Math.hypot(p.x - crag.x, p.y - crag.y) <= 24) {
        G.sel = crag;
        Sfx.play('click');
        G.uiDirty = true;
        return;
      }
    }
  }

  // 9.0 Nemesis Boss Clicking
  if (G.enemies && !G.casting && !G.placing) {
    const p = canvasPos(e);
    for (const en of G.enemies) {
      if (!en.dead && en.isNemesis && Math.hypot(p.x - en.x, p.y - en.y) <= (en.r || 24) + 6) {
        G.sel = en;
        Sfx.play('click');
        G.uiDirty = true;
        return;
      }
    }
  }

  // Neural Synapse Connecting (6.0)
  if (G.synapseSource && G.hover) {
    const { c, r } = G.hover;
    const targetT = G.grid[r][c];
    if (targetT && targetT !== G.synapseSource) {
      createNeuralSynapse(G.synapseSource, targetT);
      G.synapseSource = null;
      G.uiDirty = true;
      return;
    } else if (targetT === G.synapseSource) {
      G.synapseSource = null;
      G.uiDirty = true;
      return;
    }
  }

  if (!G.hover) return;
  const { c, r } = G.hover;
  if (G.placingMegastructure) {
    if (typeof placeMegastructure === 'function') {
      const ms = placeMegastructure(c, r, G.placingMegastructure);
      if (ms) {
        if (!e.shiftKey) G.placingMegastructure = null;
        G.sel = ms;
        G.uiDirty = true;
      }
    }
    return;
  }
  if (G.placingBarricade) {
    if (typeof placeBarricade === 'function' && typeof pathTile !== 'undefined' && pathTile[r] && pathTile[r][c]) {
      const bar = placeBarricade(c, r);
      if (bar) {
        if (!e.shiftKey) G.placingBarricade = null;
        G.sel = bar;
        G.uiDirty = true;
      }
    } else {
      Sfx.play('error');
    }
    return;
  }
  if (G.placing) {
    if (pathTile[r][c] || G.grid[r][c]) { Sfx.play('error'); return; }
    const t = placeTower(c, r, G.placing);
    if (t) { if (!e.shiftKey) G.placing = null; G.sel = e.shiftKey ? null : t; G.uiDirty = true; }
    return;
  }
  const t = G.grid[r][c];
  if (t) { G.sel = t; Sfx.play('click'); } else G.sel = null;
  G.uiDirty = true;
}
function onKey(e) {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const k = e.key;
  if (!G) return;
  if (G.state === 'menu') { if (e.code === 'Space' || k === 'Enter') { e.preventDefault(); begin(); } return; }

  // 7.0 Titan Mech Pilot Toggle [Tab]
  if (k === 'Tab' || e.code === 'Tab') {
    e.preventDefault();
    if (typeof toggleMechPilot === 'function') toggleMechPilot();
    return;
  }

  // 7.0 Titan Mech Thermal Blade [Space]
  if (e.code === 'Space') {
    e.preventDefault();
    if (e.repeat) return;
    if (G.mech && G.mech.active) {
      if (typeof mechSwingBlade === 'function') mechSwingBlade();
      return;
    }
    if (G.state === 'over' || G.state === 'victory' || G.drafting) return;
    if (G.paused) togglePause();
    else if (G.state === 'prep') callWave();
    else togglePause();
    return;
  }

  // 7.0 Titan Mech WASD Movement Keys
  const lk = k.toLowerCase();
  if (['w', 'a', 's', 'd'].includes(lk)) {
    if (G.mech && G.mech.active) {
      if (!G.mechKeys) G.mechKeys = { w: false, a: false, s: false, d: false };
      G.mechKeys[lk] = true;
      return;
    }
  }

  if (G.state !== 'prep' && G.state !== 'active') return;
  if (k >= '1' && k <= '6') { selectShop(TKEYS[Number(k) - 1]); return; }
  const doc = (typeof COMMANDER_DOCTRINES !== 'undefined' && COMMANDER_DOCTRINES[G.doctrine]) || (typeof COMMANDER_DOCTRINES !== 'undefined' && COMMANDER_DOCTRINES.vanguard) || { skills: ['orbital', 'minefield', 'sabot_rounds', 'carpet_bomb'] };
  const dSkills = doc.skills;
  switch (k) {
    case 'q': case 'Q': if (dSkills[0]) triggerSkill(dSkills[0]); break;
    case 'w': case 'W': if (dSkills[1]) triggerSkill(dSkills[1]); break;
    case 'e': case 'E': {
      if (G.grapplePrompt && G.grapplePrompt.boss && typeof mechGrappleStrike === 'function') {
        mechGrappleStrike(G.grapplePrompt.boss);
        break;
      }
      if (dSkills[2]) triggerSkill(dSkills[2]);
      break;
    }
    case 'r': case 'R': if (dSkills[3]) triggerSkill(dSkills[3]); break;
    case 'g': case 'G': {
      const ov = $('overlay');
      const isOpen = ov && ov.classList.contains('show') && ov.innerHTML.includes('GENE-SPLICING');
      showOverlay(isOpen ? (G && G.state === 'menu' ? 'menu' : null) : 'gene_lab');
      break;
    }
    case 'b': case 'B': {
      const ov = $('overlay');
      const isOpen = ov && ov.classList.contains('show') && ov.innerHTML.includes('WORKSHOP');
      showOverlay(isOpen ? (G && G.state === 'menu' ? 'menu' : null) : 'workshop');
      break;
    }
    case 'c': case 'C': {
      const ov = $('overlay');
      const isOpen = ov && ov.classList.contains('show') && ov.innerHTML.includes('CODEX');
      showOverlay(isOpen ? (G && G.state === 'menu' ? 'menu' : null) : 'codex');
      break;
    }
    case 't': case 'T': {
      const ov = $('overlay');
      const isOpen = ov && ov.classList.contains('show') && ov.innerHTML.includes('MATRIX');
      showOverlay(isOpen ? (G && G.state === 'menu' ? 'menu' : null) : 'matrix');
      break;
    }
    case 'h': case 'H': if (typeof triggerThermalPurge === 'function') triggerThermalPurge(); break;
    case 'v': case 'V': if (typeof triggerCoreOverload === 'function') triggerCoreOverload(); break;
    case 'z': case 'Z': if (typeof triggerChronoRewind === 'function') triggerChronoRewind(); break;
    case 'n': case 'N': {
      if (G.sel) {
        G.synapseSource = G.synapseSource === G.sel ? null : G.sel;
        if (G.synapseSource) {
          addText(G.sel.x, G.sel.y - 25, 'SELECT TARGET TOWER [N]', '#ec4899', 12);
        }
        G.uiDirty = true;
      }
      break;
    }
    case 'Escape': G.placing = null; G.placingMegastructure = null; G.placingBarricade = null; G.sel = null; G.casting = null; G.uiDirty = true; break;
    case 'p': case 'P': togglePause(); break;
    case 'm': case 'M': toggleMute(); break;
    case 'f': case 'F': setSpeed(G.speed % 3 + 1); break;
    case 'u': case 'U':
      if (G.sel) {
        if (G.sel.hp !== undefined && G.sel.c !== undefined && G.sel.roadC === undefined) {
          const repBtn = document.querySelector('button[data-act="repair_barricade"]');
          if (repBtn) repBtn.click();
        } else if (typeof MEGASTRUCTURE_CONFIG !== 'undefined' && MEGASTRUCTURE_CONFIG[G.sel.type]) {
          const repBtn = document.querySelector('button[data-act="repair_mega"]');
          if (repBtn) {
            repBtn.click();
          } else {
            const ocBtn = document.querySelector('button[data-act="overclock_mega"]');
            if (ocBtn) ocBtn.click();
          }
        } else {
          upgradeTower(G.sel);
        }
      }
      break;
    case 'x': case 'X': case 'Delete':
      if (G.sel) {
        if (G.sel.hp !== undefined && G.sel.c !== undefined && G.sel.roadC === undefined) {
          const salBtn = document.querySelector('button[data-act="dismantle_barricade"]');
          if (salBtn) salBtn.click();
        } else if (typeof MEGASTRUCTURE_CONFIG !== 'undefined' && MEGASTRUCTURE_CONFIG[G.sel.type]) {
          const disBtn = document.querySelector('button[data-act="dismantle_mega"]');
          if (disBtn) disBtn.click();
        } else {
          sellTower(G.sel);
        }
      }
      break;
  }
}
function onKeyUp(e) {
  if (e.code === 'Space') e.preventDefault();
  const lk = e.key ? e.key.toLowerCase() : '';
  if (G && G.mechKeys && ['w', 'a', 's', 'd'].includes(lk)) {
    G.mechKeys[lk] = false;
  }
}
function fit() {
  const st = $('stage'), wrap = $('canvasWrap'), narrow = window.innerWidth <= 980;
  const aw = st.clientWidth, ah = narrow ? 1e5 : st.clientHeight;
  const w = Math.max(280, Math.min(aw, ah * W / H));
  wrap.style.width = Math.floor(w) + 'px'; wrap.style.height = Math.floor(w * H / W) + 'px';
}
