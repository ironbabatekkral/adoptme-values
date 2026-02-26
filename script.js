const translations = {
    en: {
        title: "Adopt Me <span>Values</span>",
        subtitle: "Select a pet to view its incredible trading values",
        search_placeholder: "Search for a pet or item...",
        cat_all: "All Items",
        cat_pets: "Pets",
        cat_vehicles: "Vehicles",
        cat_toys: "Toys",
        cat_strollers: "Strollers",
        cat_gifts: "Gifts",
        sort_label: "Sort By:",
        sort_default: "Default Order",
        sort_newest: "Newest Added",
        sort_val_desc: "Value: High to Low",
        sort_val_asc: "Value: Low to High",
        sort_name: "Name: A to Z",
        tab_regular: "Regular",
        tab_neon: "Neon",
        tab_mega: "Mega",
        modal_base_value: "Base Value",
        modal_value: "Value",
        modal_no_potion: "No Potion",
        modal_ride: "Ride (R)",
        modal_fly: "Fly (F)",
        modal_fly_ride: "Fly & Ride (FR)",
        loading: "Loading pets...",
        no_pets: "No items found..."
    },
    tr: {
        title: "Adopt Me <span>Değerleri</span>",
        subtitle: "Değerini görmek için bir pet veya eşya seç",
        search_placeholder: "Bir pet veya eşya ara...",
        cat_all: "Tümü",
        cat_pets: "Petler",
        cat_vehicles: "Araçlar",
        cat_toys: "Oyuncaklar",
        cat_strollers: "Bebek Arabaları",
        cat_gifts: "Hediyeler",
        sort_label: "Sırala:",
        sort_default: "Varsayılan",
        sort_newest: "En Yeniler",
        sort_val_desc: "Değer: Pahalıdan Ucuza",
        sort_val_asc: "Değer: Ucuzdan Pahalıya",
        sort_name: "İsim: A'dan Z'ye",
        tab_regular: "Normal",
        tab_neon: "Neon",
        tab_mega: "Mega",
        modal_base_value: "Taban Değeri",
        modal_value: "Değer",
        modal_no_potion: "İksirsiz",
        modal_ride: "Binek (R)",
        modal_fly: "Uçan (F)",
        modal_fly_ride: "Uçan Binek (FR)",
        loading: "Yükleniyor...",
        no_pets: "Eşya bulunamadı..."
    }
};

let currentLang = 'en';
let allPets = [];
let currentCategory = 'all';
let currentSort = 'default';
let currentPet = null;
let currentTab = 'regular'; // 'regular', 'neon', 'mega'

let currentFilteredPets = [];
let currentRenderedCount = 0;
const ITEMS_PER_PAGE = 100;
let gridObserver = null;

const grid = document.getElementById('petGrid');
const searchInput = document.getElementById('searchInput');
const sortSelect = document.getElementById('sortSelect');
const langSelect = document.getElementById('langSelect');

// Modal Elements
const modal = document.getElementById('valueModal');
const closeBtn = document.getElementById('closeModal');
const modalPetImage = document.getElementById('modalPetImage');
const modalPetName = document.getElementById('modalPetName');
const modalPetRarity = document.getElementById('modalPetRarity');
const valuesGrid = document.getElementById('valuesGrid');
const tabBtns = document.querySelectorAll('.tab-btn');
const catBtns = document.querySelectorAll('.cat-btn');

async function init() {
    try {
        const response = await fetch('adoptme_values.json');
        const data = await response.json();

        // Save original index so we can safely return to 'default' order
        allPets = data.map((item, index) => ({ ...item, _origIndex: index }));

        renderGrid(allPets);
        applyTranslations();

    } catch (error) {
        console.error("Failed to load pets:", error);
        grid.innerHTML = `<div class="loading-state">Failed to load data. Make sure you run this on a server.</div>`;
    }
}

function applyTranslations() {
    const t = translations[currentLang];

    // Update elements with textcontent or innerHTML
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const prop = el.getAttribute('data-i18n-prop');

        if (t[key]) {
            if (prop) {
                el.setAttribute(prop, t[key]);
            } else {
                el.innerHTML = t[key]; // innerHTML for the Title span
            }
        }
    });

    // Re-render strings in modal if open
    if (modal.classList.contains('active')) {
        renderValues();
    }

    // Re-render empty grid message if needed
    if (allPets.length === 0 || grid.innerHTML.includes('No items')) {
        if (grid.innerHTML.includes('<div')) {
            // It's empty state
            filterAndRender();
        }
    }
}

function setupObserver() {
    if (gridObserver) gridObserver.disconnect();

    const options = {
        root: null,
        rootMargin: '100px', // Load a bit before it comes into view
        threshold: 0.1
    };

    gridObserver = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
            renderMoreItems();
        }
    }, options);
}

function renderGrid(pets) {
    currentFilteredPets = pets;
    currentRenderedCount = 0;
    grid.innerHTML = '';

    if (pets.length === 0) {
        grid.innerHTML = `<div class="loading-state">${translations[currentLang].no_pets}</div>`;
        return;
    }

    renderMoreItems();
}

