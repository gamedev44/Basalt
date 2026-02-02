/**
 * Basalt Weapon Wheel — GTA 5 style radial weapon select menu
 * Hold Tab to open, mouse angle selects, release to equip.
 */

import { WEAPON_DEFINITIONS, WEAPON_SLOT } from '../Weapons/weapon-switch-component.js';

export function createWeaponWheel(config, onSelect) {
  const container = document.createElement('div');
  container.id = 'weapon-wheel';
  container.className = 'weapon-wheel';
  container.style.cssText = `
    position: fixed;
    inset: 0;
    display: none;
    align-items: center;
    justify-content: center;
    background: rgba(0,0,0,0.5);
    z-index: 300;
    pointer-events: auto;
  `;

  const wheel = document.createElement('div');
  wheel.className = 'weapon-wheel-inner';
  wheel.style.cssText = `
    width: 280px;
    height: 280px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(30,30,35,0.95) 0%, rgba(20,20,25,0.98) 100%);
    border: 2px solid rgba(255,255,255,0.2);
    position: relative;
    pointer-events: auto;
  `;

  const weapons = [WEAPON_SLOT.RIFLE, WEAPON_SLOT.PISTOL];
  const count = weapons.length;

  weapons.forEach((slot, i) => {
    const def = WEAPON_DEFINITIONS[slot];
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
    const radius = 100;
    const x = 50 + (radius * Math.cos(angle)) / 2.8;
    const y = 50 + (radius * Math.sin(angle)) / 2.8;

    const btn = document.createElement('div');
    btn.className = 'weapon-wheel-item';
    btn.dataset.slot = slot;
    btn.style.cssText = `
      position: absolute;
      left: ${x}%;
      top: ${y}%;
      transform: translate(-50%, -50%);
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: rgba(60,60,70,0.8);
      border: 2px solid rgba(255,255,255,0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 11px;
      font-family: 'Segoe UI', sans-serif;
      text-align: center;
      cursor: pointer;
      transition: all 0.15s;
    `;
    btn.textContent = def?.name?.split(' ')[0] ?? slot;
    btn.onmouseenter = () => { btn.style.background = 'rgba(80,120,180,0.6)'; btn.style.borderColor = 'rgba(255,255,255,0.4)'; };
    btn.onmouseleave = () => { btn.style.background = 'rgba(60,60,70,0.8)'; btn.style.borderColor = 'rgba(255,255,255,0.15)'; };
    btn.onclick = () => { onSelect?.(slot); hide(); };
    wheel.appendChild(btn);
  });

  const center = document.createElement('div');
  center.style.cssText = `
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    color: rgba(255,255,255,0.5);
    font-size: 10px;
    pointer-events: none;
  `;
  center.textContent = 'SELECT';
  wheel.appendChild(center);

  container.appendChild(wheel);
  document.body.appendChild(container);

  let lastMouseX = 0;
  let lastMouseY = 0;
  const onMouseMove = (e) => {
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
  };

  function show() {
    container.style.display = 'flex';
    lastMouseX = window.innerWidth / 2;
    lastMouseY = window.innerHeight / 2;
    window.addEventListener('mousemove', onMouseMove);
  }

  function hide() {
    container.style.display = 'none';
    window.removeEventListener('mousemove', onMouseMove);
  }

  function getHoveredSlot(mouseX, mouseY) {
    const rect = wheel.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = mouseX - cx;
    const dy = mouseY - cy;
    const angle = Math.atan2(dy, dx) + Math.PI / 2;
    const normalized = (angle + Math.PI * 2) % (Math.PI * 2);
    const idx = Math.round((normalized / (Math.PI * 2)) * count) % count;
    return weapons[idx];
  }

  return {
    container,
    show,
    hide,
    getHoveredSlot,
    get lastMouseX() { return lastMouseX; },
    get lastMouseY() { return lastMouseY; },
    isVisible: () => container.style.display === 'flex',
  };
}
