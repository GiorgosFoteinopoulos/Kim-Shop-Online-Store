import './header.js';
import { fetchAdminProducts, archiveProduct, restoreProduct, ApiError } from './api.js';
import { formatPrice } from './format.js';
import { requireAdmin } from './admin-guard.js';
import { redirectToLogin } from './nav.js';

 const tableBody = document.querySelector('#products-body');
 const rowTemplate = document.querySelector('#product-row');
 const messageBox = document.querySelector('#admin-message');
 const pageInfo = document.querySelector('#page-info');
 const prevButton = document.querySelector('#prev-page');
 const nextButton = document.querySelector('#next-page');

 const PAGE_SIZE = 20;
 let currentPage = 0;

 if (requireAdmin()) {
    prevButton.addEventListener('click', () => load(currentPage - 1));
    nextButton.addEventListener('click', () => load(currentPage + 1));
    load(0);
 }

 async function load(page) {
    try {
        const result = await fetchAdminProducts({ page, size: PAGE_SIZE, sort: 'id'});

        currentPage = result.page;
        tableBody.replaceChildren(...result.content.map(createRow));

        pageInfo.textContent =
        `Page ${result.page + 1} of ${Math.max(result.totalPages, 1)} · ${result.totalElements} products`;
        prevButton.disabled = result.first;
        nextButton.disabled = result.last;
        messageBox.hidden = true;
    } catch (error) {
        handleError(error);
    }  
 }

 function createRow(product) {
    const row = rowTemplate.content.firstElementChild.cloneNode(true);
    row.classList.toggle('is-archived', !product.active);

    row.querySelector('.col-id').textContent = product.id;
    row.querySelector('.col-name').textContent = product.name;
    row.querySelector('.col-category').textContent = product.category.name;
    row.querySelector('.col-price').textContent = formatPrice(product.price);
    row.querySelector('.col-stock').textContent = product.stock;

    const pill = row.querySelector('.pill');
    pill.textContent = product.active ? 'Active' : 'Archived';
    pill.classList.add(product.active ? 'pill-active' : 'pill-archived');

    row.querySelector('.edit-link').href = `admin-product-form.html?id=${product.id}`;

    const toggle = row.querySelector('.toggle-button');
    toggle.textContent = product.active ? 'Archive' : 'Restore';
    toggle.addEventListener('click', async () => {
        toggle.disabled = true;
        try {
            if (product.active) {
                await archiveProduct(product.id);
            } else {
                await restoreProduct(product.id);
            }
            await load(currentPage);
        } catch (error) {
            toggle.disabled = false;
            handleError(error);
        }
    });
    return row;
 }

 function handleError(error) {
    if (error instanceof ApiError && error.status === 401) {
        redirectToLogin();
        return;
    }
    if (error instanceof ApiError && error.status === 403) { 
        showMessage('You do not have access to the admin area.');
    tableBody.replaceChildren();
    return;
 }
 showMessage(error.message);
}

function showMessage(text) {
    messageBox.textContent = text;
    messageBox.hidden = false;
}