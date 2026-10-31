// app.js - Application Entry Point & Module Coordinator

import { store } from './js/state.js';
import { generateSurprisePairing } from './js/pairingEngine.js';
import { fetchLiveInternetItem } from './js/liveApi.js';
import {
  showToast,
  initializeFilters,
  renderItems,
  renderModal,
  renderFavorites,
  updateMainSearchVisualDropdown,
  updateOriginVisualDropdown
} from './js/uiRenderer.js';

/**
 * Cached DOM Elements
 */
const elements = {
  body: document.body,
  categoryNav: document.getElementById('categoryNav'),
  moodContainer: document.getElementById('moodFilterContainer'),
  itemsGrid: document.getElementById('itemsGrid'),
  resultsCount: document.getElementById('resultsCount'),
  searchInput: document.getElementById('searchInput'),
  searchClearBtn: document.getElementById('searchClearBtn'),
  mainSearchBtn: document.getElementById('mainSearchBtn'),
  originSearchInput: document.getElementById('originSearchInput'),
  originClearBtn: document.getElementById('originClearBtn'),
  originSearchBtn: document.getElementById('originSearchBtn'),
  originChipsContainer: document.getElementById('originChipsContainer'),
  searchVisualDropdown: document.getElementById('searchVisualDropdown'),
  originVisualDropdown: document.getElementById('originVisualDropdown'),
  favBadge: document.getElementById('favBadge'),
  favToggleBtn: document.getElementById('favToggleBtn'),
  favDrawer: document.getElementById('favoritesDrawer'),
  favCloseBtn: document.getElementById('favCloseBtn'),
  favList: document.getElementById('favList'),
  toastNotice: document.getElementById('toastNotice'),
  heroPairingDisplay: document.getElementById('heroPairingDisplay'),
  surprisePairingBtn: document.getElementById('surprisePairingBtn'),
  liveFetchBtn: document.getElementById('liveFetchBtn'),
  liveStatusText: document.getElementById('liveStatusText'),
  glowSlider: document.getElementById('glowIntensitySlider'),
  glowToggleBtn: document.getElementById('glowToggleBtn'),
  themeToggleBtn: document.getElementById('themeToggleBtn'),
  themeIcon: document.getElementById('themeModeIcon'),
  brandReset: document.getElementById('brandReset'),
  // Modal Elements
  modalElements: {
    modalBackdrop: document.getElementById('dishModalBackdrop'),
    modalCloseBtn: document.getElementById('modalCloseBtn'),
    modalImg: document.getElementById('modalImg'),
    modalCategory: document.getElementById('modalCategory'),
    modalPrice: document.getElementById('modalPrice'),
    modalTitle: document.getElementById('modalTitle'),
    modalTagline: document.getElementById('modalTagline'),
    modalSpecs: document.getElementById('modalSpecs'),
    modalFlavorBars: document.getElementById('modalFlavorBars'),
    modalChefSecret: document.getElementById('modalChefSecret'),
    modalPairingsGrid: document.getElementById('modalPairingsGrid')
  }
};

/**
 * Toast Helper
 */
const triggerToast = (msg) => showToast(elements.toastNotice, msg);

/**
 * Re-render Cards
 */
const refreshCards = () => {
  renderItems(
    elements.itemsGrid,
    elements.resultsCount,
    elements.searchInput,
    elements.originSearchInput,
    elements.toastNotice
  );
};

/**
 * Update Dynamic Category Palette
 */
function updateDynamicTheme() {
  elements.body.setAttribute('data-category', store.state.activeCategory);
}

/**
 * State Change Listener
 */
