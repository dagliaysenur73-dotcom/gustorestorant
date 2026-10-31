// js/uiRenderer.js - Modular DOM Rendering for Cards, Modals, Drawers & Visual Dropdowns

import { CATEGORIES, CULINARY_ITEMS, MOOD_PRESETS } from '../data.js';
import { store } from './state.js';
import { getFilteredItems, normalizeSearchText, fuzzyMatch } from './searchEngine.js';

/**
 * Render Toast Notification
 */
export function showToast(toastEl, message) {
  if (!toastEl) return;
  toastEl.textContent = message;
  toastEl.classList.add('show');
  setTimeout(() => {
    toastEl.classList.remove('show');
  }, 2600);
}

/**
 * Initialize Category Tabs and Mood Chips
 */
export function initializeFilters(categoryNav, moodContainer) {
  if (categoryNav) {
    categoryNav.innerHTML = '';
    Object.values(CATEGORIES).forEach(cat => {
      const btn = document.createElement('button');
      btn.className = `cat-btn ${cat.id === store.state.activeCategory ? 'active' : ''}`;
      btn.dataset.category = cat.id;
      btn.innerHTML = `<span>${cat.icon}</span> <span>${cat.label}</span>`;
      btn.addEventListener('click', () => {
        store.setCategory(cat.id);
      });
      categoryNav.appendChild(btn);
    });
  }

  if (moodContainer) {
    moodContainer.querySelectorAll('.mood-chip').forEach(el => el.remove());
    MOOD_PRESETS.forEach(mood => {
      const chip = document.createElement('button');
      chip.className = `mood-chip ${mood.id === store.state.activeMood ? 'active' : ''}`;
      chip.dataset.mood = mood.id;
      chip.innerHTML = `${mood.icon} ${mood.label}`;
      chip.addEventListener('click', () => {
        store.setMood(mood.id);
      });
      moodContainer.appendChild(chip);
    });
  }
}

/**
 * Render Discovery Grid
 */
