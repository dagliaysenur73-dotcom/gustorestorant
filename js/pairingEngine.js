// js/pairingEngine.js - Smart Pairing Engine & "Surprise Me" Dual Match Algorithmic Selector

import { CULINARY_ITEMS } from '../data.js';
import { store } from './state.js';

/**
 * Intelligent Hero Pairing Showcase / Random Pairing Generator
 */
export function generateSurprisePairing(heroPairingDisplay) {
  if (!heroPairingDisplay) return;

  // Select a main/seafood dish
  const mains = CULINARY_ITEMS.filter(i => i.category === 'food' || i.category === 'seafood' || i.category === 'poultry');
  const randomMain = mains[Math.floor(Math.random() * mains.length)];

  // Look for ideal paired drink or meze
  let pairedItem = null;
  if (randomMain.recommendedPairingIds && randomMain.recommendedPairingIds.length > 0) {
    const pairId = randomMain.recommendedPairingIds[Math.floor(Math.random() * randomMain.recommendedPairingIds.length)];
    pairedItem = CULINARY_ITEMS.find(i => i.id === pairId);
  }

  // Fallback to random beverage or appetizer
  if (!pairedItem) {
    const others = CULINARY_ITEMS.filter(i => i.category === 'beverages' || i.category === 'appetizers');
    pairedItem = others[Math.floor(Math.random() * others.length)];
  }

  heroPairingDisplay.innerHTML = `
    <div class="match-item" style="cursor:pointer;" id="heroPairMain">
      <img src="${randomMain.image}" alt="${randomMain.title}" class="match-thumb">
      <div class="match-details">
        <h4>${randomMain.title}</h4>
        <p>${randomMain.currency}${randomMain.price} • ${randomMain.category.toUpperCase()}</p>
      </div>
    </div>
    <div class="match-icon-link">✦</div>
    <div class="match-item" style="cursor:pointer;" id="heroPairSecond">
      <img src="${pairedItem.image}" alt="${pairedItem.title}" class="match-thumb">
      <div class="match-details">
        <h4>${pairedItem.title}</h4>
        <p>${pairedItem.currency}${pairedItem.price} • ${pairedItem.category.toUpperCase()}</p>
      </div>
    </div>
  `;

  const mainEl = document.getElementById('heroPairMain');
  const secondEl = document.getElementById('heroPairSecond');
  if (mainEl) mainEl.onclick = () => store.openModal(randomMain);
  if (secondEl) secondEl.onclick = () => store.openModal(pairedItem);
}

