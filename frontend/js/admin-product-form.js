import './header.js';
import { fetchCategories, fetchAdminProduct, createProduct, updateProduct, ApiError } from './api.js';
import { requireAdmin  } from './admin-guard.js';
import { redirectToLogin } from './nav.js';

const form = document.querySelector('#product-form');
const alertBox = document.querySelector('#form-alert');
const loading = document.querySelector('#loading');
const titleEl = document.querySelector('#form-title');
const archivedNote = document.querySelector('#archived-note');
const categorySelect = document.querySelector('#categoryId');
const submitButton = form.querySelector('button[type="submit"]');

const id = new URLSearchParams(location.search).get('id');
const isEdit = id !== null;

if (requireAdmin()) {
    init();
}

async function init() {
    const action = isEdit ? 'Edit' : 'Add';
    document.title = `Admin · ${action} product - Kim Shop`;
    titleEl.textContent = `${action} product`;
    submitButton.textContent = isEdit ? 'Save changes' : 'Create product';

    try {
        const [categories, product] = await Promise.all([
            fetchCategories(),
            isEdit ? fetchAdminProduct(id) : Promise.resolve(null),
        ]);

        fillCategories(categories);

        if (product) {
            fillForm(product)
        }

        loading.hidden = true;
        form.hidden = false;
        form.addEventListener('submit', save);
    } catch (error) {
        loading.hidden = true;
        if (error instanceof ApiError && error.status === 404) {
            showAlert('This product does not exist.');
            return;
        }
        hanldeError(error);
    }
}

function fillCategories(categories) {
    const options = categories.map(category => new Option(category.name, category.id));
    categorySelect.append(...options);
}

function fillForm(product) {
    field('name').value = product.name;
    field('description').value = product.description ?? '';
    field('price').value = product.price;
    field('stock').value = product.stock;
    field('imageUrl').value = product.imageUrl ?? '';
    field('categoryId').value = product.category.id;
    archivedNote.hidden = product.active;
}

async function save(event) {
    event.preventDefault();
    clearErrors();

    const data = new FormData(form);
    const product = {
        name: data.get('name').trim(),
        description: data.get('description').trim(),
        price: numberOrNull(data.get('price')),
        stock: numberOrNull(data.get('stock')),
        imageUrl: data.get('imageUrl').trim() || null,
        categoryId: numberOrNull(data.get('categoryId')),
    };

    setSaving(true);

    try {
        if (isEdit) {
            await updateProduct(id, product);
        } else {
            await createProduct(product);
        }
        location.href = 'admin-products.html';
    } catch (error) {
        setSaving(false);
        handleError(error);
    }
}

function numberOrNull(value) {
    return value === null || value === '' ? null : Number(value);
}

function field(name) {
    return form.elements.namedItem(name);
}

function handleError(error) {
    if (error instanceof ApiError && error.status === 400 && error.problem.errors) {
        for (const [name, message] of Object.entries(error.problem.errors)) {
            showFieldError(name, message);
        }
        return;
    }
    if (error instanceof ApiError && error.status === 401) {
        redirectToLogin();
        return;
    }
    if (error instanceof ApiError && error.status === 403) {
        showAlert('You do not have access to the admin area.');
        return;
    }
    showAlert(error.message);
}

function showFieldError(name, message) {
    const slot = form.querySelector(`[data-error-for="${name}"]`);
    if (!slot) {
        showAlert(message);
        return;
    }
    slot.textContent = message;
    slot.hidden = false;
    field(name)?.classList.add('invalid');
}

function showAlert(message) {
    alertBox.textContent = message;
    alertBox.hidden = false;
}

function clearErrors() {
    alertBox.hidden = true;
    alertBox.textContent = '';
    for (const slot of form.querySelectorAll('.field-error')) {
        slot.hidden = true;
        slot.textContent = '';
    }
    for (const input of form.querySelectorAll('.invalid')) {
        input.classList.remove('invalid');
    }
}

function setSaving(saving) {
    submitButton.disabled = saving;
    submitButton.textContent = saving ? 'Saving...' : (isEdit ? 'Save changes' : 'Create product');
}