export function renderItems(itemsGrid, resultsCount, searchInput, originSearchInput, toastEl) {
  const filtered = getFilteredItems();
  if (resultsCount) {
    resultsCount.innerHTML = `Toplam <span>${filtered.length}</span> benzersiz lezzet listeleniyor`;
  }

  if (filtered.length === 0) {
    itemsGrid.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🍽️</div>
        <h3 class="empty-state-title">Eşleşen Lezzet Bulunamadı</h3>
        <p class="empty-state-text">Aradığınız kriterlere uygun yemek ya da içecek henüz eklenmemiş olabilir. Aramanızı temizleyip farklı bir kategori deneyin.</p>
        <button class="cat-btn" style="display:inline-flex; margin:0 auto;" id="emptyResetBtn">
          Tümünü Göster
        </button>
      </div>
    `;
    const resetBtn = document.getElementById('emptyResetBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (searchInput) searchInput.value = '';
        if (originSearchInput) originSearchInput.value = '';
        store.setSearch('');
        store.setOriginSearch('');
        store.setCategory('all');
        store.setMood('all');
      });
    }
    return;
  }

  itemsGrid.innerHTML = filtered.map(item => {
    const isFav = store.state.favorites.includes(item.id);
    const catObj = Object.values(CATEGORIES).find(c => c.id === item.category) || CATEGORIES.ALL;

    return `
      <article class="dish-card" data-id="${item.id}" tabindex="0" aria-label="${item.title}">
        <div class="dish-card-media">
          <img src="${item.image}" alt="${item.title}" class="dish-image" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80'">
          <span class="dish-badge-origin">📍 ${item.origin}</span>
          <button class="dish-fav-btn ${isFav ? 'favorited' : ''}" data-fav-id="${item.id}" title="${isFav ? 'Favorilerden çıkar' : 'Favorilere ekle'}">
            ${isFav ? '❤️' : '🤍'}
          </button>
        </div>
        <div class="dish-content">
          <div class="dish-meta-row">
            <span class="dish-category-label">${catObj.icon} ${catObj.label}</span>
            <span class="dish-price">${item.currency}${item.price}</span>
          </div>
          <h3 class="dish-title">${item.title}</h3>
          <p class="dish-tagline">${item.tagline}</p>
          
          <div class="dish-mini-flavor">
            <span style="color:var(--text-muted)">Aroma Profili:</span>
            <div class="flavor-dot-group">
              <span class="flavor-dot-item" title="Umami Seviyesi: %${item.flavorProfile.umami}"><span class="flavor-dot" style="opacity: ${item.flavorProfile.umami / 100}"></span> Umami</span>
              <span class="flavor-dot-item" title="Ferahlık/Asidite: %${item.flavorProfile.acidity}"><span class="flavor-dot" style="opacity: ${item.flavorProfile.acidity / 100}; background:#0ea5e9;"></span> Asidite</span>
              <span class="flavor-dot-item" title="Baharat/Acılık: %${item.flavorProfile.spice}"><span class="flavor-dot" style="opacity: ${item.flavorProfile.spice / 100}; background:#ef4444;"></span> Baharat</span>
            </div>
          </div>

          <div class="dish-tags">
            ${item.dietary.map(d => `<span class="tag-badge">${d}</span>`).join('')}
            <span class="tag-badge">⏱️ ${item.prepTime}</span>
          </div>
        </div>
      </article>
    `;
  }).join('');

  // Attach card click handlers
  itemsGrid.querySelectorAll('.dish-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.dish-fav-btn')) return;
      const id = card.dataset.id;
      const item = CULINARY_ITEMS.find(i => i.id === id);
      if (item) store.openModal(item);
    });

    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        if (!e.target.closest('.dish-fav-btn')) {
          e.preventDefault();
          const id = card.dataset.id;
          const item = CULINARY_ITEMS.find(i => i.id === id);
          if (item) store.openModal(item);
        }
      }
    });
  });

  // Attach favorite toggles inside cards
  itemsGrid.querySelectorAll('.dish-fav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.favId;
      store.toggleFavorite(id);
      const isNowFav = store.state.favorites.includes(id);
      showToast(toastEl, isNowFav ? 'Favorilere eklendi ❤️' : 'Favorilerden çıkarıldı 🤍');
    });
  });
}

/**
 * Render Detail Modal
 */
export function renderModal(modalElements, item) {
  const { modalBackdrop, modalImg, modalCategory, modalPrice, modalTitle, modalTagline, modalSpecs, modalFlavorBars, modalChefSecret, modalPairingsGrid } = modalElements;

  if (!item) {
    modalBackdrop.classList.remove('open');
    modalBackdrop.setAttribute('aria-hidden', 'true');
    return;
  }

  const catObj = Object.values(CATEGORIES).find(c => c.id === item.category) || CATEGORIES.ALL;

  modalImg.src = item.image;
  modalImg.alt = item.title;
  modalCategory.textContent = `${catObj.icon} ${catObj.label.toUpperCase()}`;
  modalPrice.textContent = `${item.currency}${item.price}`;
  modalTitle.textContent = item.title;
  modalTagline.textContent = `${item.tagline} • Köken: ${item.origin}`;

  modalSpecs.innerHTML = `
    <div class="spec-card">
      <div class="spec-label">Hazırlık Süresi</div>
      <div class="spec-val">⏱️ ${item.prepTime}</div>
    </div>
    <div class="spec-card">
      <div class="spec-label">Servis Sıcaklığı</div>
      <div class="spec-val">🌡️ ${item.servingTemp}</div>
    </div>
    <div class="spec-card">
      <div class="spec-label">Kalori Değeri</div>
      <div class="spec-val">🔥 ${item.calories}</div>
    </div>
  `;

  const flavors = [
    { name: 'Umami / Derinlik', val: item.flavorProfile.umami, color: '#f59e0b' },
    { name: 'Asidite / Ferahlık', val: item.flavorProfile.acidity, color: '#0ea5e9' },
    { name: 'Baharat & Acı', val: item.flavorProfile.spice, color: '#ef4444' },
    { name: 'Tatlılık Nüansı', val: item.flavorProfile.sweetness, color: '#ec4899' },
    { name: 'Gövde & Yoğunluk', val: item.flavorProfile.richness, color: '#8b5cf6' }
  ];

  modalFlavorBars.innerHTML = flavors.map(f => `
    <div class="flavor-bar-item">
      <span class="flavor-name">${f.name}</span>
      <div class="progress-track">
        <div class="progress-fill" style="width: ${f.val}%; background: ${f.color}"></div>
      </div>
      <span class="flavor-value">%${f.val}</span>
    </div>
  `).join('');

  modalChefSecret.textContent = item.chefSecret;

  const recommendedPairings = (item.recommendedPairingIds || [])
    .map(pId => CULINARY_ITEMS.find(it => it.id === pId))
    .filter(Boolean);

  if (recommendedPairings.length > 0) {
    modalPairingsGrid.innerHTML = recommendedPairings.map(pair => `
      <div class="mini-pair-card" data-pair-id="${pair.id}">
        <img src="${pair.image}" alt="${pair.title}" class="mini-pair-img" onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=200&q=80'">
        <div class="mini-pair-info">
          <h5>${pair.title}</h5>
          <p>${pair.currency}${pair.price} • ${pair.dietary[0] || 'Gurme'}</p>
        </div>
      </div>
    `).join('');

    modalPairingsGrid.querySelectorAll('.mini-pair-card').forEach(card => {
      card.addEventListener('click', () => {
        const pId = card.dataset.pairId;
        const target = CULINARY_ITEMS.find(it => it.id === pId);
        if (target) store.openModal(target);
      });
    });
  } else {
    modalPairingsGrid.innerHTML = `<p style="color:var(--text-muted); font-size:0.85rem">Bu lezzete özel tamamlayıcı kurgulanıyor.</p>`;
  }

  modalBackdrop.classList.add('open');
  modalBackdrop.setAttribute('aria-hidden', 'false');
}

/**
 * Render Favorites Drawer
 */
export function renderFavorites(favBadge, favList, toastEl) {
  if (favBadge) favBadge.textContent = store.state.favorites.length;
  
  if (store.state.favorites.length === 0) {
    favList.innerHTML = `
      <div style="text-align:center; padding:3rem 1rem; color:var(--text-muted)">
        <div style="font-size:2.2rem; margin-bottom:0.8rem">🤍</div>
        <p>Henüz favori lezzet kaydetmediniz.</p>
        <span style="font-size:0.8rem;">Kartların üzerindeki kalp simgesine tıklayarak koleksiyon oluşturabilirsiniz.</span>
      </div>
    `;
    return;
  }

  const favItems = store.state.favorites.map(id => CULINARY_ITEMS.find(it => it.id === id)).filter(Boolean);

  favList.innerHTML = favItems.map(item => `
    <div class="fav-item" data-fav-card-id="${item.id}">
      <img src="${item.image}" alt="${item.title}" class="fav-item-thumb">
      <div class="fav-item-details" style="cursor:pointer;">
        <div class="fav-item-title">${item.title}</div>
        <div class="fav-item-price">${item.currency}${item.price}</div>
      </div>
      <button class="fav-remove-btn" data-remove-id="${item.id}" title="Listeden çıkar">✕</button>
    </div>
  `).join('');

  favList.querySelectorAll('.fav-item-details').forEach(el => {
    el.addEventListener('click', (e) => {
      const parent = e.target.closest('.fav-item');
      const item = CULINARY_ITEMS.find(i => i.id === parent.dataset.favCardId);
      if (item) store.openModal(item);
    });
  });

  favList.querySelectorAll('.fav-remove-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.removeId;
      store.toggleFavorite(id);
      showToast(toastEl, 'Favorilerden kaldırıldı');
    });
  });
}

/**
 * Render Visual Dropdown for Main Search
 */
export function updateMainSearchVisualDropdown(dropdownEl, query) {
  if (!dropdownEl) return;
  if (!query || query.trim().length === 0) {
    dropdownEl.classList.remove('active');
    dropdownEl.innerHTML = '';
    return;
  }

  const matches = getFilteredItems().slice(0, 6);
  if (matches.length === 0) {
    dropdownEl.innerHTML = `<div class="dropdown-empty">Eşleşen görsel lezzet bulunamadı.</div>`;
  } else {
    dropdownEl.innerHTML = `
      <div class="dropdown-header-tag">Görsel Lezzet Önerileri (${matches.length})</div>
      ${matches.map(item => `
        <div class="dropdown-item-row" data-item-id="${item.id}">
          <img src="${item.image}" alt="${item.title}" class="dropdown-thumb" onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=150&q=80'">
          <div class="dropdown-info">
            <div class="dropdown-title">${item.title}</div>
            <div class="dropdown-subtitle">📍 ${item.origin} • ⏱️ ${item.prepTime}</div>
          </div>
          <div class="dropdown-price">${item.currency}${item.price}</div>
        </div>
      `).join('')}
    `;

    dropdownEl.querySelectorAll('.dropdown-item-row').forEach(row => {
      row.addEventListener('click', () => {
        const item = CULINARY_ITEMS.find(i => i.id === row.dataset.itemId);
        if (item) {
          store.openModal(item);
          dropdownEl.classList.remove('active');
        }
      });
    });
  }

  dropdownEl.classList.add('active');
}

/**
 * Render Visual Dropdown for Origin Search
 */
export function updateOriginVisualDropdown(dropdownEl, originQuery) {
  if (!dropdownEl) return;
  if (!originQuery || originQuery.trim().length === 0) {
    dropdownEl.classList.remove('active');
    dropdownEl.innerHTML = '';
    return;
  }

  const matches = CULINARY_ITEMS.filter(item => {
    return fuzzyMatch(item.origin, originQuery) ||
           (item.tags || []).some(t => fuzzyMatch(t, originQuery));
  }).slice(0, 6);

  if (matches.length === 0) {
    dropdownEl.innerHTML = `<div class="dropdown-empty">Bu yöreye ait görsel lezzet kaydı bulunamadı.</div>`;
  } else {
    dropdownEl.innerHTML = `
      <div class="dropdown-header-tag">📍 Yöresel Lezzet Görselleri (${matches.length})</div>
      ${matches.map(item => `
        <div class="dropdown-item-row" data-item-id="${item.id}">
          <img src="${item.image}" alt="${item.title}" class="dropdown-thumb" onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=150&q=80'">
          <div class="dropdown-info">
            <div class="dropdown-title">${item.title}</div>
            <div class="dropdown-subtitle">Yöre: ${item.origin} • ${item.category.toUpperCase()}</div>
          </div>
          <div class="dropdown-price">${item.currency}${item.price}</div>
        </div>
      `).join('')}
    `;

    dropdownEl.querySelectorAll('.dropdown-item-row').forEach(row => {
      row.addEventListener('click', () => {
        const item = CULINARY_ITEMS.find(i => i.id === row.dataset.itemId);
        if (item) {
          store.openModal(item);
          dropdownEl.classList.remove('active');
        }
      });
    });
  }

  dropdownEl.classList.add('active');
}