store.subscribe((state, changedProp) => {
  if (changedProp === 'category') {
    updateDynamicTheme();
    elements.categoryNav.querySelectorAll('.cat-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.category === state.activeCategory);
    });
    refreshCards();
  }

  if (changedProp === 'mood') {
    elements.moodContainer.querySelectorAll('.mood-chip').forEach(chip => {
      chip.classList.toggle('active', chip.dataset.mood === state.activeMood);
    });
    refreshCards();
  }

  if (changedProp === 'search') {
    elements.searchClearBtn.classList.toggle('visible', !!state.searchQuery);
    refreshCards();
  }

  if (changedProp === 'origin') {
    elements.originClearBtn.classList.toggle('visible', !!state.originQuery);
    if (elements.originChipsContainer) {
      elements.originChipsContainer.querySelectorAll('.origin-pill').forEach(pill => {
        const pillOrigin = pill.dataset.origin;
        if (!state.originQuery || state.originQuery === 'all') {
          pill.classList.toggle('active', pillOrigin === 'all');
        } else {
          pill.classList.toggle('active', pillOrigin.toLowerCase() === state.originQuery.toLowerCase());
        }
      });
    }
    refreshCards();
  }

  if (changedProp === 'favorites') {
    renderFavorites(elements.favBadge, elements.favList, elements.toastNotice);
    refreshCards();
  }

  if (changedProp === 'modal') {
    renderModal(elements.modalElements, state.selectedItemModal);
  }

  if (changedProp === 'theme') {
    elements.body.classList.toggle('light-theme', state.themeMode === 'light');
    if (elements.themeIcon) {
      elements.themeIcon.textContent = state.themeMode === 'light' ? '☀️' : '🌙';
    }
  }

  if (changedProp === 'glow') {
    const opacity = state.glowIntensity / 100;
    document.documentElement.style.setProperty('--glow-opacity', opacity);
    if (elements.glowSlider) elements.glowSlider.value = state.glowIntensity;
    if (elements.glowToggleBtn) {
      elements.glowToggleBtn.textContent = state.glowIntensity === 0 ? '🌑' : '💡';
    }
  }
});

/**
 * Event Listeners & Interactions Setup
 */