function renderMoreItems() {
    if (currentRenderedCount >= currentFilteredPets.length) return;

    const nextChunk = currentFilteredPets.slice(currentRenderedCount, currentRenderedCount + ITEMS_PER_PAGE);

    // remove observer from previous last element
    const lastEl = grid.lastElementChild;
    if (lastEl && gridObserver) gridObserver.unobserve(lastEl);

    nextChunk.forEach(pet => {
        const card = document.createElement('div');
        card.className = 'pet-card';

        // Format image path: the JSON has `/images/pets/Name.png`, local is `images/Name.png`
        let imgPath = 'images/placeholder.svg'; // Fallback
        if (pet.image) {
            const fileName = pet.image.split('/').pop();
            imgPath = `images/${fileName}`;
        }

        card.innerHTML = `
            <img src="${imgPath}" alt="${pet.name}" loading="lazy" onerror="this.src='images/placeholder.svg'">
            <h3 class="pet-name">${pet.name}</h3>
            <span class="pet-rarity">${pet.rarity || 'Unknown'}</span>
        `;

        card.addEventListener('click', () => openModal(pet, imgPath));
        grid.appendChild(card);
    });

    currentRenderedCount += nextChunk.length;

    // add observer to new last element
    if (currentRenderedCount < currentFilteredPets.length) {
        if (!gridObserver) setupObserver();
        gridObserver.observe(grid.lastElementChild);
    }
}

function openModal(pet, imgPath) {
    currentPet = pet;

    modalPetImage.src = imgPath;
    modalPetName.textContent = pet.name;
    modalPetRarity.textContent = pet.rarity;

    // Set colors based on rarity
    let color1 = '#8b5cf6', color2 = '#3b82f6';
    if (pet.rarity === 'legendary') { color1 = '#f59e0b'; color2 = '#ef4444'; }
    if (pet.rarity === 'ultra rare') { color1 = '#10b981'; color2 = '#3b82f6'; }
    if (pet.rarity === 'rare') { color1 = '#3b82f6'; color2 = '#6366f1'; }
    if (pet.rarity === 'uncommon') { color1 = '#10b981'; color2 = '#059669'; }
    if (pet.rarity === 'common') { color1 = '#9ca3af'; color2 = '#6b7280'; }

    modalPetRarity.style.background = `linear-gradient(135deg, ${color1}, ${color2})`;

    // Show/hide tabs depending on item type
    const tabsContainer = document.querySelector('.values-tabs');
    if (pet.type === 'pets') {
        tabsContainer.style.display = 'flex';
        setTab('regular');
    } else {
        tabsContainer.style.display = 'none';
        renderSingleValue(pet);
    }

    modal.classList.add('active');
}

function closeModal() {
    modal.classList.remove('active');
}

function setTab(tabId) {
    currentTab = tabId;

    // Update active button
    tabBtns.forEach(b => {
        b.classList.remove('active');
        if (b.dataset.tab === tabId) b.classList.add('active');
    });

    renderValues();
}

function renderSingleValue(item) {
    const t = translations[currentLang];
    valuesGrid.innerHTML = `
        <div class="val-item main">
            <span class="val-label">${t.modal_value}</span>
            <span class="val-number">${formatVal(item.value)}</span>
        </div>
    `;
}

function renderValues() {
    if (!currentPet) return;

    const data = currentPet[currentTab];
    if (!data) {
        valuesGrid.innerHTML = `<div>No data available</div>`;
        return;
    }

    const t = translations[currentLang];

    valuesGrid.innerHTML = `
        <div class="val-item main">
            <span class="val-label">${t.modal_base_value}</span>
            <span class="val-number">${formatVal(data.value)}</span>
        </div>
        <div class="val-item">
            <span class="val-label">${t.modal_no_potion}</span>
            <span class="val-number">${formatVal(data.no_potion)}</span>
        </div>
        <div class="val-item">
            <span class="val-label">${t.modal_ride}</span>
            <span class="val-number">${formatVal(data.ride)}</span>
        </div>
        <div class="val-item">
            <span class="val-label">${t.modal_fly}</span>
            <span class="val-number">${formatVal(data.fly)}</span>
        </div>
        <div class="val-item">
            <span class="val-label">${t.modal_fly_ride}</span>
            <span class="val-number">${formatVal(data.fly_ride)}</span>
        </div>
    `;
}

function formatVal(val) {
    if (val === null || val === undefined || val === '') return '-';
    return Number(val).toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function filterAndRender() {
    const q = searchInput.value.toLowerCase().trim();

    let filtered = allPets;

    if (currentCategory !== 'all') {
        filtered = filtered.filter(p => p.type === currentCategory);
    }

    if (q !== '') {
        filtered = filtered.filter(p => p.name.toLowerCase().includes(q));
    }

    // Helper to get base value
    const getBaseValue = (item) => {
        if (item.type === 'pets' && item.regular) return Number(item.regular.value) || 0;
        return Number(item.value) || 0;
    };

    // Sort
    filtered.sort((a, b) => {
        if (currentSort === 'newest') return (b.id || 0) - (a.id || 0); // Assuming higher ID is newer
        if (currentSort === 'val_desc') return getBaseValue(b) - getBaseValue(a);
        if (currentSort === 'val_asc') return getBaseValue(a) - getBaseValue(b);
        if (currentSort === 'name_asc') return a.name.localeCompare(b.name);

        // default
        return a._origIndex - b._origIndex;
    });

    renderGrid(filtered);
}

// Event Listeners
searchInput.addEventListener('input', filterAndRender);

sortSelect.addEventListener('change', (e) => {
    currentSort = e.target.value;
    filterAndRender();
});

langSelect.addEventListener('change', (e) => {
    currentLang = e.target.value;
    applyTranslations();
});

catBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        catBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentCategory = btn.dataset.category;
        filterAndRender();
    });
});

closeBtn.addEventListener('click', closeModal);

modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
});

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => setTab(btn.dataset.tab));
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) closeModal();
});

// Start
init();
