import { fetchCategories, fetchProducts } from './api.js';
import './header.js';
import { lookFor, formatPrice } from './format.js';
import { showProductImage } from './media.js';

const PAGE_SIZE = 8;

const CATEGORY_LOOK = {
    'electronics':     { emoji: '🎧', hue: 225 },
    'books':           { emoji: '📚', hue: 30 },
    'home-kitchen':    { emoji: '🍳', hue: 150 },
    'sports-outdoors': { emoji: '🏃', hue: 350 },
};
const DEFAULT_LOOK = { emoji: '🛍️', hue: 260 };


const priceFormat = new Intl.NumberFormat('el-GR', { style: 'currency', currency: 'EUR' });

const state = { category: '', search: '', sort: 'name,asc', page: 0 };

const el = {
    categories: document.querySelector('#categories'),
    search: document.querySelector('#search'),
    sort: document.querySelector('#sort'),
    products: document.querySelector('#products'),
    info: document.querySelector('#result-info'),
    pagination: document.querySelector('#pagination'),
    cardTemplate: document.querySelector('#product-card'),
};

let latestRequest = 0;

init();

async function init() {
    bindEvents();
    await loadCategories();
    await loadProducts();
}

function bindEvents() {
    el.sort.addEventListener('change', () => {
        state.sort = el.sort.value;
        state.page = 0;
        loadProducts();
    });

   
    el.search.addEventListener('input', debounce(() => {
        state.search = el.search.value.trim();
        state.page = 0;
        loadProducts();
    }, 300));
}


async function loadCategories() {
    try {
        const categories = await fetchCategories();
        renderCategories([{ slug: '', name: 'All' }, ...categories]);
    } catch (error) {
        console.error('Categories could not be loaded:', error);  
    }
}

function renderCategories(categories) {
    const chips = categories.map(category => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = category.slug === state.category ? 'chip active' : 'chip';
        chip.textContent = category.name;
        chip.addEventListener('click', () => {
            state.category = category.slug;
            state.page = 0;
            renderCategories(categories);      
            loadProducts();
        });
        return chip;
    });
    el.categories.replaceChildren(...chips);
}


async function loadProducts() {
    const requestId = ++latestRequest;
    showLoading();
    try {
        const page = await fetchProducts({
            category: state.category,
            q: state.search,
            sort: state.sort,
            page: state.page,
            size: PAGE_SIZE,
        });
        if (requestId !== latestRequest) return;  
        renderProducts(page);
        renderPagination(page);
    } catch (error) {
        if (requestId !== latestRequest) return;
        showError(error.message);
    }
}

function renderProducts(page) {
    if (page.content.length === 0) {
        el.info.textContent = '';
        el.products.replaceChildren(message('No products found.', 'Try another word or category.'));
        return;
    }
    el.info.textContent = `${page.totalElements} product${page.totalElements === 1 ? '' : 's'}`;
    el.products.replaceChildren(...page.content.map(createCard));
}

function createCard(product) {
    const card = el.cardTemplate.content.firstElementChild.cloneNode(true);
    const look = lookFor(product.category.slug);

    card.href = `product.html?id=${product.id}`;
    card.style.setProperty('--hue', look.hue);
    card.querySelector('.card-emoji').textContent = look.emoji;
    showProductImage(card.querySelector('.card-media'), product);
    card.querySelector('.card-category').textContent = product.category.name;
    card.querySelector('.card-title').textContent = product.name;
    card.querySelector('.card-desc').textContent = product.description ?? '';
    card.querySelector('.card-price').textContent = formatPrice(product.price);

    if (product.inStock) {
        card.querySelector('.card-stock').textContent = `${product.stock} in stock`;
        card.querySelector('.card-badge').remove();
    } else {
        card.classList.add('sold-out');
    }
    return card;
}


function renderPagination(page) {
    if (page.totalPages <= 1) {
        el.pagination.replaceChildren();
        return;
    }
    const buttons = [pageButton('‹ Prev', page.page - 1, page.first)];
    for (let i = 0; i < page.totalPages; i++) {
        buttons.push(pageButton(String(i + 1), i, false, i === page.page));
    }
    buttons.push(pageButton('Next ›', page.page + 1, page.last));
    el.pagination.replaceChildren(...buttons);
}

function pageButton(label, targetPage, disabled, current = false) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = current ? 'page-btn current' : 'page-btn';
    button.textContent = label;
    button.disabled = disabled;
    if (current) button.setAttribute('aria-current', 'page');
    button.addEventListener('click', () => {
        state.page = targetPage;
        loadProducts();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    return button;
}



function showLoading() {
    el.info.textContent = 'Loading…';
    const placeholders = Array.from({ length: PAGE_SIZE }, () => {
        const placeholder = document.createElement('div');
        placeholder.className = 'card skeleton';
        return placeholder;
    });
    el.products.replaceChildren(...placeholders);
}

function showError(text) {
    el.info.textContent = '';
    el.pagination.replaceChildren();
    el.products.replaceChildren(message('Could not load products.', text));
}

function message(title, subtitle) {
    const box = document.createElement('div');
    box.className = 'message';
    const heading = document.createElement('h3');
    heading.textContent = title;
    const text = document.createElement('p');
    text.textContent = subtitle;
    box.append(heading, text);
    return box;
}


function debounce(fn, delay) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}