function setupEventHandlers() {
  // Main Search Input
  elements.searchInput.addEventListener('input', (e) => {
    store.setSearch(e.target.value);
    updateMainSearchVisualDropdown(elements.searchVisualDropdown, e.target.value);
  });

  elements.searchInput.addEventListener('focus', (e) => {
    if (e.target.value) updateMainSearchVisualDropdown(elements.searchVisualDropdown, e.target.value);
  });

  elements.searchClearBtn.addEventListener('click', () => {
    elements.searchInput.value = '';
    store.setSearch('');
    updateMainSearchVisualDropdown(elements.searchVisualDropdown, '');
    elements.searchInput.focus();
  });

  // Main Magnifying Glass Button Click
  if (elements.mainSearchBtn) {
    elements.mainSearchBtn.addEventListener('click', () => {
      elements.searchInput.focus();
      updateMainSearchVisualDropdown(elements.searchVisualDropdown, elements.searchInput.value || ' ');
      triggerToast('🔍 Lezzet araması tetiklendi');
    });
  }

  // Dedicated Origin Search Input
  if (elements.originSearchInput) {
    elements.originSearchInput.addEventListener('input', (e) => {
      store.setOriginSearch(e.target.value);
      updateOriginVisualDropdown(elements.originVisualDropdown, e.target.value);
    });

    elements.originSearchInput.addEventListener('focus', (e) => {
      if (e.target.value) updateOriginVisualDropdown(elements.originVisualDropdown, e.target.value);
    });
  }

  // Origin Magnifying Glass Button Click
  if (elements.originSearchBtn) {
    elements.originSearchBtn.addEventListener('click', () => {
      elements.originSearchInput.focus();
      updateOriginVisualDropdown(elements.originVisualDropdown, elements.originSearchInput.value || ' ');
      triggerToast('📍 Yöre araması tetiklendi');
    });
  }

  if (elements.originClearBtn) {
    elements.originClearBtn.addEventListener('click', () => {
      elements.originSearchInput.value = '';
      store.setOriginSearch('');
      updateOriginVisualDropdown(elements.originVisualDropdown, '');
      elements.originSearchInput.focus();
    });
  }

  // Origin Quick Filter Pills
  if (elements.originChipsContainer) {
    elements.originChipsContainer.querySelectorAll('.origin-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        const originVal = pill.dataset.origin;
        if (originVal === 'all') {
          elements.originSearchInput.value = '';
          store.setOriginSearch('');
          updateOriginVisualDropdown(elements.originVisualDropdown, '');
        } else {
          elements.originSearchInput.value = originVal;
          store.setOriginSearch(originVal);
          updateOriginVisualDropdown(elements.originVisualDropdown, originVal);
        }
      });
    });
  }

  // Dismiss dropdowns on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-bar-wrapper')) {
      if (elements.searchVisualDropdown) elements.searchVisualDropdown.classList.remove('active');
      if (elements.originVisualDropdown) elements.originVisualDropdown.classList.remove('active');
    }
  });

  // Live Internet API Fetch Button
  if (elements.liveFetchBtn) {
    elements.liveFetchBtn.addEventListener('click', () => {
      fetchLiveInternetItem(elements.liveStatusText, refreshCards, triggerToast);
    });
  }

  // Surprise Me Pairing Button
  elements.surprisePairingBtn.addEventListener('click', () => {
    generateSurprisePairing(elements.heroPairingDisplay);
    triggerToast('🎲 Yeni bir gurme eşleşme önerildi!');
  });

  // Favorites Drawer Toggles
  elements.favToggleBtn.addEventListener('click', () => {
    elements.favDrawer.classList.add('open');
    elements.favDrawer.setAttribute('aria-hidden', 'false');
  });

  elements.favCloseBtn.addEventListener('click', () => {
    elements.favDrawer.classList.remove('open');
    elements.favDrawer.setAttribute('aria-hidden', 'true');
  });

  // Modal Backdrop Close
  elements.modalElements.modalCloseBtn.addEventListener('click', () => store.closeModal());
  elements.modalElements.modalBackdrop.addEventListener('click', (e) => {
    if (e.target === elements.modalElements.modalBackdrop) {
      store.closeModal();
    }
  });

  // Brand Reset
  elements.brandReset.addEventListener('click', (e) => {
    e.preventDefault();
    elements.searchInput.value = '';
    if (elements.originSearchInput) elements.originSearchInput.value = '';
    store.setSearch('');
    store.setOriginSearch('');
    store.setCategory('all');
    store.setMood('all');
    updateMainSearchVisualDropdown(elements.searchVisualDropdown, '');
    updateOriginVisualDropdown(elements.originVisualDropdown, '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Dark / Light Theme Toggle
  if (elements.themeToggleBtn) {
    elements.themeToggleBtn.addEventListener('click', () => {
      const isLight = store.state.themeMode !== 'light';
      store.setTheme(isLight);
      triggerToast(isLight ? 'Aydınlık moda geçildi ☀️' : 'Karanlık moda geçildi 🌙');
    });

    if (store.state.themeMode === 'light') {
      elements.body.classList.add('light-theme');
      if (elements.themeIcon) elements.themeIcon.textContent = '☀️';
    }
  }

  // Glow Slider & Toggle
  if (elements.glowSlider) {
    elements.glowSlider.value = store.state.glowIntensity;
    document.documentElement.style.setProperty('--glow-opacity', store.state.glowIntensity / 100);

    elements.glowSlider.addEventListener('input', (e) => {
      store.setGlowIntensity(parseInt(e.target.value, 10));
    });
  }

  if (elements.glowToggleBtn) {
    elements.glowToggleBtn.addEventListener('click', () => {
      if (store.state.glowIntensity > 0) {
        store.setGlowIntensity(0);
        triggerToast('Arka plan ışıkları kapatıldı 🌑');
      } else {
        store.setGlowIntensity(70);
        triggerToast('Arka plan ışıkları açıldı ✨');
      }
    });
  }

  // Global Escape Key Listener
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      store.closeModal();
      elements.favDrawer.classList.remove('open');
      elements.favDrawer.setAttribute('aria-hidden', 'true');
      if (elements.searchVisualDropdown) elements.searchVisualDropdown.classList.remove('active');
      if (elements.originVisualDropdown) elements.originVisualDropdown.classList.remove('active');
    }
  });
}

// Application Bootstrap
document.addEventListener('DOMContentLoaded', () => {
  initializeFilters(elements.categoryNav, elements.moodContainer);
  renderFavorites(elements.favBadge, elements.favList, elements.toastNotice);
  refreshCards();
  generateSurprisePairing(elements.heroPairingDisplay);
  setupEventHandlers();
  updateDynamicTheme();
});
