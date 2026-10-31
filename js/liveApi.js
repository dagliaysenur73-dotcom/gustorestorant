// js/liveApi.js - Live Internet Culinary & Cocktail API Connectors (TheMealDB & TheCocktailDB)

import { CULINARY_ITEMS } from '../data.js';
import { store } from './state.js';

/**
 * Live Internet Discovery Engine - Fetches real-time culinary items & craft cocktails
 */
export async function fetchLiveInternetItem(statusTextEl, onRender, showToast) {
  if (statusTextEl) statusTextEl.textContent = 'İnternetten Yükleniyor...';
  
  try {
    const fetchCocktail = Math.random() > 0.5;
    
    if (fetchCocktail) {
      const res = await fetch('https://www.thecocktaildb.com/api/json/v1/1/random.php');
      const data = await res.json();
      const drink = data.drinks && data.drinks[0];
      
      if (drink) {
        const newItem = {
          id: `live-bev-${drink.idDrink}`,
          category: 'beverages',
          title: drink.strDrink,
          titleEn: drink.strDrink,
          tagline: `${drink.strCategory || 'Kokteyl'} • ${drink.strAlcoholic || 'İçecek'} (${drink.strGlass || 'Kadeh'})`,
          price: Math.floor(Math.random() * 120) + 220,
          currency: '₺',
          prepTime: '4 dk',
          calories: '150 kcal',
          servingTemp: '3°C (Buzlu Kadeh)',
          dietary: [drink.strAlcoholic === 'Non alcoholic' ? 'Alkolsüz' : 'Alkollü', 'Canlı API'],
          flavorProfile: {
            umami: 25,
            acidity: Math.floor(Math.random() * 40) + 50,
            spice: Math.floor(Math.random() * 30) + 10,
            sweetness: Math.floor(Math.random() * 50) + 30,
            richness: Math.floor(Math.random() * 40) + 30
          },
          pairingCategory: ['appetizers', 'seafood'],
          recommendedPairingIds: ['app-1', 'sea-3'],
          chefSecret: `Canlı TheCocktailDB API'den getirildi: ${drink.strInstructions || 'Taze çalkalanarak servis edilir.'}`,
          origin: `Uluslararası Miksoloji (${drink.strCategory || 'Dünya'})`,
          image: drink.strDrinkThumb,
          tags: ['İnternetten Canlı', 'Canlı API', 'Uluslararası', drink.strCategory || 'Kokteyl']
        };

        if (!CULINARY_ITEMS.some(i => i.id === newItem.id)) {
          CULINARY_ITEMS.unshift(newItem);
        }

        if (statusTextEl) statusTextEl.textContent = 'Canlı API: Çevrimiçi';
        if (onRender) onRender();
        store.openModal(newItem);
        if (showToast) showToast(`🌐 İnternetten yeni lezzet çekildi: ${newItem.title}`);
        return;
      }
    } else {
      const res = await fetch('https://www.themealdb.com/api/json/v1/1/random.php');
      const data = await res.json();
      const meal = data.meals && data.meals[0];

      if (meal) {
        let cat = 'food';
        if ((meal.strCategory || '').toLowerCase().includes('seafood')) cat = 'seafood';
        if ((meal.strCategory || '').toLowerCase().includes('chicken')) cat = 'poultry';
        if ((meal.strCategory || '').toLowerCase().includes('starter') || (meal.strCategory || '').toLowerCase().includes('side')) cat = 'appetizers';

        const newItem = {
          id: `live-meal-${meal.idMeal}`,
          category: cat,
          title: meal.strMeal,
          titleEn: meal.strMeal,
          tagline: `${meal.strArea || 'Dünya'} Mutfağı • ${meal.strCategory || 'Gurme Spesiyal'}`,
          price: Math.floor(Math.random() * 200) + 320,
          currency: '₺',
          prepTime: '25 dk',
          calories: '520 kcal',
          servingTemp: '75°C (Sıcak)',
          dietary: [meal.strArea || 'Dünya', 'Canlı API'],
          flavorProfile: {
            umami: Math.floor(Math.random() * 30) + 70,
            acidity: Math.floor(Math.random() * 40) + 30,
            spice: Math.floor(Math.random() * 50) + 20,
            sweetness: Math.floor(Math.random() * 30) + 15,
            richness: Math.floor(Math.random() * 40) + 50
          },
          pairingCategory: ['beverages', 'appetizers'],
          recommendedPairingIds: ['bev-1', 'bev-5'],
          chefSecret: `TheMealDB canlı tarif verisi: ${(meal.strInstructions || '').slice(0, 180)}...`,
          origin: `${meal.strArea || 'Dünya'} Mutfağı`,
          image: meal.strMealThumb,
          tags: ['İnternetten Canlı', 'Canlı API', meal.strArea || 'Dünya', meal.strCategory || 'Yemek']
        };

        if (!CULINARY_ITEMS.some(i => i.id === newItem.id)) {
          CULINARY_ITEMS.unshift(newItem);
        }

        if (statusTextEl) statusTextEl.textContent = 'Canlı API: Çevrimiçi';
        if (onRender) onRender();
        store.openModal(newItem);
        if (showToast) showToast(`🌐 İnternetten yeni tarif çekildi: ${newItem.title}`);
        return;
      }
    }
  } catch (err) {
    console.error('Live API fetch error:', err);
    if (statusTextEl) statusTextEl.textContent = 'API: Çevrimdışı / Hata';
    if (showToast) showToast('⚠️ İnternet bağlantısı kurulamadı veya API yanıt vermedi.');
  }
}

