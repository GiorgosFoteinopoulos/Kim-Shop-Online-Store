import './header.js';
import { fetchProduct } from './api.js';
import { lookFor, formatPrice } from './format.js';
import { addToCart } from './cart.js';
import { showProductImage } from './media.js';

const container = document.querySelector('#product');
const template = document.querySelector('#product-detail');

const id = new URLSearchParams(window.location.search).get('id');

load();

async function load() {
    if (!id || !/^\d+$/.test(id)) {
        showMessage('Product not found.', 'This link does not point to a valid product.'); 
        return;
    }
    try {
        render(await fetchProduct(id));
    } catch (error) {
        showMessage('Product not found.', error.message);
    }
}

function render(product) {
    document.title = `${product.name} · Kim Shop`;

    const view = template.content.firstElementChild.cloneNode(true);
    const look = lookFor(product.category.slug);
    view.style.setProperty('--hue', look.hue);
    view.querySelector('.detail-emoji').textContent = look.emoji;
    showProductImage(view.querySelector('.detail-media'), product);
    view.querySelector('.detail-category').textContent = product.category.name;
    view.querySelector('.detail-title').textContent = product.name;
    view.querySelector('.detail-price').textContent = formatPrice(product.price);
    view.querySelector('.detail-desc').textContent = product.description ?? '';

    const stock = view.querySelector('.detail-stock');
    const form = view.querySelector('.add-form');
    const quantity = view.querySelector('#qty');
    const added = view.querySelector('.added-msg');

    if (product.inStock) {
        stock.textContent = product.stock <= 5 ? `Only ${product.stock} left` : 'In stock';
        quantity.max = product.stock;
    } else {
        stock.textContent = 'Out of stock';
        stock.classList.add('out');
        form.querySelectorAll('button, input').forEach(control => control.disabled = true);
    }


    form.addEventListener('click', (event) => {
        const step = event.target.closest('[data-step]')?.dataset.step;
        if (!step) return;
        quantity.value = clamp(Number(quantity.value) + Number(step), 1, product.stock);
    });

    form.addEventListener('submit', (event) => {
        event.preventDefault();                        
        addToCart(product, clamp(Number(quantity.value), 1, product.stock));
        added.hidden = false;
    });

    container.replaceChildren(view);
}


function clamp(value, min, max) {
    const safe = Number.isFinite(value) ? value : min;
    return Math.min(Math.max(safe, min), max);
}

function showMessage(title, text) {
    const box = document.createElement('div');
    box.className = 'message';
    const heading = document.createElement('h3');
    heading.textContent = title;
    const paragraph = document.createElement('p');
    paragraph.textContent = text;
    box.append(heading, paragraph);
    container.replaceChildren(box);
}