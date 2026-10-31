// js/state.js - Reactive State Store using Observer Pattern

export class StateManager {
  constructor() {
    this.state = {
      activeCategory: 'all',
      searchQuery: '',
      originQuery: '',
      activeMood: 'all',
      favorites: this.loadFavorites(),
      selectedItemModal: null,
      themeMode: localStorage.getItem('gusto_theme') || 'dark',
      glowIntensity: parseInt(localStorage.getItem('gusto_glow_intensity') || '70', 10)
    };
    this.listeners = [];
  }

  loadFavorites() {
    try {
      const stored = localStorage.getItem('gusto_favorites');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  saveFavorites() {
    localStorage.setItem('gusto_favorites', JSON.stringify(this.state.favorites));
  }

  subscribe(listener) {
    this.listeners.push(listener);
  }

  notify(changedProp) {
    this.listeners.forEach(fn => fn(this.state, changedProp));
  }

  setCategory(catId) {
    this.state.activeCategory = catId;
    this.notify('category');
  }

  setSearch(query) {
    this.state.searchQuery = query.trim();
    this.notify('search');
  }

  setOriginSearch(origin) {
    this.state.originQuery = origin.trim();
    this.notify('origin');
  }

  setMood(moodId) {
    this.state.activeMood = moodId;
    this.notify('mood');
  }

  toggleFavorite(itemId) {
    const idx = this.state.favorites.indexOf(itemId);
    if (idx > -1) {
      this.state.favorites.splice(idx, 1);
    } else {
      this.state.favorites.push(itemId);
    }
    this.saveFavorites();
    this.notify('favorites');
  }

  openModal(item) {
    this.state.selectedItemModal = item;
    this.notify('modal');
  }

  closeModal() {
    this.state.selectedItemModal = null;
    this.notify('modal');
  }

  setTheme(isLight) {
    this.state.themeMode = isLight ? 'light' : 'dark';
    localStorage.setItem('gusto_theme', this.state.themeMode);
    this.notify('theme');
  }

  setGlowIntensity(val) {
    this.state.glowIntensity = val;
    localStorage.setItem('gusto_glow_intensity', val);
    this.notify('glow');
  }
}

export const store = new StateManager();

