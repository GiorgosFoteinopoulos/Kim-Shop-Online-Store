import './header.js';
import { fetchAdminOrders, changeOrderStatus, ApiError } from './api.js';
import { formatPrice } from './format.js';
import { requireAdmin } from './admin-guard.js';
import { redirectToLogin } from './nav.js';

const tableBody = document.querySelector('#orders-body');
const rowTemplate = document.querySelector('#order-row');
const messageBox = document.querySelector('#admin-message');
const pageInfo = document.querySelector('#page-info');
const prevButton = document.querySelector('#prev-page');
const nextButton = document.querySelector('#next-page');
const filterButtons = document.querySelectorAll('[data-status-filter]');

const ACTION_LABELS = { PAID: 'Mark as paid', SHIPPED: 'Ship', CANCELLED: 'Cancel' };
const STATUS_LABELS = { PLACED: 'Placed', PAID: 'Paid', SHIPPED: 'Shipped', CANCELLED: 'Cancelled' };

const dateFormat = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
const PAGE_SIZE = 20;

let currentPage = 0;
let currentStatus = '';

if (requireAdmin()) {
    for (const button of filterButtons) {
        button.addEventListener('click', () => {
            currentStatus = button.dataset.statusFilter;
            showActiveFilter();
            hideMessage();
            load();
        });
    }
    prevButton.addEventListener('click', () => load(currentPage -1));
    nextButton.addEventListener('click', () => load(currentPage + 1));
    load();
}

async function load(page) {
    try {
        const result = await fetchAdminOrders({status: currentStatus, page, size: PAGE_SIZE });

        if (result.content.length === 0 && page > 0) {
            return load(page - 1);
        }

        currentPage = result.page;
        tableBody.replaceChildren(...(result.content.length > 0
            ? result.content.map(createRow)
            : [emptyRow()]));

        pageInfo.textContent =
        `Page ${result.page + 1} of ${Math.max(result.totalPages, 1)} · ${result.totalElements} orders`;
        prevButton.disabled = result.first;
        nextButton.disabled = result.last;
    } catch (error) {
        handleError(error);
    }
}

function createRow(order) {
    const row = rowTemplate.content.firstElementChild.cloneNode(true);
    const reference = '#' + order.id.slice(0, 8).toUpperCase();

    row.querySelector('.col-ref').textContent = reference;
    row.querySelector('.col-date').textContent = dateFormat.format(new Date(order.createdAt));
    row.querySelector('.customer-name').textContent = order.customerName;
    row.querySelector('.customer-email').textContent = order.customerEmail;
    row.querySelector('.col-total').textContent = formatPrice(order.total);

    const pill = row.querySelector('.pill');
    pill.textContent = STATUS_LABELS[order.status] ?? order.status;
    pill.classList.add(`pill-${order.status.toLowerCase()}`);

    const actions = row.querySelector('.col-actions');
    for (const next of order.nextStatuses) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = next === 'CANCELLED' ? 'toggle-button danger' : 'toggle-button';
        button.textContent = ACTION_LABELS[next] ?? next;
        button.addEventListener('click', () => move(order, next, reference, row));
        actions.append(button);
    }
    if (order.nextStatuses.length === 0) {
        actions.textContent = '-';
    }
    return row;
}

async function move(order, next, reference, row) {
    if (next === 'CANCELLED'
        && !confirm(`Cancel order ${reference}?\n\nIts items go back into stock. This cannot be undone.`)) {
            return;
        }
        hideMessage();
        row.querySelectorAll('button').forEach(button => button.disabled = true);
        try {
            await changeOrderStatus(order.id, next);
        } catch (error) {
            handleError(error);
        }
        await load(currentPage);
}

function emptyRow() {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 6;
    cell.className = 'hint';
    cell.textContent = 'No orders with this status.';
    row.append(cell);
    return row;
}

function showActiveFilter() {
    for (const button of filterButtons) {
        const active = button.dataset.statusFilter === currentStatus;
        button.classList.toggle('active', active);
        button.setAttribute('aria-pressed', String(active));
    }
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
    if (error instanceof ApiError && error.status === 409) {
        showMessage(`This order was changed meanwhile: ${error.message}`);
        return;
    }
    showMessage(error.message);
}

function showMessage(text) {
    messageBox.textContent = text;
    messageBox.hidden = false;
}

function hideMessage() {
    messageBox.hidden = true;
    messageBox.textContent = '';
}


